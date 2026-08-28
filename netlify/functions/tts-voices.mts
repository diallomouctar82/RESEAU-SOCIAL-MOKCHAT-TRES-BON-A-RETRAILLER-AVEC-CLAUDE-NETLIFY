const VOICES = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'Professeur Diallo (George)', specialty: 'Éducation & pédagogie', gender: 'male' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Professeur Diallo (Antoni)', specialty: 'Sciences & méthode', gender: 'male' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Directeur Diallo (Adam)', specialty: 'Direction & stratégie', gender: 'male' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Maître Diallo (Roger)', specialty: 'Juridique', gender: 'male' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Conseiller Diallo (Callum)', specialty: 'Carrière', gender: 'male' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Docteur Diallo (Liam)', specialty: 'Santé', gender: 'male' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Monsieur Diallo (Daniel)', specialty: 'Habitat', gender: 'male' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Guide Diallo (Arnold)', specialty: 'Mobilité', gender: 'male' },
  { id: 'pqHfZKP75CvOlQylNhV4', name: 'Analyste Diallo (Bill)', specialty: 'Finance & marché', gender: 'male' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Docteure Diallo (Rachel)', specialty: 'Langues', gender: 'female' }
];

export default async () => new Response(JSON.stringify({
  isConfigured: !!process.env.ELEVENLABS_API_KEY?.trim(),
  defaultModel: 'eleven_multilingual_v2',
  voices: VOICES
}), { headers: { 'content-type': 'application/json; charset=utf-8' } });
