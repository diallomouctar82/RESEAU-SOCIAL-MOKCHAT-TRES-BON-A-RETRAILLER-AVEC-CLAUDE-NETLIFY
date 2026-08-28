import { supabase } from './supabaseClient';
import type { AdminUserRecord, PlatformRole } from '../types';

export interface AdminAuditRecord {
  id: string;
  created_at: string;
  actor_id: string | null;
  target_id: string | null;
  action: string;
  outcome: 'success' | 'denied' | 'error';
  request_id: string;
  metadata: Record<string, unknown>;
}

export interface ServerProviderConfiguration {
  provider: string;
  envVar: string;
  configured: boolean;
}

export interface AdminActor {
  id: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
}

export interface AdminDirectoryResult {
  users: AdminUserRecord[];
  audit: AdminAuditRecord[];
  actor: AdminActor;
  serverConfiguration: { aiProviders: ServerProviderConfiguration[] };
  pagination: { page: number; perPage: number; returned: number };
}

export interface CreateAdminUserInput {
  email: string;
  name: string;
  role: PlatformRole;
  status: AdminUserRecord['status'];
  permissions: string[];
  country?: string;
  city?: string;
  title?: string;
}

export interface UpdateAdminUserInput {
  id: string;
  name?: string;
  role?: PlatformRole;
  status?: AdminUserRecord['status'];
  permissions?: string[];
  country?: string;
  city?: string;
  title?: string;
  kycVerified?: boolean;
  notes?: string;
  reason?: string;
}

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new AdminApiError('Votre session a expiré. Reconnectez-vous.', 'AUTH_REQUIRED', 401);
  }

  let response: Response;
  try {
    response = await fetch(`/api/admin/users${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${session.access_token}`,
        'content-type': 'application/json',
        ...init?.headers
      }
    });
  } catch {
    throw new AdminApiError('La fonction d’administration est injoignable.', 'NETWORK_ERROR', 0);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AdminApiError(
      payload?.error?.message || 'L’opération administrative a échoué.',
      payload?.error?.code || 'UNKNOWN_ERROR',
      response.status,
      payload?.requestId
    );
  }
  return payload as T;
};

export const adminApi = {
  list: (query = '') => request<AdminDirectoryResult>(`?per_page=200&q=${encodeURIComponent(query)}`),
  create: (input: CreateAdminUserInput) => request<{ user: { id: string }; message: string }>('', {
    method: 'POST',
    body: JSON.stringify(input)
  }),
  update: (input: UpdateAdminUserInput) => request<{ message: string }>('', {
    method: 'PATCH',
    body: JSON.stringify(input)
  }),
  remove: (id: string) => request<{ message: string }>(`?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
};
