import { isSupabaseConfigured, supabase } from './supabaseClient';

export type ModuleNamespace =
  | 'dossiers'
  | 'career'
  | 'campus'
  | 'languages'
  | 'health'
  | 'housing'
  | 'legal'
  | 'mobility'
  | 'studio'
  | 'google_workspace';

export type ModuleRecordStatus = 'draft' | 'active' | 'completed' | 'archived' | 'deleted';
export type SyncPhase = 'idle' | 'syncing' | 'offline' | 'error';

export interface ModuleRecord<T extends object> {
  id: string;
  ownerId: string;
  module: ModuleNamespace;
  recordType: string;
  status: ModuleRecordStatus;
  payload: T;
  version: number;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'queued';
}

export interface ModuleMutationOptions {
  id?: string;
  ownerId?: string;
  status?: ModuleRecordStatus;
  idempotencyKey?: string;
}

interface QueuedOperation {
  id: string;
  ownerId: string;
  action: 'upsert' | 'delete';
  record: ModuleRecord<object>;
  queuedAt: string;
  attempts: number;
}

interface StoredRecord extends ModuleRecord<object> {}

const DB_NAME = 'mokchat-module-sync';
const DB_VERSION = 1;
const RECORDS_STORE = 'pending-records';
const QUEUE_STORE = 'mutation-queue';

const nowIso = () => new Date().toISOString();
const newId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else bytes.forEach((_value, index) => { bytes[index] = Math.floor(Math.random() * 256); });
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const mapRow = <T extends object>(row: Record<string, unknown>, syncStatus: 'synced' | 'queued' = 'synced'): ModuleRecord<T> => ({
  id: String(row.id),
  ownerId: String(row.owner_id),
  module: row.module as ModuleNamespace,
  recordType: String(row.record_type),
  status: row.status as ModuleRecordStatus,
  payload: (row.payload ?? {}) as T,
  version: Number(row.version ?? 1),
  idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : undefined,
  createdAt: String(row.created_at ?? nowIso()),
  updatedAt: String(row.updated_at ?? nowIso()),
  syncStatus,
});

const toRow = (record: ModuleRecord<object>) => ({
  id: record.id,
  owner_id: record.ownerId,
  module: record.module,
  record_type: record.recordType,
  status: record.status,
  payload: record.payload,
  version: record.version,
  idempotency_key: record.idempotencyKey ?? null,
  updated_at: record.updatedAt,
});

class ModuleRepository {
  private phase: SyncPhase = 'idle';
  private listeners = new Set<(phase: SyncPhase) => void>();
  private onlineListenerInstalled = false;

  subscribe(listener: (phase: SyncPhase) => void): () => void {
    this.listeners.add(listener);
    listener(this.phase);
    this.installOnlineListener();
    return () => this.listeners.delete(listener);
  }

  getSyncPhase(): SyncPhase {
    return this.phase;
  }

  async list<T extends object>(
    module: ModuleNamespace,
    recordType: string,
    ownerId?: string,
  ): Promise<ModuleRecord<T>[]> {
    const resolvedOwner = await this.resolveOwner(ownerId);
    const pending = await this.getPendingRecords<T>(resolvedOwner, module, recordType);

    if (!isSupabaseConfigured || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      this.setPhase('offline');
      return pending;
    }

    const { data, error } = await supabase
      .from('module_records')
      .select('*')
      .eq('owner_id', resolvedOwner)
      .eq('module', module)
      .eq('record_type', recordType)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) {
      this.setPhase('error');
      if (pending.length > 0) return pending;
      throw new Error(`MODULE_LIST_FAILED:${error.code ?? 'UNKNOWN'}`);
    }

    const remote = (data ?? []).map((row) => mapRow<T>(row));
    const pendingById = new Map(pending.map((record) => [record.id, record]));
    const merged = remote.map((record) => pendingById.get(record.id) ?? record);
    for (const record of pending) {
      if (!remote.some((item) => item.id === record.id)) merged.unshift(record);
    }
    this.setPhase('idle');
    return merged.filter((record) => record.status !== 'deleted');
  }

  async upsert<T extends object>(
    module: ModuleNamespace,
    recordType: string,
    payload: T,
    options: ModuleMutationOptions = {},
  ): Promise<ModuleRecord<T>> {
    const ownerId = await this.resolveOwner(options.ownerId);
    const timestamp = nowIso();
    const record: ModuleRecord<T> = {
      id: options.id ?? newId(),
      ownerId,
      module,
      recordType,
      status: options.status ?? 'active',
      payload,
      version: 1,
      idempotencyKey: options.idempotencyKey,
      createdAt: timestamp,
      updatedAt: timestamp,
      syncStatus: 'queued',
    };

    if (await this.tryRemoteUpsert(record as ModuleRecord<object>)) {
      return { ...record, syncStatus: 'synced' };
    }

    await this.enqueue('upsert', record as ModuleRecord<object>);
    this.setPhase(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
    return record;
  }

  async upsertSingleton<T extends object>(
    module: ModuleNamespace,
    recordType: string,
    payload: T,
    options: Omit<ModuleMutationOptions, 'id'> = {},
  ): Promise<ModuleRecord<T>> {
    const existing = (await this.list<T>(module, recordType, options.ownerId))[0];
    return this.upsert(module, recordType, payload, {
      ...options,
      id: existing?.id,
      idempotencyKey: options.idempotencyKey ?? `${recordType}:singleton`,
    });
  }

  async remove(module: ModuleNamespace, recordType: string, id: string, ownerId?: string): Promise<void> {
    const resolvedOwner = await this.resolveOwner(ownerId);
    const timestamp = nowIso();
    const tombstone: ModuleRecord<object> = {
      id,
      ownerId: resolvedOwner,
      module,
      recordType,
      status: 'deleted',
      payload: {},
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      syncStatus: 'queued',
    };

    if (isSupabaseConfigured && (typeof navigator === 'undefined' || navigator.onLine)) {
      const { error } = await supabase.from('module_records').delete().eq('id', id).eq('owner_id', resolvedOwner);
      if (!error) {
        await this.deleteLocalRecord(id);
        return;
      }
    }
    await this.enqueue('delete', tombstone);
    this.setPhase('offline');
  }

  async flush(): Promise<{ synced: number; failed: number }> {
    if (!isSupabaseConfigured || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      this.setPhase('offline');
      return { synced: 0, failed: 0 };
    }
    const ownerId = await this.resolveOwner();
    const operations = (await this.getAll<QueuedOperation>(QUEUE_STORE))
      .filter((operation) => operation.ownerId === ownerId)
      .sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));

    this.setPhase('syncing');
    let synced = 0;
    let failed = 0;
    for (const operation of operations) {
      try {
        let error: { code?: string } | null = null;
        if (operation.action === 'upsert') {
          ({ error } = await supabase.from('module_records').upsert(toRow(operation.record), { onConflict: 'id' }));
        } else {
          ({ error } = await supabase.from('module_records').delete().eq('id', operation.record.id).eq('owner_id', ownerId));
        }
        if (error) throw error;
        await this.deleteValue(QUEUE_STORE, operation.id);
        await this.deleteLocalRecord(operation.record.id);
        synced += 1;
      } catch {
        failed += 1;
        await this.put(QUEUE_STORE, { ...operation, attempts: operation.attempts + 1 });
      }
    }
    this.setPhase(failed > 0 ? 'error' : 'idle');
    return { synced, failed };
  }

  private async tryRemoteUpsert(record: ModuleRecord<object>): Promise<boolean> {
    if (!isSupabaseConfigured || (typeof navigator !== 'undefined' && !navigator.onLine)) return false;
    const { error } = await supabase.from('module_records').upsert(toRow(record), { onConflict: 'id' });
    if (error) {
      this.setPhase('error');
      return false;
    }
    await this.deleteLocalRecord(record.id);
    this.setPhase('idle');
    return true;
  }

  private async resolveOwner(ownerId?: string): Promise<string> {
    if (ownerId) return ownerId;
    const { data: sessionData } = await supabase.auth.getSession();
    const id = sessionData.session?.user.id;
    if (!id) throw new Error('AUTH_REQUIRED');
    return id;
  }

  private setPhase(next: SyncPhase) {
    this.phase = next;
    this.listeners.forEach((listener) => listener(next));
  }

  private installOnlineListener() {
    if (this.onlineListenerInstalled || typeof window === 'undefined') return;
    this.onlineListenerInstalled = true;
    window.addEventListener('online', () => void this.flush());
    window.addEventListener('offline', () => this.setPhase('offline'));
  }

  private async enqueue(action: QueuedOperation['action'], record: ModuleRecord<object>): Promise<void> {
    const operation: QueuedOperation = {
      id: `${record.id}:${action}`,
      ownerId: record.ownerId,
      action,
      record,
      queuedAt: nowIso(),
      attempts: 0,
    };
    await Promise.all([this.put(RECORDS_STORE, record), this.put(QUEUE_STORE, operation)]);
  }

  private async getPendingRecords<T extends object>(ownerId: string, module: ModuleNamespace, recordType: string): Promise<ModuleRecord<T>[]> {
    const records = await this.getAll<StoredRecord>(RECORDS_STORE);
    return records
      .filter((record) => record.ownerId === ownerId && record.module === module && record.recordType === recordType)
      .map((record) => ({ ...record, payload: record.payload as T, syncStatus: 'queued' }));
  }

  private openDb(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(RECORDS_STORE)) db.createObjectStore(RECORDS_STORE, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async put(storeName: string, value: object): Promise<void> {
    const db = await this.openDb();
    if (!db) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.openDb();
    if (!db) return [];
    const result = await new Promise<T[]>((resolve, reject) => {
      const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
      request.onsuccess = () => resolve((request.result ?? []) as T[]);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  }

  private async deleteValue(storeName: string, key: string): Promise<void> {
    const db = await this.openDb();
    if (!db) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  private deleteLocalRecord(id: string): Promise<void> {
    return this.deleteValue(RECORDS_STORE, id);
  }
}

export const moduleRepository = new ModuleRepository();
