import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { isUuid, newUuid } from './identifiers';
import {
    extensionForMime,
    MediaValidationError,
    validateSocialMediaFile,
    type MediaKind,
} from './socialMediaPolicy';

export { MediaValidationError, detectMediaKind, validateSocialMediaFile } from './socialMediaPolicy';

export type MediaBucket = 'social-media';
export interface MediaUpload {
    bucket: MediaBucket;
    path: string;
    signedUrl: string;
    expiresAt: string;
    mediaType: MediaKind;
    mimeType: string;
    originalName: string;
    size: number;
}

export interface UploadMediaInput {
    bucket: MediaBucket;
    ownerId: string;
    scopeId: string;
    file: File;
    expiresInSeconds?: number;
}

export class MediaStorageError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = 'MediaStorageError';
    }
}

export const validateMediaFile = (bucket: MediaBucket, file: Pick<File, 'name' | 'size' | 'type'>): MediaKind => {
    if (bucket !== 'social-media') throw new Error('Espace média non autorisé.');
    return validateSocialMediaFile(file);
};

const safeSegment = (value: string): string => {
    const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    return normalized.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 80) || 'media';
};

export class MediaStorageService {
    constructor(private readonly client: SupabaseClient = supabase) {}

    async upload(input: UploadMediaInput): Promise<MediaUpload> {
        if (!isUuid(input.ownerId)) throw new MediaValidationError('La session utilisateur est invalide. Reconnectez-vous avant le téléversement.');
        if (!isUuid(input.scopeId)) throw new MediaValidationError('La destination du média est invalide.');
        const mediaType = validateMediaFile(input.bucket, input.file);
        const extension = extensionForMime(input.file.type);
        // Contrat des policies versionnées :
        // social-media: <user_uuid>/<content_uuid>/<file>
        const path = `${safeSegment(input.ownerId)}/${safeSegment(input.scopeId)}/${newUuid()}.${extension}`;

        const { error: uploadError } = await this.client.storage
            .from(input.bucket)
            .upload(path, input.file, {
                cacheControl: '3600',
                contentType: input.file.type,
                upsert: false,
            });

        if (uploadError) {
            throw new MediaStorageError('Le média n’a pas pu être téléversé.', uploadError);
        }

        try {
            const expiresInSeconds = input.expiresInSeconds ?? 3600;
            const signedUrl = await this.createSignedUrl(input.bucket, path, expiresInSeconds);
            return {
                bucket: input.bucket,
                path,
                signedUrl,
                expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
                mediaType,
                mimeType: input.file.type,
                originalName: input.file.name,
                size: input.file.size,
            };
        } catch (error) {
            await this.client.storage.from(input.bucket).remove([path]).catch(() => undefined);
            throw error;
        }
    }

    async createSignedUrl(bucket: MediaBucket, path: string, expiresInSeconds = 3600): Promise<string> {
        const boundedExpiry = Math.min(Math.max(expiresInSeconds, 60), 24 * 60 * 60);
        const { data, error } = await this.client.storage.from(bucket).createSignedUrl(path, boundedExpiry);
        if (error || !data?.signedUrl) {
            throw new MediaStorageError('Le lien sécurisé du média n’a pas pu être créé.', error);
        }
        return data.signedUrl;
    }

    async remove(bucket: MediaBucket, path: string): Promise<void> {
        const { error } = await this.client.storage.from(bucket).remove([path]);
        if (error) {
            throw new MediaStorageError('Le média n’a pas pu être supprimé.', error);
        }
    }
}

export const mediaStorage = new MediaStorageService();

export const createMediaPreview = (file: Blob): string => URL.createObjectURL(file);

export const revokeMediaPreview = (url?: string | null): void => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
};
