import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MediaValidationError,
  extensionForMime,
  validateSocialMediaFile,
} from '../../services/socialMediaPolicy.ts';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const readSource = (path) => readFile(resolve(repositoryRoot, path), 'utf8');

test('la politique média sociale accepte les formats prévus et impose les tailles', () => {
  assert.equal(validateSocialMediaFile({ name: 'photo.png', type: 'image/png', size: 1024 }), 'image');
  assert.equal(validateSocialMediaFile({ name: 'reel.mp4', type: 'video/mp4', size: 8 * 1024 * 1024 }), 'video');
  assert.equal(extensionForMime('video/mp4'), 'mp4');
  assert.throws(
    () => validateSocialMediaFile({ name: 'script.svg', type: 'image/svg+xml', size: 1024 }),
    MediaValidationError,
  );
  assert.throws(
    () => validateSocialMediaFile({ name: 'huge.mp4', type: 'video/mp4', size: 101 * 1024 * 1024 }),
    /100 Mo/,
  );
  assert.throws(
    () => validateSocialMediaFile({ name: 'empty.png', type: 'image/png', size: 0 }),
    /vide/,
  );
});

test('le fil utilise uniquement les tables live canoniques et les profils publics minimaux', async () => {
  const service = await readSource('services/socialNetwork.ts');
  for (const table of ['posts', 'comments', 'post_reactions', 'stories']) {
    assert.match(service, new RegExp(`from\\('${table}'\\)`));
  }
  assert.doesNotMatch(service, /social_posts|post_comments|from\('profiles'\)/);
  assert.match(service, /rpc\('get_public_profiles'/);
  assert.doesNotMatch(service, /\bemail\b|\bcredits\b|privacy_settings/);
});

test('les réactions sont remplacées atomiquement sur la clé utilisateur/publication', async () => {
  const service = await readSource('services/socialNetwork.ts');
  assert.match(service, /from\('post_reactions'\)\.upsert/);
  assert.match(service, /onConflict: 'post_id,user_id'/);
});

test('stories et reels utilisent seulement le bucket social privé et des liens signés', async () => {
  const [service, storage] = await Promise.all([
    readSource('services/socialNetwork.ts'),
    readSource('services/mediaStorage.ts'),
  ]);
  assert.match(service, /createSignedUrl\('social-media'/);
  assert.match(storage, /createSignedUrl\(path, boundedExpiry\)/);
  assert.match(storage, /upsert: false/);
  assert.doesNotMatch(`${service}\n${storage}`, /chat-media|profile-media/);
});

test('le chemin authentifié de SocialFeed ne fusionne aucun post, membre, story ou reel mocké', async () => {
  const component = await readSource('components/SocialFeed.tsx');
  assert.doesNotMatch(component, /INITIAL_POSTS|MOCK_MEMBERS|USER_PROFILE/);
  assert.match(component, /socialNetworkService\.listFeed/);
  assert.match(component, /socialNetworkService\.createPost/);
  assert.match(component, /socialNetworkService\.addComment/);
  assert.match(component, /socialNetworkService\.setReaction/);
  assert.match(component, /socialNetworkService\.createStory/);
  assert.match(component, /mokChatService\.reportAbuse/);
  assert.match(component, /mokChatService\.setBlocked/);
});
