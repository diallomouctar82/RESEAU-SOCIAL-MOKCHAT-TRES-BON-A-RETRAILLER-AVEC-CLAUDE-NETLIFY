export type MediaKind = 'image' | 'video' | 'audio' | 'document';

const RULES: Record<MediaKind, { maxBytes: number; mimeTypes: readonly string[] }> = {
    image: {
        maxBytes: 10 * 1024 * 1024,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    },
    audio: {
        maxBytes: 25 * 1024 * 1024,
        mimeTypes: ['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav'],
    },
    video: {
        maxBytes: 100 * 1024 * 1024,
        mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    },
    document: {
        maxBytes: 20 * 1024 * 1024,
        mimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip',
            'application/x-zip-compressed',
        ],
    },
};

const EXTENSION_BY_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'audio/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
};

export class MediaValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MediaValidationError';
    }
}

export const detectMediaKind = (mimeType: string): MediaKind => {
    const entry = (Object.entries(RULES) as [MediaKind, (typeof RULES)[MediaKind]][])
        .find(([, rule]) => rule.mimeTypes.includes(mimeType));
    if (!entry) throw new MediaValidationError('Ce format de fichier n’est pas autorisé.');
    return entry[0];
};

export const validateSocialMediaFile = (file: Pick<File, 'name' | 'size' | 'type'>): MediaKind => {
    if (!file.name || file.name.length > 180) {
        throw new MediaValidationError('Le nom du fichier est invalide ou trop long.');
    }
    if (!file.size) throw new MediaValidationError('Le fichier est vide.');
    const kind = detectMediaKind(file.type);
    if (file.size > RULES[kind].maxBytes) {
        const maxMb = RULES[kind].maxBytes / (1024 * 1024);
        throw new MediaValidationError(`Le fichier dépasse la limite de ${maxMb} Mo.`);
    }
    return kind;
};

export const extensionForMime = (mimeType: string): string => {
    const extension = EXTENSION_BY_MIME[mimeType];
    if (!extension) throw new MediaValidationError('Ce format de fichier n’est pas autorisé.');
    return extension;
};
