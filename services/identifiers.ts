const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID_PATTERN.test(value);

export const newUuid = (): string => {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

    const bytes = new Uint8Array(16);
    if (!globalThis.crypto?.getRandomValues) {
        throw new Error('Génération d’identifiant sécurisé indisponible dans ce navigateur.');
    }
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hexadecimal = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hexadecimal.slice(0, 8)}-${hexadecimal.slice(8, 12)}-${hexadecimal.slice(12, 16)}-${hexadecimal.slice(16, 20)}-${hexadecimal.slice(20)}`;
};
