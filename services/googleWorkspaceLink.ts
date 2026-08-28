
// Lien "Google Workspace" (Drive/Chat/Meet) — VOLONTAIREMENT découplé
// de la connexion Supabase (services/auth.ts). La connexion ne demande
// que l'identité minimale ; ce module gère la demande EXPLICITE et
// optionnelle des scopes Workspace larges, déclenchée uniquement par
// l'utilisateur via le bouton "Lier Google Workspace" — jamais au login.
// Utilise Google Identity Services (token client) avec le même Client ID
// OAuth que celui configuré côté Supabase Dashboard.

export type WorkspaceCapability = 'drive' | 'chat' | 'meet';

export const WORKSPACE_SCOPES: Record<WorkspaceCapability, readonly string[]> = {
    drive: ['https://www.googleapis.com/auth/drive.file'],
    chat: [
        'https://www.googleapis.com/auth/chat.spaces.readonly',
        'https://www.googleapis.com/auth/chat.spaces.create',
        'https://www.googleapis.com/auth/chat.messages.readonly',
        'https://www.googleapis.com/auth/chat.messages.create',
    ],
    meet: [
        'https://www.googleapis.com/auth/meetings.space.created',
        'https://www.googleapis.com/auth/meetings.space.readonly',
    ],
};

// CRITIQUE : jeton éphémère en mémoire uniquement, jamais écrit dans un stockage persistant.
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;
let expiryTimer: ReturnType<typeof setTimeout> | null = null;
const grantedCapabilities = new Set<WorkspaceCapability>();
let tokenListeners: ((token: string | null) => void)[] = [];
let gisScriptPromise: Promise<void> | null = null;

const notifyListeners = (token: string | null) => {
    tokenListeners.forEach((cb) => cb(token));
};

const expireToken = () => {
    cachedAccessToken = null;
    tokenExpiresAt = 0;
    grantedCapabilities.clear();
    if (expiryTimer) clearTimeout(expiryTimer);
    expiryTimer = null;
    notifyListeners(null);
};

export const hasWorkspaceCapabilities = (capabilities: WorkspaceCapability[]): boolean =>
    Boolean(cachedAccessToken) && Date.now() < tokenExpiresAt
    && capabilities.every((capability) => grantedCapabilities.has(capability));

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

export const linkGoogleWorkspace = async (capabilities: WorkspaceCapability[] = ['drive']): Promise<string> => {
    const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined;
    if (!clientId) {
        throw new Error("Client ID Google (VITE_GOOGLE_OAUTH_CLIENT_ID) non configuré.");
    }
    await loadGoogleIdentityServices();

    return new Promise((resolve, reject) => {
        const requestedCapabilities = new Set([...grantedCapabilities, ...capabilities]);
        const requestedScopes = [...requestedCapabilities].flatMap((capability) => WORKSPACE_SCOPES[capability]);
        const scope = requestedScopes.join(' ');
        const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope,
            include_granted_scopes: true,
            callback: (response: any) => {
                if (response.error) {
                    reject(new Error(response.error));
                    return;
                }
                const grantedScopes = new Set(String(response.scope ?? '').split(/\s+/).filter(Boolean));
                if (response.scope && requestedScopes.some((requestedScope) => !grantedScopes.has(requestedScope))) {
                    reject(new Error('Les autorisations Google demandées n’ont pas toutes été accordées.'));
                    return;
                }
                cachedAccessToken = response.access_token;
                requestedCapabilities.forEach((capability) => grantedCapabilities.add(capability));
                const expiresIn = Math.max(60, Math.min(Number(response.expires_in) || 3600, 3600));
                tokenExpiresAt = Date.now() + expiresIn * 1000;
                if (expiryTimer) clearTimeout(expiryTimer);
                expiryTimer = setTimeout(expireToken, Math.max(1_000, expiresIn * 1000 - 30_000));
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
    expireToken();
};

export const getWorkspaceAccessToken = (capabilities: WorkspaceCapability[] = []): string | null => {
    if (Date.now() >= tokenExpiresAt) {
        if (cachedAccessToken) expireToken();
        return null;
    }
    return capabilities.every((capability) => grantedCapabilities.has(capability)) ? cachedAccessToken : null;
};
