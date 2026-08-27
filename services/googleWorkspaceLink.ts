
// Lien "Google Workspace" (Drive/Chat/Meet) — VOLONTAIREMENT découplé
// de la connexion Supabase (services/auth.ts). La connexion ne demande
// que l'identité minimale ; ce module gère la demande EXPLICITE et
// optionnelle des scopes Workspace larges, déclenchée uniquement par
// l'utilisateur via le bouton "Lier Google Workspace" — jamais au login.
// Utilise Google Identity Services (token client) avec le même Client ID
// OAuth que celui configuré côté Supabase Dashboard.

export const WORKSPACE_SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/chat.spaces',
    'https://www.googleapis.com/auth/chat.spaces.readonly',
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.messages.readonly',
    'https://www.googleapis.com/auth/chat.memberships',
    'https://www.googleapis.com/auth/meetings.space.created',
    'https://www.googleapis.com/auth/meetings.space.readonly',
    'https://www.googleapis.com/auth/meetings.space.settings',
].join(' ');

// CRITIQUE : en mémoire uniquement, jamais persisté (localStorage/sessionStorage).
let cachedAccessToken: string | null = null;
let tokenListeners: ((token: string | null) => void)[] = [];
let gisScriptPromise: Promise<void> | null = null;

const notifyListeners = (token: string | null) => {
    tokenListeners.forEach((cb) => cb(token));
};

export const subscribeToWorkspaceToken = (callback: (token: string | null) => void): (() => void) => {
    tokenListeners.push(callback);
    callback(cachedAccessToken);
    return () => {
        tokenListeners = tokenListeners.filter((cb) => cb !== callback);
    };
};

const loadGoogleIdentityServices = (): Promise<void> => {
    if (gisScriptPromise) return gisScriptPromise;
    gisScriptPromise = new Promise((resolve, reject) => {
        if ((window as any).google?.accounts?.oauth2) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Impossible de charger Google Identity Services."));
        document.head.appendChild(script);
    });
    return gisScriptPromise;
};

export const linkGoogleWorkspace = async (): Promise<string> => {
    const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined;
    if (!clientId) {
        throw new Error("Client ID Google (VITE_GOOGLE_OAUTH_CLIENT_ID) non configuré.");
    }
    await loadGoogleIdentityServices();

    return new Promise((resolve, reject) => {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: WORKSPACE_SCOPES,
            callback: (response: any) => {
                if (response.error) {
                    reject(new Error(response.error));
                    return;
                }
                cachedAccessToken = response.access_token;
                notifyListeners(cachedAccessToken);
                resolve(cachedAccessToken as string);
            },
        });
        client.requestAccessToken({ prompt: 'consent' });
    });
};

export const unlinkGoogleWorkspace = (): void => {
    if (cachedAccessToken && (window as any).google?.accounts?.oauth2) {
        (window as any).google.accounts.oauth2.revoke(cachedAccessToken, () => {});
    }
    cachedAccessToken = null;
    notifyListeners(null);
};

export const getWorkspaceAccessToken = (): string | null => cachedAccessToken;
