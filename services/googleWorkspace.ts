
import { getWorkspaceAccessToken } from './googleWorkspaceLink';

export const getAccessToken = async (): Promise<string | null> => {
    return getWorkspaceAccessToken();
};

// ==========================================
// GOOGLE DRIVE API SERVICES
// ==========================================

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

export const listDriveFiles = async (folderId?: string, searchQuery?: string): Promise<GoogleDriveFile[]> => {
    const token = await getAccessToken();
    if (!token) throw new Error('Connexion Google requise pour accéder à Google Drive.');

    let q = 'trashed = false';
    if (folderId) {
        q += ` and '${folderId}' in parents`;
    }
    if (searchQuery && searchQuery.trim()) {
        const escaped = searchQuery.replace(/'/g, "\\'");
        q += ` and name contains '${escaped}'`;
    }

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.append('pageSize', '50');
    url.searchParams.append('fields', 'nextPageToken, files(id, name, mimeType, modifiedTime, size, iconLink, thumbnailLink, webViewLink, webContentLink, starred, trashed, parents)');
    url.searchParams.append('q', q);
    url.searchParams.append('orderBy', 'folder,modifiedTime desc');

    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Erreur Drive: ${res.statusText}`);
    }

    const data = await res.json();
    return data.files || [];
};

export const createDriveFolder = async (folderName: string, parentId?: string): Promise<GoogleDriveFile> => {
    const token = await getAccessToken();
    if (!token) throw new Error('Connexion Google requise pour créer un dossier Drive.');

    const body: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
    };
    if (parentId) {
        body.parents = [parentId];
    }

    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Erreur création dossier: ${res.statusText}`);
    }

    return await res.json();
};

export const uploadDriveFile = async (file: File, parentId?: string): Promise<GoogleDriveFile> => {
    const token = await getAccessToken();
    if (!token) throw new Error('Connexion Google requise pour téléverser sur Drive.');

    const metadata: any = {
        name: file.name,
        mimeType: file.type || 'application/octet-stream'
    };
    if (parentId) {
        metadata.parents = [parentId];
    }

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,thumbnailLink', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Erreur téléversement Drive: ${res.statusText}`);
    }

    return await res.json();
};

export const deleteDriveFile = async (fileId: string): Promise<void> => {
    const token = await getAccessToken();
    if (!token) throw new Error('Connexion Google requise pour supprimer un fichier Drive.');

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok && res.status !== 204) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Erreur suppression Drive: ${res.statusText}`);
    }
};

// ==========================================
// GOOGLE CHAT API SERVICES
// ==========================================

export interface GoogleChatSpace {
    name: string; // "spaces/AAA..."
    displayName?: string;
    type?: string;
    spaceType?: 'SPACE' | 'GROUP_CHAT' | 'DIRECT_MESSAGE';
    spaceThreadingState?: string;
    spaceDetails?: {
        description?: string;
        guidelines?: string;
    };
}

export interface GoogleChatMessage {
    name: string; // "spaces/AAA.../messages/BBB..."
    text?: string;
    sender?: {
        name: string;
        displayName?: string;
        avatarUrl?: string;
        type?: string;
    };
    createTime?: string;
    space?: {
        name: string;
    };
}

export const listChatSpaces = async (): Promise<GoogleChatSpace[]> => {
    const token = await getAccessToken();
    if (!token) throw new Error('Connexion Google requise pour accéder aux espaces Google Chat.');

    const res = await fetch('https://chat.googleapis.com/v1/spaces?pageSize=50', {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Erreur Google Chat: ${res.statusText}`);
    }

    const data = await res.json();
    return data.spaces || [];
};

export const createChatSpace = async (displayName: string, description?: string): Promise<GoogleChatSpace> => {
    const token = await getAccessToken();
    if (!token) throw new Error('Connexion Google requise pour créer un espace Google Chat.');

    const body: any = {
        spaceType: 'SPACE',
        displayName: displayName
    };
    if (description) {
        body.spaceDetails = { description };
    }

    const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Erreur création espace Chat: ${res.statusText}`);
    }

    return await res.json();
};

export const listChatMessages = async (spaceName: string): Promise<GoogleChatMessage[]> => {
    const token = await getAccessToken();
    if (!token) throw new Error('Connexion Google requise pour lire les messages Google Chat.');

    const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=50&orderBy=createTime desc`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Erreur messages Chat: ${res.statusText}`);
    }

    const data = await res.json();
    return (data.messages || []).reverse(); // Oldest to newest for chat feed
};

export const sendChatMessage = async (spaceName: string, text: string): Promise<GoogleChatMessage> => {
    const token = await getAccessToken();
    if (!token) throw new Error('Connexion Google requise pour envoyer un message Google Chat.');

    const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Erreur envoi message Chat: ${res.statusText}`);
    }

    return await res.json();
};

// ==========================================
// GOOGLE MEET API SERVICES
// ==========================================

export interface GoogleMeetSpace {
    name: string; // "spaces/..."
    meetingUri?: string; // "https://meet.google.com/xxx-yyyy-zzz"
    meetingCode?: string; // "xxx-yyyy-zzz"
    config?: {
        accessType?: string;
        entryPointAccess?: string;
    };
    activeConference?: {
        conferenceRecord?: string;
    };
}

export const createMeetSpace = async (): Promise<GoogleMeetSpace> => {
    const token = await getAccessToken();
    if (!token) throw new Error('Connexion Google requise pour créer une réunion Google Meet.');

    const res = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Erreur création réunion Google Meet: ${res.statusText}`);
    }

    return await res.json();
};

export const getMeetSpace = async (spaceName: string): Promise<GoogleMeetSpace> => {
    const token = await getAccessToken();
    if (!token) throw new Error('Connexion Google requise pour récupérer la réunion Google Meet.');

    const res = await fetch(`https://meet.googleapis.com/v2/${spaceName}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Erreur détails Google Meet: ${res.statusText}`);
    }

    return await res.json();
};
