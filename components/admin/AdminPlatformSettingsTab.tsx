import React, { useState } from 'react';
import { 
  Sliders, 
  Video, 
  ShoppingBag, 
  ShieldCheck, 
  Palette, 
  GraduationCap, 
  BrainCircuit, 
  Check, 
  RotateCcw, 
  Save, 
  Lock, 
  Radio, 
  Coins, 
  Globe,
  Sparkles,
  Cloud,
  Layers
} from 'lucide-react';
import { PlatformDetailedModuleSettings } from '../../types';
import { adminConfigService } from '../../services/adminConfigService';

interface AdminPlatformSettingsTabProps {
  detailedSettings: PlatformDetailedModuleSettings;
  onReload: () => void;
}

export const AdminPlatformSettingsTab: React.FC<AdminPlatformSettingsTabProps> = ({
  detailedSettings,
  onReload
}) => {
  const [formData, setFormData] = useState<PlatformDetailedModuleSettings>(JSON.parse(JSON.stringify(detailedSettings)));
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    adminConfigService.updateDetailedSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    onReload();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Rétablir tous les paramètres par défaut de la plateforme ?')) {
      const defaults = adminConfigService.getDetailedSettings();
      setFormData(defaults);
      onReload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
              Pilotage Central
            </span>
            <span className="text-xs text-slate-400 font-mono">Sync Supabase Temps Réel</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-1">
            <Sliders className="text-indigo-600" size={22} />
            Paramètres Généraux & Administration des Modules
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurez les seuils économiques, la modération IA, les flux de streaming, le séquestre MokTrust et l'écosystème B2B.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
              <Check size={16} /> Modifications enregistrées !
            </span>
          )}

          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <RotateCcw size={14} />
            Rétablir
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <Save size={15} />
            Enregistrer les Paramètres
          </button>
        </div>
      </div>

      {/* Grid of Module Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. MODULE LIVE & STREAMING */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Video size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Module Live & Streaming</h3>
              <p className="text-[11px] text-slate-400">Diffusion direct & sessions interactives</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bitrate vidéo maximal (Kbps)</label>
              <input
                type="number"
                value={formData.live.maxBitrateKbps}
                onChange={(e) => setFormData({
                  ...formData,
                  live: { ...formData.live, maxBitrateKbps: Number(e.target.value) }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sensibilité Modération IA du Chat</label>
              <select
                value={formData.live.aiModerationSensitivity}
                onChange={(e) => setFormData({
                  ...formData,
                  live: { ...formData.live, aiModerationSensitivity: e.target.value as any }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="strict">Strict (Filtrage agressif anti-abus)</option>
                <option value="medium">Moyen (Équilibré)</option>
                <option value="low">Faible (Permissif)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre max de Lives simultanés</label>
              <input
                type="number"
                value={formData.live.maxConcurrentLives}
                onChange={(e) => setFormData({
                  ...formData,
                  live: { ...formData.live, maxConcurrentLives: Number(e.target.value) }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Création de Live par tout citoyen</span>
                <input
                  type="checkbox"
                  checked={formData.live.allowPublicStreamCreation}
                  onChange={(e) => setFormData({
                    ...formData,
                    live: { ...formData.live, allowPublicStreamCreation: e.target.checked }
                  })}
                  className="w-4 h-4 text-purple-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Enregistrement Replay automatique</span>
                <input
                  type="checkbox"
                  checked={formData.live.autoRecordingEnabled}
                  onChange={(e) => setFormData({
                    ...formData,
                    live: { ...formData.live, autoRecordingEnabled: e.target.checked }
                  })}
                  className="w-4 h-4 text-purple-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>

        {/* 2. MODULE COMMERCE B2B & MARCHÉ MONDIAL */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingBag size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Commerce B2B & Marché</h3>
              <p className="text-[11px] text-slate-400">Contrats, RFQ & import-export</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Commission Plateforme (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.commerce.commissionRatePercent}
                onChange={(e) => setFormData({
                  ...formData,
                  commerce: { ...formData.commerce, commissionRatePercent: Number(e.target.value) }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Rétention Séquestre Standard (Jours)</label>
              <input
                type="number"
                value={formData.commerce.escrowHoldingPeriodDays}
                onChange={(e) => setFormData({
                  ...formData,
                  commerce: { ...formData.commerce, escrowHoldingPeriodDays: Number(e.target.value) }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Montant Min. d'Appel d'Offre RFQ (EUR)</label>
              <input
                type="number"
                value={formData.commerce.minRfqAmount}
                onChange={(e) => setFormData({
                  ...formData,
                  commerce: { ...formData.commerce, minRfqAmount: Number(e.target.value) }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Calculateur Douanes & Taxes Automatique</span>
                <input
                  type="checkbox"
                  checked={formData.commerce.autoCustomsCalculator}
                  onChange={(e) => setFormData({
                    ...formData,
                    commerce: { ...formData.commerce, autoCustomsCalculator: e.target.checked }
                  })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Vendeurs Vérifiés Uniquement en B2B</span>
                <input
                  type="checkbox"
                  checked={formData.commerce.verifiedSellersOnlyForB2B}
                  onChange={(e) => setFormData({
                    ...formData,
                    commerce: { ...formData.commerce, verifiedSellersOnlyForB2B: e.target.checked }
                  })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>

        {/* 3. MODULE MOKTRUST & ESCROW */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">MokTrust & Sécurité</h3>
              <p className="text-[11px] text-slate-400">Tiers de confiance & médiation</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Score Confiance Min. pour Publier (/100)</label>
              <input
                type="number"
                value={formData.mokTrust.minTrustScoreToPublish}
                onChange={(e) => setFormData({
                  ...formData,
                  mokTrust: { ...formData.mokTrust, minTrustScoreToPublish: Number(e.target.value) }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Délai Résolution Litiges (Heures)</label>
              <input
                type="number"
                value={formData.mokTrust.disputeResolutionTimeoutHours}
                onChange={(e) => setFormData({
                  ...formData,
                  mokTrust: { ...formData.mokTrust, disputeResolutionTimeoutHours: Number(e.target.value) }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Frais de Séquestre Garanti (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.mokTrust.escrowFeePercent}
                onChange={(e) => setFormData({
                  ...formData,
                  mokTrust: { ...formData.mokTrust, escrowFeePercent: Number(e.target.value) }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">KYC Obligatoire pour transactions</span>
                <input
                  type="checkbox"
                  checked={formData.mokTrust.mandatoryKycForEscrow}
                  onChange={(e) => setFormData({
                    ...formData,
                    mokTrust: { ...formData.mokTrust, mandatoryKycForEscrow: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Journal de preuve cryptographique</span>
                <input
                  type="checkbox"
                  checked={formData.mokTrust.smartContractAuditLog}
                  onChange={(e) => setFormData({
                    ...formData,
                    mokTrust: { ...formData.mokTrust, smartContractAuditLog: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>

        {/* 4. MODULE STUDIO CRÉATIF */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="p-2 bg-pink-50 text-pink-600 rounded-xl">
              <Palette size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Studio Créatif & Médias</h3>
              <p className="text-[11px] text-slate-400">Génération visuelle & filigranes</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Générations max par jour / utilisateur</label>
              <input
                type="number"
                value={formData.studio.maxDailyGenerationsPerUser}
                onChange={(e) => setFormData({
                  ...formData,
                  studio: { ...formData.studio, maxDailyGenerationsPerUser: Number(e.target.value) }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Modèle Vision par Défaut</label>
              <select
                value={formData.studio.defaultVisionModel}
                onChange={(e) => setFormData({
                  ...formData,
                  studio: { ...formData.studio, defaultVisionModel: e.target.value }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra-rapide)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Haute définition)</option>
                <option value="imagen-3.0">Imagen 3 (Studio Artistique)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Filigrane officiel Le Monde à Vous</span>
                <input
                  type="checkbox"
                  checked={formData.studio.watermarkEnabled}
                  onChange={(e) => setFormData({
                    ...formData,
                    studio: { ...formData.studio, watermarkEnabled: e.target.checked }
                  })}
                  className="w-4 h-4 text-pink-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Génération vidéo VEO autorisée</span>
                <input
                  type="checkbox"
                  checked={formData.studio.allowVeoVideoGeneration}
                  onChange={(e) => setFormData({
                    ...formData,
                    studio: { ...formData.studio, allowVeoVideoGeneration: e.target.checked }
                  })}
                  className="w-4 h-4 text-pink-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>

        {/* 5. MODULE CAMPUS & ÉDUCATION */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <GraduationCap size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Campus & Certifications</h3>
              <p className="text-[11px] text-slate-400">Masterclass, examens & diplômes</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Score de passage examen (%)</label>
              <input
                type="number"
                value={formData.campus.examPassingScore}
                onChange={(e) => setFormData({
                  ...formData,
                  campus: { ...formData.campus, examPassingScore: Number(e.target.value) }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Multiplicateur de gain XP</label>
              <input
                type="number"
                step="0.1"
                value={formData.campus.xpMultiplier}
                onChange={(e) => setFormData({
                  ...formData,
                  campus: { ...formData.campus, xpMultiplier: Number(e.target.value) }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Génération Diplôme PDF & Sceau</span>
                <input
                  type="checkbox"
                  checked={formData.campus.autoGenerateDiplomaPdf}
                  onChange={(e) => setFormData({
                    ...formData,
                    campus: { ...formData.campus, autoGenerateDiplomaPdf: e.target.checked }
                  })}
                  className="w-4 h-4 text-amber-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Évaluation par les pairs (Peer-review)</span>
                <input
                  type="checkbox"
                  checked={formData.campus.peerReviewEnabled}
                  onChange={(e) => setFormData({
                    ...formData,
                    campus: { ...formData.campus, peerReviewEnabled: e.target.checked }
                  })}
                  className="w-4 h-4 text-amber-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>

        {/* 6. MOTEUR IA GEMINI CENTRAL */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <BrainCircuit size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Moteur IA Souverain</h3>
              <p className="text-[11px] text-slate-400">Modèles Gemini & raisonnement</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Modèle Gemini Actif</label>
              <select
                value={formData.aiCore.geminiModel}
                onChange={(e) => setFormData({
                  ...formData,
                  aiCore: { ...formData.aiCore, geminiModel: e.target.value }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommandé - Équilibré)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Raisonnement Complexe & Juridique)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Budget de réflexion (Tokens)</label>
              <input
                type="number"
                value={formData.aiCore.thinkingBudgetTokens}
                onChange={(e) => setFormData({
                  ...formData,
                  aiCore: { ...formData.aiCore, thinkingBudgetTokens: Number(e.target.value) }
                })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Réponses en streaming direct</span>
                <input
                  type="checkbox"
                  checked={formData.aiCore.streamResponses}
                  onChange={(e) => setFormData({
                    ...formData,
                    aiCore: { ...formData.aiCore, streamResponses: e.target.checked }
                  })}
                  className="w-4 h-4 text-sky-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Filtrage de sécurité strict</span>
                <input
                  type="checkbox"
                  checked={formData.aiCore.safetyThreshold === 'strict'}
                  onChange={(e) => setFormData({
                    ...formData,
                    aiCore: { ...formData.aiCore, safetyThreshold: e.target.checked ? 'strict' : 'medium' }
                  })}
                  className="w-4 h-4 text-sky-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
