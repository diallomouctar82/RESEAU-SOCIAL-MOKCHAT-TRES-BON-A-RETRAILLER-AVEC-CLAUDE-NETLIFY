import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  moduleRepository,
  type ModuleMutationOptions,
  type ModuleNamespace,
  type ModuleRecord,
  type SyncPhase,
} from '../services/moduleRepository';

const userFacingError = (error: unknown): string => {
  if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
    return 'Votre session a expiré. Reconnectez-vous pour retrouver ces données.';
  }
  return 'Impossible de charger ou synchroniser ces données pour le moment.';
};

export interface ModuleRecordsState<T extends object> {
  records: ModuleRecord<T>[];
  isLoading: boolean;
  error: string | null;
  syncPhase: SyncPhase;
  hasQueuedChanges: boolean;
  reload: () => Promise<void>;
  retrySync: () => Promise<void>;
  save: (payload: T, options?: Omit<ModuleMutationOptions, 'ownerId'>) => Promise<ModuleRecord<T>>;
  saveSingleton: (payload: T, options?: Omit<ModuleMutationOptions, 'ownerId' | 'id'>) => Promise<ModuleRecord<T>>;
  remove: (id: string) => Promise<void>;
}

export const useModuleRecords = <T extends object>(
  module: ModuleNamespace,
  recordType: string,
  ownerId: string,
): ModuleRecordsState<T> => {
  const [records, setRecords] = useState<ModuleRecord<T>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncPhase, setSyncPhase] = useState<SyncPhase>(moduleRepository.getSyncPhase());

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRecords(await moduleRepository.list<T>(module, recordType, ownerId));
    } catch (loadError) {
      setError(userFacingError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [module, ownerId, recordType]);

  useEffect(() => {
    const unsubscribe = moduleRepository.subscribe(setSyncPhase);
    void reload();
    return unsubscribe;
  }, [reload]);

  const save = useCallback(async (
    payload: T,
    options: Omit<ModuleMutationOptions, 'ownerId'> = {},
  ) => {
    setError(null);
    try {
      const saved = await moduleRepository.upsert<T>(module, recordType, payload, {
        ...options,
        ownerId,
      });
      setRecords((current) => [saved, ...current.filter((record) => record.id !== saved.id)]);
      return saved;
    } catch (saveError) {
      setError(userFacingError(saveError));
      throw saveError;
    }
  }, [module, ownerId, recordType]);

  const saveSingleton = useCallback(async (
    payload: T,
    options: Omit<ModuleMutationOptions, 'ownerId' | 'id'> = {},
  ) => {
    setError(null);
    try {
      const saved = await moduleRepository.upsertSingleton<T>(module, recordType, payload, {
        ...options,
        ownerId,
      });
      setRecords([saved]);
      return saved;
    } catch (saveError) {
      setError(userFacingError(saveError));
      throw saveError;
    }
  }, [module, ownerId, recordType]);

  const remove = useCallback(async (id: string) => {
    setError(null);
    try {
      await moduleRepository.remove(module, recordType, id, ownerId);
      setRecords((current) => current.filter((record) => record.id !== id));
    } catch (removeError) {
      setError(userFacingError(removeError));
      throw removeError;
    }
  }, [module, ownerId, recordType]);

  const retrySync = useCallback(async () => {
    setError(null);
    const result = await moduleRepository.flush();
    if (result.failed > 0) setError('Certaines modifications restent en attente de synchronisation.');
    await reload();
  }, [reload]);

  const hasQueuedChanges = useMemo(
    () => records.some((record) => record.syncStatus === 'queued'),
    [records],
  );

  return {
    records,
    isLoading,
    error,
    syncPhase,
    hasQueuedChanges,
    reload,
    retrySync,
    save,
    saveSingleton,
    remove,
  };
};
