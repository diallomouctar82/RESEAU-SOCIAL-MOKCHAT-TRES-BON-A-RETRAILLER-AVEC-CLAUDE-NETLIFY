import React, { useState } from 'react';
import { 
  MessageSquare, 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  GraduationCap, 
  Send, 
  Copy, 
  Check, 
  ArrowRight, 
  TrendingUp, 
  Award,
  Layers
} from 'lucide-react';
import { generateJSON } from '../../../services/aiGateway';
import { ConquestResponseAnalysis, RadarOpportunityItem } from '../../../types';

interface CareerResponseAnalyzerModalProps {
  opportunity: RadarOpportunityItem;
  onRecordAnalysis: (analysis: ConquestResponseAnalysis) => void;
  onClose: () => void;
}

export const CareerResponseAnalyzerModal: React.FC<CareerResponseAnalyzerModalProps> = ({
  opportunity,
  onRecordAnalysis,
  onClose
}) => {
  const [responseType, setResponseType] = useState<ConquestResponseAnalysis['responseType']>('entretien_propose');
  const [senderName, setSenderName] = useState(opportunity.contactPerson?.name || opportunity.entity);
  const [rawText, setRawText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ConquestResponseAnalysis | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!rawText.trim()) return;
    setIsAnalyzing(true);

    try {
      {
        const prompt = `Tu es l'Analyste Stratégique de Carrière de la Famille Diallo (Le Monde à Vous).
Contexte de l'opportunité : ${opportunity.title} chez ${opportunity.entity} (Univers : ${opportunity.universe}).
Type de réponse sélectionné : ${responseType}.
Texte brut reçu du recruteur/client/financeur :
"${rawText}"

Analyse cette réponse avec rigueur, sans inventer d'information non présente dans le texte.
Génère une analyse en JSON strict :
{
  "aiDecodedMeaning": "Explication claire en 2-3 phrases de ce que cette réponse signifie réellement et de la posture à adopter...",
  "recommendedNextSteps": ["Action recommandée 1", "Action recommandée 2"],
  "suggestedDraftReply": "Projet de réponse poli, précis et constructif prêt à l'envoi...",
  "learningPointsFromOutcome": {
    "strengthConfirmed": "Point fort démontré durant le processus...",
    "gapToAddressForFuture": "Axe de progrès identifié...",
    "suggestedCampusLesson": "Titre d'un cours ou atelier Campus recommandé..."
  }
}`;

        const parsed = await generateJSON<any>(prompt);
        const finalAnalysis: ConquestResponseAnalysis = {
          id: `resp-${Date.now()}`,
          opportunityId: opportunity.id,
          receivedDate: 'Aujourd\'hui',
          senderName: senderName || opportunity.entity,
          responseType: responseType,
          rawResponseContent: rawText,
          aiDecodedMeaning: parsed.aiDecodedMeaning || 'Réponse favorable ouvrant la phase d\'échange direct.',
          recommendedNextSteps: parsed.recommendedNextSteps || ['Confirmer le créneau', 'Préparer la fiche 30 min'],
          suggestedDraftReply: parsed.suggestedDraftReply || 'Merci pour votre retour. Je confirme ma disponibilité pour cet échange.',
          learningPointsFromOutcome: parsed.learningPointsFromOutcome
        };

        setAnalysisResult(finalAnalysis);
        onRecordAnalysis(finalAnalysis);
      }
    } catch (e) {
      console.error(e);
      {
        // Fallback
        const fallbackAnalysis: ConquestResponseAnalysis = {
          id: `resp-${Date.now()}`,
          opportunityId: opportunity.id,
          receivedDate: 'Aujourd\'hui',
          senderName: senderName || opportunity.entity,
          responseType: responseType,
          rawResponseContent: rawText,
          aiDecodedMeaning: responseType === 'entretien_propose'
            ? 'L\'organisation a validé la pertinence de votre profil et souhaite tester votre posture lors d\'un premier entretien.'
            : responseType.includes('refus')
            ? 'L\'organisation a retenu un profil différent ou suspendu le processus. Il convient d\'en tirer un apprentissage constructif et de maintenir un contact bienveillant.'
            : 'L\'interlocuteur demande des compléments pour affiner sa décision.',
          recommendedNextSteps: [
            'Répondre sous 24h avec le projet de message préparé',
            'Ouvrir le simulateur Coach 3D pour s\'entraîner'
          ],
          suggestedDraftReply: `Bonjour ${senderName},\n\nJe vous remercie pour votre retour concernant ${opportunity.title}.\n\nJe reste à votre disposition pour concrétiser nos prochains échanges.\n\nBien cordialement,\nMamadou Diallo`,
          learningPointsFromOutcome: {
            strengthConfirmed: 'Clarté de la candidature initiale et réactivité.',
            gapToAddressForFuture: 'Approfondir la valorisation des compétences spécifiques sur les premières lignes du dossier.',
            suggestedCampusLesson: 'Négociation & Prise de Parole Stratégique — Campus LMAV'
          }
        };
        setAnalysisResult(fallbackAnalysis);
        onRecordAnalysis(fallbackAnalysis);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fade-up">
      <div className="bg-slate-900 text-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-800">
        
        {/* HEADER */}
        <div className="p-5 md:p-6 bg-slate-950 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-2xl">
              <MessageSquare size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Décodeur & Capitalisation</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 text-[10px] font-extrabold border border-blue-800/60">
                  {opportunity.entity}
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black">
                Analyseur de Réponse & Apprentissage Continu
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-3 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900 space-y-5 text-xs">
          
          {!analysisResult ? (
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                  Type de retour reçu :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'entretien_propose', label: '🎉 Entretien Proposé' },
                    { id: 'demande_pieces', label: '📄 Demande d\'Informations' },
                    { id: 'contre_offre', label: '⚖️ Contre-Proposition / Devis' },
                    { id: 'en_attente_decision', label: '⏳ En Cours d\'Étude' },
                    { id: 'refus_poli', label: '🤝 Refus Standard' },
                    { id: 'refus_explicite', label: '🎯 Refus avec Motifs' },
                    { id: 'offre_retenue', label: '🏆 Offre Retenue / Accord' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setResponseType(t.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                        responseType === t.id
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                  Collez le texte du message ou email reçu :
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Ex: Bonjour Mamadou, nous avons examiné votre profil et souhaitons planifier un échange ce jeudi à 14h..."
                  className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 resize-none outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !rawText.trim()}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  <Sparkles size={14} className="text-yellow-400" />
                  <span>{isAnalyzing ? 'Décodage IA en cours...' : 'Analyser & Préparer la Réponse'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-up">
              
              {/* DECODED MEANING */}
              <div className="p-4 bg-slate-950 border border-blue-500/40 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-yellow-400" /> Signification & Décryptage Stratégique
                </span>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">
                  {analysisResult.aiDecodedMeaning}
                </p>
              </div>

              {/* RECOMMENDED NEXT STEPS */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Prochaines Actions Recommandées
                </span>
                <ul className="space-y-1.5">
                  {analysisResult.recommendedNextSteps.map((step, idx) => (
                    <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">→</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* DRAFT REPLY */}
              {analysisResult.suggestedDraftReply && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      Modèle de Réponse Suggéré :
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(analysisResult.suggestedDraftReply || '');
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copied ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 font-sans whitespace-pre-line bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    {analysisResult.suggestedDraftReply}
                  </p>
                </div>
              )}

              {/* LEARNING POINTS FROM OUTCOME */}
              {analysisResult.learningPointsFromOutcome && (
                <div className="p-4 bg-purple-950/30 border border-purple-800/40 rounded-2xl space-y-2 text-xs">
                  <span className="font-bold text-purple-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <GraduationCap size={13} /> Capitalisation & Amélioration Continue du Profil
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Force Confirmée :</span>
                      <span className="text-emerald-400 font-bold">{analysisResult.learningPointsFromOutcome.strengthConfirmed}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Axe d'Apprentissage :</span>
                      <span className="text-amber-400 font-bold">{analysisResult.learningPointsFromOutcome.gapToAddressForFuture}</span>
                    </div>
                  </div>
                  {analysisResult.learningPointsFromOutcome.suggestedCampusLesson && (
                    <div className="p-2 bg-blue-950/60 rounded-xl text-[11px] text-blue-200 border border-blue-800/40 flex items-center gap-2">
                      <GraduationCap size={14} className="text-blue-400" />
                      <span>Recommandation Campus : <strong>{analysisResult.learningPointsFromOutcome.suggestedCampusLesson}</strong></span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Analyser une autre réponse
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
