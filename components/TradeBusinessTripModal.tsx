import React, { useState } from 'react';
import { 
  X, 
  Plane, 
  MapPin, 
  Calendar, 
  Languages, 
  FileCheck, 
  DollarSign, 
  ShieldCheck, 
  Compass, 
  PhoneCall, 
  Download,
  Building2,
  Navigation,
  Car
} from 'lucide-react';

interface TradeBusinessTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDestination?: string;
}

export const TradeBusinessTripModal: React.FC<TradeBusinessTripModalProps> = ({
  isOpen,
  onClose,
  initialDestination = 'Guangzhou / Foire de Canton (Chine)'
}) => {
  const [activeTab, setActiveTab] = useState<'mission_plan' | 'taxi_cards' | 'bargaining_phrases'>('mission_plan');
  const [destination, setDestination] = useState(initialDestination);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-white/10 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-500/20 text-brand-400 rounded-2xl">
              <Plane size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Assistant Voyage Commercial & Mission Usine</h3>
              <p className="text-xs text-slate-300">
                Préparation logistique, planning de visites, cartes taxi bilingues et mode terrain Diallo OS.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-white/10 bg-slate-950/50 flex gap-2 pt-2">
          <button
            onClick={() => setActiveTab('mission_plan')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'mission_plan'
                ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar size={14} />
            <span>Feuille de Route & Visas</span>
          </button>

          <button
            onClick={() => setActiveTab('taxi_cards')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'taxi_cards'
                ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car size={14} />
            <span>Cartes Taxi & Hôtels Bilingues</span>
          </button>

          <button
            onClick={() => setActiveTab('bargaining_phrases')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'bargaining_phrases'
                ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Languages size={14} />
            <span>Phrases Clés Usines & Négociation</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-xs">
          
          {/* TAB 1: MISSION PLAN */}
          {activeTab === 'mission_plan' && (
            <div className="space-y-6">
              
              {/* Mission Summary Card */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Destination Principale</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <span>🇨🇳</span>
                    <span>Guangzhou / Nansha (Chine)</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Événement Clé</span>
                  <span className="text-sm font-bold text-amber-300 mt-0.5 block">
                    Canton Fair Phase 2 (Emballage & Machines)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Statut Visa M (Affaires)</span>
                  <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck size={14} />
                    <span>Lettre d'invitation émise</span>
                  </span>
                </div>
              </div>

              {/* Day by day Agenda */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm">Programme des Rendez-vous B2B & Audits Usines</h4>

                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-300">Jour 1 • 09:30 - Complexe Pazhou</span>
                    <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[10px] font-bold">Foire de Canton</span>
                  </div>
                  <p className="text-slate-200">
                    Visite du Pavillon Hall 14.1 (Emballages Pharmaceutiques). Rencontre avec les 3 directeurs commerciaux présélectionnés sur Diallo OS.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300">Jour 2 • 14:00 - District de Huadu</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">Visite Usine</span>
                  </div>
                  <p className="text-slate-200">
                    Audit de la ligne de vernissage UV et inspection de la zone de stockage à température contrôlée chez SinoPack Industrial Ltd.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300">Jour 3 • 10:00 - Port de Nansha</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Logistique</span>
                  </div>
                  <p className="text-slate-200">
                    Rencontre avec l'agent d'acconage de Syli Transit pour vérifier la procédure de mise à quai et vérification scellés conteneur.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TAXI & HOTEL CARDS */}
          {activeTab === 'taxi_cards' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5">
                <h4 className="font-bold text-white text-sm mb-1">Cartes d'Adresses Bilingues pour Chauffeurs & Taxis</h4>
                <p className="text-slate-400 text-xs">
                  Montrez directement ces fiches en plein écran au chauffeur de taxi ou à la réception de votre hôtel.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-5 bg-slate-950 rounded-2xl border border-white/10 space-y-2">
                  <span className="text-[10px] font-bold text-brand-400 uppercase">Complexe de la Foire de Pazhou</span>
                  <div className="text-lg font-bold text-white leading-tight font-sans">
                    广州中国进出口商品交易会展馆 (琶洲)
                  </div>
                  <div className="text-xs text-amber-300 font-mono">
                    Guǎngzhōu Zhōngguó Jìnchūkǒu Shāngpǐn Jiāoyìhuì Zhǎnguǎn (Pázhōu)
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Adresse : No. 382, Yuejiang Middle Road, Haizhu District, Guangzhou
                  </div>
                </div>

                <div className="p-5 bg-slate-950 rounded-2xl border border-white/10 space-y-2">
                  <span className="text-[10px] font-bold text-brand-400 uppercase">Usine SinoPack Industrial Ltd</span>
                  <div className="text-lg font-bold text-white leading-tight font-sans">
                    广州市花都区新华工业区华兴南路 18号
                  </div>
                  <div className="text-xs text-amber-300 font-mono">
                    Guǎngzhōu Shì Huādū Qū Xīnhuá Gōngyè Qū Huáxīng Nán Lù 18 Hào
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Contact usine : M. Lin Chen (+86 138 0000 8888)
                  </div>
                </div>

                <div className="p-5 bg-slate-950 rounded-2xl border border-white/10 space-y-2">
                  <span className="text-[10px] font-bold text-brand-400 uppercase">Retour à l'Hôtel (The Westin Pazhou)</span>
                  <div className="text-lg font-bold text-white leading-tight font-sans">
                    广州广交会威斯汀酒店 (请走大堂)
                  </div>
                  <div className="text-xs text-amber-300 font-mono">
                    Guǎngzhōu Guǎngjiāohuì Wēisītīng Jiǔdiàn
                  </div>
                </div>

                <div className="p-5 bg-slate-950 rounded-2xl border border-white/10 space-y-2">
                  <span className="text-[10px] font-bold text-brand-400 uppercase">Aéroport International Baiyun (Terminal 2)</span>
                  <div className="text-lg font-bold text-white leading-tight font-sans">
                    广州白云国际机场 2号航站楼 (国际出发)
                  </div>
                  <div className="text-xs text-amber-300 font-mono">
                    Guǎngzhōu Báiyún Guójì Jīchǎng 2 Hào Hángzhànlóu
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: BARGAINING PHRASES */}
          {activeTab === 'bargaining_phrases' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5">
                <h4 className="font-bold text-white text-sm mb-1">Phrases Clés de Négociation sur le Stand ou à l'Usine</h4>
                <p className="text-slate-400 text-xs">
                  Avec prononciation phonétique Pinyin et équivalent exact en Français.
                </p>
              </div>

              <div className="space-y-3">
                
                <div className="p-3.5 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                  <div className="text-sm font-bold text-white">
                    « Quel est votre prix FOB pour une commande de 2 conteneurs de 40 pieds ? »
                  </div>
                  <div className="text-xs text-emerald-400 font-mono font-semibold">
                    两个40尺高柜的离岸价（FOB）是多少？
                  </div>
                  <div className="text-[11px] text-slate-400 italic">
                    Liǎng gè 40 chǐ gāoguì de lí'àn jià (FOB) shì duōshao?
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                  <div className="text-sm font-bold text-white">
                    « Pouvez-vous nous fournir un échantillon gratuit avec Bon à Tirer avant le paiement du solde ? »
                  </div>
                  <div className="text-xs text-emerald-400 font-mono font-semibold">
                    在支付尾款之前，能否提供免费的产前样确认？
                  </div>
                  <div className="text-[11px] text-slate-400 italic">
                    Zài zhīfù wěikuǎn zhīqián, néng fǒu tígōng miǎnfèi de chǎnqiányàng quèrèn?
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                  <div className="text-sm font-bold text-white">
                    « Nous acceptons un acompte de 30% via compte séquestre commercial et 70% contre connaissement maritime. »
                  </div>
                  <div className="text-xs text-emerald-400 font-mono font-semibold">
                    我们同意通过第三方托管支付30%定金，见提单副本付70%余款。
                  </div>
                  <div className="text-[11px] text-slate-400 italic">
                    Wǒmen tóngyì tōngguò dì-sān-fāng tuōguǎn zhīfù 30% dìngjīn, jiàn tídān fùběn fù 70% yúkuǎn.
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Exportable au format PDF pour consultation hors-ligne sur votre téléphone en voyage.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl"
          >
            Fermer le guide voyage
          </button>
        </div>

      </div>
    </div>
  );
};
