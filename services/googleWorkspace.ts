import { supabase } from './supabaseClient';
import { getWorkspaceAccessToken, type WorkspaceCapability } from './googleWorkspaceLink';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  iconLink?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  starred?: boolean;
  trashed?: boolean;
  parents?: string[];
}

export interface GoogleChatSpace {
  name: string;
  displayName?: string;
  type?: string;
  spaceType?: 'SPACE' | 'GROUP_CHAT' | 'DIRECT_MESSAGE';
  spaceThreadingState?: string;
  spaceDetails?: { description?: string; guidelines?: string };
}

export interface GoogleChatMessage {
  name: string;
  text?: string;
  sender?: { name: string; displayName?: string; avatarUrl?: string; type?: string };
  createTime?: string;
  space?: { name: string };
}

export interface GoogleMeetSpace {
  name: string;
  meetingUri?: string;
  meetingCode?: string;
  config?: { accessType?: string; entryPointAccess?: string };
  activeConference?: { conferenceRecord?: string };
}

export const getAccessToken = async (): Promise<string | null> => getWorkspaceAccessToken();

const callWorkspace = async <T>(action: string, payload: Record<string, unknown> = {}): Promise<T> => {
  const capability = action.split('.')[0] as WorkspaceCapability;
  const googleToken = getWorkspaceAccessToken([capability]);
  if (!googleToken) throw new Error('GOOGLE_CONSENT_REQUIRED');
  const { data } = await supabase.auth.getSession();
  const sessionToken = data.session?.access_token;
  if (!sessionToken) throw new Error('AUTH_REQUIRED');
  const response = await fetch('/api/google-workspace', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      'X-Google-Access-Token': googleToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await response.json().catch(() => ({ ok: false, error: { code: 'INVALID_PROXY_RESPONSE', message: 'Réponse serveur invalide.' } }));
  if (!response.ok || !body.ok) throw new Error(body.error?.message ?? body.error?.code ?? 'GOOGLE_WORKSPACE_FAILED');
  return body.data as T;
};

const fileToBase64 = (file: File): Promise<string> => {
  if (file.size > 4_000_000) return Promise.reject(new Error('DRIVE_FILE_TOO_LARGE'));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error ?? new Error('FILE_READ_FAILED'));
    reader.readAsDataURL(file);
  });
};

export const listDriveFiles = async (folderId?: string, searchQuery?: string): Promise<GoogleDriveFile[]> => {
  const result = await callWorkspace<{ files?: GoogleDriveFile[] }>('drive.list', { folderId, searchQuery });
  return result.files ?? [];
};

export const createDriveFolder = (name: string, parentId?: string): Promise<GoogleDriveFile> =>
  callWorkspace('drive.createFolder', { name, parentId });

export const uploadDriveFile = async (file: File, parentId?: string): Promise<GoogleDriveFile> =>
  callWorkspace('drive.upload', { name: file.name, mimeType: file.type, data: await fileToBase64(file), parentId });

export const deleteDriveFile = async (fileId: string): Promise<void> => {
  await callWorkspace('drive.delete', { fileId });
};

export const listChatSpaces = async (): Promise<GoogleChatSpace[]> => {
  const result = await callWorkspace<{ spaces?: GoogleChatSpace[] }>('chat.listSpaces');
  return result.spaces ?? [];
};

export const createChatSpace = (displayName: string, description?: string): Promise<GoogleChatSpace> =>
  callWorkspace('chat.createSpace', { displayName, description });

export const listChatMessages = async (spaceName: string): Promise<GoogleChatMessage[]> => {
  const result = await callWorkspace<{ messages?: GoogleChatMessage[] }>('chat.listMessages', { spaceName });
  return (result.messages ?? []).reverse();
};

export const sendChatMessage = (spaceName: string, text: string): Promise<GoogleChatMessage> =>
  callWorkspace('chat.sendMessage', { spaceName, text });

export const createMeetSpace = (): Promise<GoogleMeetSpace> => callWorkspace('meet.create');
export const getMeetSpace = (spaceName: string): Promise<GoogleMeetSpace> => callWorkspace('meet.get', { spaceName });
