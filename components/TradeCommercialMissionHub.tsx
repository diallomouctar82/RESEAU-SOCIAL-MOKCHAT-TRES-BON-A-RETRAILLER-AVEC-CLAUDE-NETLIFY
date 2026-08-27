import React, { useState } from 'react';
import {
  Plane,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  Camera,
  Bot,
  Building2,
  Users,
  PlusCircle,
  ArrowRight,
  Scan,
  MessageSquare,
  ShieldCheck,
  Download,
  Eye,
  Check
} from 'lucide-react';
import { 
  CommercialMissionTrip, 
  MissionScheduleItem 
} from '../types';
import { 
  MOCK_COMMERCIAL_MISSIONS 
} from '../constants';

interface TradeCommercialMissionHubProps {
  onOpenExpertChat?: (expertId?: string, initialPrompt?: string) => void;
  onOpenLiveRoom?: (sessionTitle: string, participantName: string) => void;
}

export const TradeCommercialMissionHub: React.FC<TradeCommercialMissionHubProps> = ({
  onOpenExpertChat,
  onOpenLiveRoom
}) => {
  const [missionsList, setMissionsList] = useState<CommercialMissionTrip[]>(MOCK_COMMERCIAL_MISSIONS);
  const [selectedMission, setSelectedMission] = useState<CommercialMissionTrip | null>(MOCK_COMMERCIAL_MISSIONS[0] || null);

  // Mission Toolkit active tool
  const [activeTool, setActiveTool] = useState<'ocr' | 'photo' | 'journal' | 'report'>('ocr');
  
  // OCR simulation state
  const [ocrCardInput, setOcrCardInput] = useState<string>('Mr. Zhang Wei\nVice President International Trade\nGuangdong PharmaPack Co., Ltd.\nEmail: zhang.wei@gdpharmapack.cn\nTel: +86 20 8899 0011\nGuangzhou, China');
  const [ocrSuccessAlert, setOcrSuccessAlert] = useState<string | null>(null);

  // Journal Entry State
  const [newJournalNote, setNewJournalNote] = useState<string>('Visite réussie de l\'usine d\'assemblage ce matin. Les lignes d\'emballage sont certifiées ISO 13485. Proposition CIF Conakry validée à 42 000€ pour 500 unités.');
  const [journalSaved, setJournalSaved] = useState(false);

  const handleScanCard = () => {
    setOcrSuccessAlert('Carte de visite scannée avec succès ! Contact ajouté au CRM et profil Mok Chat créé pour "Mr. Zhang Wei (Guangdong PharmaPack)".');
    setTimeout(() => setOcrSuccessAlert(null), 5000);
  };

  const handleAddJournalNote = () => {
    if (!selectedMission || !newJournalNote.trim()) return;
    const updated = missionsList.map(m => {
      if (m.id === selectedMission.id) {
        return {
          ...m,
          dailyJournalNotes: [...m.dailyJournalNotes, `${new Date().toLocaleDateString('fr-FR')} : ${newJournalNote}`]
        };
      }
      return m;
    });
    setMissionsList(updated);
    setSelectedMission({
      ...selectedMission,
      dailyJournalNotes: [...selectedMission.dailyJournalNotes, `${new Date().toLocaleDateString('fr-FR')} : ${newJournalNote}`]
    });
    setNewJournalNote('');
    setJournalSaved(true);
    setTimeout(() => setJournalSaved(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* 🌟 Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Plane size={14} />
                Missions Commerciales Internationales
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Planification & Boîte à Outils des Missions Terrain
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Organisation de vos délégations d'affaires, planning heure par heure, traducteur de poche, scan OCR de cartes et rapport de synthèse.
            </p>
          </div>

          <button
            onClick={() => onOpenExpertChat && onOpenExpertChat('agent-trade-consultant', 'Je souhaite planifier une mission commerciale internationale de prospection.')}
            className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/20 flex items-center gap-1.5 transition-all"
          >
            <Bot size={15} />
            Conseiller Mission Diallo OS
          </button>
        </div>
      </div>

      {ocrSuccessAlert && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{ocrSuccessAlert}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Missions List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Missions Commerciales Déclarées
          </h3>

          {missionsList.map(mission => (
            <div
              key={mission.id}
              onClick={() => setSelectedMission(mission)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedMission?.id === mission.id
                  ? 'bg-indigo-950/60 border-indigo-500 shadow-md'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{mission.destinationFlag}</span>
                  <span>{mission.destinationCity}, {mission.destinationCountry}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                  {mission.status}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white mt-1">{mission.title}</h4>
              <p className="text-[11px] text-indigo-300 mt-1">
                {mission.startDate} - {mission.endDate} • {mission.delegationMembers.length} participants
              </p>
            </div>
          ))}
        </div>

        {/* Selected Mission Program & On-Site Toolkit */}
        {selectedMission && (
          <div className="lg:col-span-2 space-y-6">
            {/* Header info */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{selectedMission.destinationFlag}</span>
                    <span className="text-xs font-bold text-indigo-400">{selectedMission.destinationCity}, {selectedMission.destinationCountry}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{selectedMission.targetSector}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedMission.title}</h3>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400">Budget Alloué :</span>
                  <div className="text-sm font-bold text-white">{selectedMission.budgetEstimated.toLocaleString()} {selectedMission.currency}</div>
                </div>
              </div>

              {/* Schedule Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={14} className="text-indigo-400" />
                  Planning & Déroulé des Rendez-vous Terrain
                </h4>

                <div className="space-y-2">
                  {selectedMission.schedule.map(item => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-400">{item.time}</span>
                          <span className={`px-2 py-0.2 rounded-md text-[10px] font-extrabold uppercase ${
                            item.activityType === 'factory_visit' ? 'bg-amber-500/20 text-amber-300' :
                            item.activityType === 'b2b_meeting' ? 'bg-emerald-500/20 text-emerald-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {item.activityType === 'factory_visit' ? 'Visite d\'Usine' :
                             item.activityType === 'b2b_meeting' ? 'Rendez-vous B2B' : 'Visite Institutionnelle'}
                          </span>
                        </div>
                        <h5 className="font-bold text-white">{item.title}</h5>
                        <p className="text-slate-400 flex items-center gap-1">
                          <MapPin size={11} className="text-slate-500" />
                          {item.location} ({item.partnerName})
                        </p>
                      </div>

                      <span className="px-2 py-1 rounded-lg bg-slate-900 text-slate-400 text-[10px] shrink-0">
                        {item.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 🧰 Boîte à Outils Terrain (OCR, Photos, Journal) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    Boîte à Outils Mobile du Négociateur Terrain
                  </h4>
                  <p className="text-xs text-slate-400">Assistant intelligent embarqué pour vos déplacements.</p>
                </div>
              </div>

              {/* Tool Navigation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setActiveTool('ocr')}
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTool === 'ocr'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Scan size={14} />
                  Scanner Carte OCR
                </button>

                <button
                  onClick={() => setActiveTool('photo')}
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTool === 'photo'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Camera size={14} />
                  Inspecteur Photo
                </button>

                <button
                  onClick={() => setActiveTool('journal')}
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTool === 'journal'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <FileText size={14} />
                  Journal de Bord
                </button>

                <button
                  onClick={() => setActiveTool('report')}
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTool === 'report'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Download size={14} />
                  Rapport de Synthèse
                </button>
              </div>

              {/* Tool Body */}
              <div className="pt-2">
                {activeTool === 'ocr' && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <span className="text-xs font-bold text-slate-300">Scanner / Coller les Coordonnées d'une Carte de Visite :</span>
                    <textarea
                      rows={4}
                      value={ocrCardInput}
                      onChange={(e) => setOcrCardInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      onClick={handleScanCard}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-md"
                    >
                      <Scan size={14} />
                      Extraire les Données & Créer Contact CRM
                    </button>
                  </div>
                )}

                {activeTool === 'photo' && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-slate-300">
                    <span className="font-bold text-white">Prise de vue & Inspection d'échantillons</span>
                    <p className="text-slate-400">
                      Prenez en photo une chaîne de production ou un produit pour vérifier automatiquement les marquages CE, plaques signalétiques et normes de qualité.
                    </p>
                    <div className="h-28 rounded-xl bg-slate-900 border border-dashed border-slate-800 flex items-center justify-center text-slate-500">
                      Module Caméra / Inspection prêt
                    </div>
                  </div>
                )}

                {activeTool === 'journal' && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <span className="text-xs font-bold text-slate-300">Notes & Débriefing Quotidien de la Mission :</span>
                    <textarea
                      rows={3}
                      value={newJournalNote}
                      onChange={(e) => setNewJournalNote(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500"
                      placeholder="Ex : Réunion avec le transitaire portuaire, tarifs de manutention convenus..."
                    />
                    <div className="flex items-center justify-between">
                      {journalSaved ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <Check size={14} /> Note enregistrée dans le journal !
                        </span>
                      ) : <span />}
                      <button
                        onClick={handleAddJournalNote}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                      >
                        Enregistrer au Journal
                      </button>
                    </div>

                    {/* Historical Notes */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <span className="text-[11px] font-bold text-slate-400">Historique des entrées :</span>
                      {selectedMission.dailyJournalNotes.map((note, i) => (
                        <p key={i} className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          {note}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {activeTool === 'report' && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-white">Générateur Automatique de Rapport Exécutif Diallo OS</span>
                    <p className="text-xs text-slate-400">
                      Génération en 1 clic d'une note de synthèse à destination de la Direction Générale et des bailleurs, compilant les réunions tenues, accords de principe et opportunités détectées.
                    </p>
                    <button
                      onClick={() => alert('Génération du rapport exécutif de mission PDF terminée.')}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-black shadow-md flex items-center gap-2"
                    >
                      <Download size={14} />
                      Télécharger la Synthèse Exécutive PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
