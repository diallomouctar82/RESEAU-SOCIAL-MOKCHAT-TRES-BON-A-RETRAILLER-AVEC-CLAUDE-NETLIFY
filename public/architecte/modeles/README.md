# Modèles de vision servis avec l'application (avatar vivant depuis une photo)

Utilisés uniquement par l'option Super-Admin « Créer ou remplacer l'avatar vivant depuis une photo » (`services/architecte/photoAvatarEngine.ts`), dans le navigateur de l'Admin-Général — jamais chargés par les autres écrans.

| Fichier | Rôle | Origine | Licence |
|---|---|---|---|
| `face_landmarker.task` (3 758 596 octets, SHA-256 `64184e229b263107…`) | 478 repères du visage (dont les iris) → calage automatique du rig 2D | MediaPipe, `storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/` | Apache 2.0 |
| `selfie_segmenter.tflite` (249 537 octets, SHA-256 `191ac9529ae506ee…`) | Silhouette personne / fond → masque de détourage de la sculpture | MediaPipe, `storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/` | Apache 2.0 |

Le code d'inférence (`@mediapipe/tasks-vision` 1.0.1, WebAssembly) est chargé à la demande depuis jsDelivr ; sans réseau vers ce CDN, l'option signale « détection automatique indisponible » et le calage manuel reste possible.
