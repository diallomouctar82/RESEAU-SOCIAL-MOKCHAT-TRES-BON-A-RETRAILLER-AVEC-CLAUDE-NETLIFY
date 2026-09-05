import { pupilsFrom } from '../../services/architecte/photoAvatar';
import { loadMediapipeDeps } from '../../services/architecte/photoAvatarEngine';

async function reperes(url: string): Promise<{ width: number; height: number; left: { x: number; y: number }; right: { x: number; y: number }; landmarks: number }> {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('image illisible : ' + url)); img.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    canvas.getContext('2d')!.drawImage(img, 0, 0);
    const deps = await loadMediapipeDeps();
    const faces = await deps.detectFaces(canvas);
    if (!faces.length) throw new Error('aucun visage : ' + url);
    const { left, right } = pupilsFrom(faces[0]);
    return { width: canvas.width, height: canvas.height, left, right, landmarks: faces[0].length };
}
(window as unknown as { __reperes?: typeof reperes }).__reperes = reperes;
