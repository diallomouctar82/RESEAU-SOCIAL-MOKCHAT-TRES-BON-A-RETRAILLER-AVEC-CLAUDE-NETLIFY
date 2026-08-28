// Instanciation, via la fabrique générique async_job.ts, des adaptateurs
// image/vidéo à soumission + sondage. Un fichier de config par fournisseur,
// pas un fichier de logique par fournisseur.
//
// Niveau de confiance : écrit à partir de la documentation publique de
// chaque fournisseur, jamais testé avec une clé réelle dans cette session.
// Kling et Pika (marqués `unverified` ci-dessous) ont des schémas
// d'authentification/soumission qui changent fréquemment côté fournisseur —
// à vérifier/corriger dès la première vraie clé fournie par l'admin.

import { createAsyncJobAdapter } from './async_job.ts';
import { AdapterRequest } from './types.ts';

const promptBody = (req: AdapterRequest) => ({
    prompt: req.imageVideo!.prompt,
    ...(req.imageVideo!.params ?? {}),
});

export const fluxAdapter = createAsyncJobAdapter({
    submitUrl: (modelId) => `https://api.bfl.ml/v1/${modelId || 'flux-pro-1.1'}`,
    submitHeaders: (apiKey) => ({ 'x-key': apiKey }),
    submitBody: (req) => promptBody(req),
    jobIdPath: 'polling_url',
    pollUrl: (jobId) => jobId, // le "jobId" est directement l'URL de polling fournie par BFL
    pollHeaders: (apiKey) => ({ 'x-key': apiKey }),
    statusPath: 'status',
    doneValues: ['Ready'],
    failedValues: ['Error', 'Request Moderated', 'Content Moderated', 'Task Not Found'],
    assetUrlPath: 'result.sample',
});

export const leonardoAdapter = createAsyncJobAdapter({
    submitUrl: () => 'https://cloud.leonardo.ai/api/rest/v1/generations',
    submitHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    submitBody: (req, modelId) => ({ prompt: req.imageVideo!.prompt, modelId, ...(req.imageVideo!.params ?? {}) }),
    jobIdPath: 'sdGenerationJob.generationId',
    pollUrl: (jobId) => `https://cloud.leonardo.ai/api/rest/v1/generations/${jobId}`,
    pollHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    statusPath: 'generations_by_pk.status',
    doneValues: ['COMPLETE'],
    failedValues: ['FAILED'],
    assetUrlPath: 'generations_by_pk.generated_images[0].url',
    testUrl: () => 'https://cloud.leonardo.ai/api/rest/v1/me',
    testHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
});

export const runwayAdapter = createAsyncJobAdapter({
    submitUrl: () => 'https://api.dev.runwayml.com/v1/text_to_video',
    submitHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06' }),
    submitBody: (req, modelId) => ({ promptText: req.imageVideo!.prompt, model: modelId, ...(req.imageVideo!.params ?? {}) }),
    jobIdPath: 'id',
    pollUrl: (jobId) => `https://api.dev.runwayml.com/v1/tasks/${jobId}`,
    pollHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06' }),
    statusPath: 'status',
    doneValues: ['SUCCEEDED'],
    failedValues: ['FAILED'],
    assetUrlPath: 'output[0]',
});

export const heygenAdapter = createAsyncJobAdapter({
    submitUrl: () => 'https://api.heygen.com/v2/video/generate',
    submitHeaders: (apiKey) => ({ 'X-Api-Key': apiKey }),
    submitBody: (req, modelId) => ({
        video_inputs: [{ character: { type: 'avatar', avatar_id: modelId }, voice: { type: 'text', input_text: req.imageVideo!.prompt } }],
        ...(req.imageVideo!.params ?? {}),
    }),
    jobIdPath: 'data.video_id',
    pollUrl: (jobId) => `https://api.heygen.com/v1/video_status.get?video_id=${jobId}`,
    pollHeaders: (apiKey) => ({ 'X-Api-Key': apiKey }),
    statusPath: 'data.status',
    doneValues: ['completed'],
    failedValues: ['failed'],
    assetUrlPath: 'data.video_url',
    testUrl: () => 'https://api.heygen.com/v2/user/remaining_quota',
    testHeaders: (apiKey) => ({ 'X-Api-Key': apiKey }),
});

export const lumaAdapter = createAsyncJobAdapter({
    submitUrl: () => 'https://api.lumalabs.ai/dream-machine/v1/generations',
    submitHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    submitBody: (req) => promptBody(req),
    jobIdPath: 'id',
    pollUrl: (jobId) => `https://api.lumalabs.ai/dream-machine/v1/generations/${jobId}`,
    pollHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    statusPath: 'state',
    doneValues: ['completed'],
    failedValues: ['failed'],
    assetUrlPath: 'assets.video',
    testUrl: () => 'https://api.lumalabs.ai/dream-machine/v1/generations',
    testHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
});

// --- Non vérifiés (unverified) : schémas d'auth/soumission susceptibles de changer ---

export const klingAdapter = createAsyncJobAdapter({
    submitUrl: () => 'https://api.klingai.com/v1/videos/text2video',
    submitHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    submitBody: (req, modelId) => ({ prompt: req.imageVideo!.prompt, model_name: modelId, ...(req.imageVideo!.params ?? {}) }),
    jobIdPath: 'data.task_id',
    pollUrl: (jobId) => `https://api.klingai.com/v1/videos/text2video/${jobId}`,
    pollHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    statusPath: 'data.task_status',
    doneValues: ['succeed'],
    failedValues: ['failed'],
    assetUrlPath: 'data.task_result.videos[0].url',
});

export const pikaAdapter = createAsyncJobAdapter({
    submitUrl: () => 'https://api.pika.art/generate',
    submitHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    submitBody: (req) => promptBody(req),
    jobIdPath: 'id',
    pollUrl: (jobId) => `https://api.pika.art/generate/${jobId}`,
    pollHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    statusPath: 'status',
    doneValues: ['finished', 'completed'],
    failedValues: ['failed', 'error'],
    assetUrlPath: 'result.url',
});
