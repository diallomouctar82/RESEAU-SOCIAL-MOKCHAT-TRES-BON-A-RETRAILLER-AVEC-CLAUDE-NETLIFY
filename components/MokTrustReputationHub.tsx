import React, { useState } from 'react';
import { 
  Star, 
  Award, 
  CheckCircle2, 
  MessageSquare, 
  CornerDownRight, 
  Plus, 
  ShieldCheck, 
  Send, 
  Filter, 
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  MultidimensionalReputation, 
  VerifiedTransactionReview 
} from '../types';
import { 
  MOCK_MULTIDIMENSIONAL_REPUTATION, 
  MOCK_VERIFIED_REVIEWS 
} from '../constants';

interface MokTrustReputationHubProps {
  onOpenExpertChat?: (agentId?: string, initialPrompt?: string) => void;
}

export const MokTrustReputationHub: React.FC<MokTrustReputationHubProps> = ({
  onOpenExpertChat
}) => {
  const [reputation] = useState<MultidimensionalReputation>(MOCK_MULTIDIMENSIONAL_REPUTATION);
  const [reviewsList, setReviewsList] = useState<VerifiedTransactionReview[]>(MOCK_VERIFIED_REVIEWS);

  // Replying to a review state
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Add new verified review modal
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [newOrderNumber, setNewOrderNumber] = useState('CMD-2026-1180');
  const [newProductTitle, setNewProductTitle] = useState('Conteneur Fèves de Cacao Biologique');
  const [newRatingConformity, setNewRatingConformity] = useState(5);
  const [newRatingTimeliness, setNewRatingTimeliness] = useState(5);
  const [newRatingCommunication, setNewRatingCommunication] = useState(5);
  const [newRatingQuality, setNewRatingQuality] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handlePostReply = (reviewId: string) => {
    if (!replyText.trim()) return;

    setReviewsList(reviewsList.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          sellerReply: {
            author: 'Amadou Diallo (Vendeur)',
            text: replyText,
            repliedAt: 'À l\'instant'
          }
        };
      }
      return r;
    }));

    setReplyingReviewId(null);
    setReplyText('');
    showToast('Votre droit de réponse a été publié publiquement sur la transaction.');
  };

  const handleCreateVerifiedReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    const avg = Math.round((newRatingConformity + newRatingTimeliness + newRatingCommunication + newRatingQuality) / 4);

    const newRev: VerifiedTransactionReview = {
      id: `rev-${Date.now()}`,
      transactionId: `tx-${Date.now()}`,
      orderNumber: newOrderNumber,
      productTitle: newProductTitle,
      reviewerName: 'Amadou Diallo',
      reviewerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      reviewerCountry: 'Guinée (Acheteur Certifié)',
      isVerifiedPurchase: true,
      rating: avg,
      ratingsPerDimension: {
        conformity: newRatingConformity,
        timeliness: newRatingTimeliness,
        communication: newRatingCommunication,
        quality: newRatingQuality
      },
      reviewText: newReviewComment,
      createdAt: 'À l\'instant',
      isFlaggedSuspicious: false
    };

    setReviewsList([newRev, ...reviewsList]);
    setIsAddReviewModalOpen(false);
    setNewReviewComment('');
    showToast('Avis d\'achat vérifié publié avec succès.');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Multidimensional Score Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 border border-amber-500/30">
              <Award size={14} className="text-amber-400" />
              MOK REPUTATION ENGINE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Réputation Multidimensionnelle & Avis d'Achat Vérifiés
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              La confiance commerciale ne se résume pas à une seule note globale. Mok Trust décompose la fiabilité en 5 dimensions objectives, basées exclusivement sur des commandes réelles certifiées.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-center shrink-0 w-full sm:w-auto">
            <div className="text-3xl font-black text-amber-400">{reputation.overallScore} / 100</div>
            <div className="text-xs font-bold text-emerald-400 mt-1">Fiabilité {reputation.publicReliabilityVerdict}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Basée sur {reputation.totalOrdersCompleted} transactions réelles</div>
          </div>
        </div>

        {/* 5 Dimensions breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-800">
          {[
            { label: 'Conformité Produits', score: reputation.dimensionScores.conformity, desc: 'Respect des fiches techniques' },
            { label: 'Respect des Délais', score: reputation.dimensionScores.timeliness, desc: 'Incoterms & expéditions' },
            { label: 'Communication B2B', score: reputation.dimensionScores.communication, desc: 'Réactivité Mok Chat < 2h' },
            { label: 'Qualité Perçue', score: reputation.dimensionScores.perceivedQuality, desc: 'Inspection au port' },
            { label: 'Règlement Litiges', score: reputation.dimensionScores.disputeResolutionSpeed, desc: 'Esprit de conciliation' }
          ].map((dim, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">{dim.label}</span>
                <span className="font-black text-amber-400">{dim.score} / 5</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all"
                  style={{ width: `${(dim.score / 5) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 pt-1">{dim.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Controls & List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base">Avis Post-Transaction ({reviewsList.length})</h3>
            <p className="text-xs text-slate-400">Uniquement publiables après confirmation de livraison et déblocage de séquestre.</p>
          </div>

          <button
            onClick={() => setIsAddReviewModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <Plus size={16} />
            Déposer un Avis Vérifié
          </button>
        </div>

        <div className="space-y-4">
          {reviewsList.map(review => (
            <div key={review.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={review.reviewerAvatar}
                    alt={review.reviewerName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{review.reviewerName}</h4>
                      {review.isVerifiedPurchase && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-500/30">
                          <CheckCircle2 size={10} />
                          Achat Vérifié ({review.orderNumber})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{review.reviewerCountry} • {review.createdAt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < review.rating ? 'fill-amber-400' : 'text-slate-700'}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-indigo-400">Produit : {review.productTitle}</div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{review.reviewText}</p>
              </div>

              {/* Dimensions sub-ratings */}
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                <span className="bg-slate-950 px-2.5 py-1 rounded-lg">Conformité: {review.ratingsPerDimension.conformity}/5</span>
                <span className="bg-slate-950 px-2.5 py-1 rounded-lg">Délais: {review.ratingsPerDimension.timeliness}/5</span>
                <span className="bg-slate-950 px-2.5 py-1 rounded-lg">Communication: {review.ratingsPerDimension.communication}/5</span>
                <span className="bg-slate-950 px-2.5 py-1 rounded-lg">Qualité: {review.ratingsPerDimension.quality}/5</span>
              </div>

              {/* Seller Public Reply */}
              {review.sellerReply ? (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs ml-4 sm:ml-8 animate-fade-in">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CornerDownRight size={14} className="text-indigo-400" />
                      Réponse de {review.sellerReply.author} (Droit de réponse légal) :
                    </span>
                    <span className="text-[10px]">{review.sellerReply.repliedAt}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed pl-5">{review.sellerReply.text}</p>
                </div>
              ) : (
                <div className="pt-2">
                  {replyingReviewId === review.id ? (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
                      <span className="text-xs font-bold text-white block">Publier votre droit de réponse :</span>
                      <textarea
                        rows={3}
                        placeholder="Rédigez votre réponse professionnelle et objective..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setReplyingReviewId(null)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => handlePostReply(review.id)}
                          className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                        >
                          Publier Réponse
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingReviewId(review.id)}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
                    >
                      <MessageSquare size={14} />
                      Exercer le droit de réponse vendeur
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: DÉPOSER UN AVIS VÉRIFIÉ
         ══════════════════════════════════════════════════════════════════════ */}
      {isAddReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Évaluer une Transaction Réelle</h3>
              <button onClick={() => setIsAddReviewModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateVerifiedReview} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">N° de Commande Validée :</label>
                  <input
                    type="text"
                    value={newOrderNumber}
                    onChange={(e) => setNewOrderNumber(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Produit Reçu :</label>
                  <input
                    type="text"
                    value={newProductTitle}
                    onChange={(e) => setNewProductTitle(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 4 Dimension ratings */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Notes par Dimension (sur 5) :</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300">Conformité: {newRatingConformity}/5</label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={newRatingConformity}
                      onChange={(e) => setNewRatingConformity(Number(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300">Délais: {newRatingTimeliness}/5</label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={newRatingTimeliness}
                      onChange={(e) => setNewRatingTimeliness(Number(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300">Communication: {newRatingCommunication}/5</label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={newRatingCommunication}
                      onChange={(e) => setNewRatingCommunication(Number(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300">Qualité: {newRatingQuality}/5</label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={newRatingQuality}
                      onChange={(e) => setNewRatingQuality(Number(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Commentaire Détaillé :</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Partagez votre expérience sur la livraison, la conformité documentaire et la qualité de la marchandise..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Publier l'Avis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
