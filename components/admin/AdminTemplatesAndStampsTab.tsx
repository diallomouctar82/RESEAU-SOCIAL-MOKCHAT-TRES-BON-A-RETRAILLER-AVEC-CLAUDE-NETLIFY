import React, { useState } from 'react';
import { 
  FileText, 
  Stamp, 
  PenTool, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Check, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  CheckCircle2,
  Lock,
  Download,
  Printer
} from 'lucide-react';
import { OfficialDocumentTemplate, OfficialSignature, OfficialStamp } from '../../types';
import { adminConfigService } from '../../services/adminConfigService';
import { OfficialLetterPreviewModal } from './OfficialLetterPreviewModal';
import { SmartConfirmModal } from '../ui/SmartConfirmModal';

interface AdminTemplatesAndStampsTabProps {
  templates: OfficialDocumentTemplate[];
  signatures: OfficialSignature[];
  stamps: OfficialStamp[];
  onReload: () => void;
}

export const AdminTemplatesAndStampsTab: React.FC<AdminTemplatesAndStampsTabProps> = ({
  templates,
  signatures,
  stamps,
  onReload
}) => {
  const [section, setSection] = useState<'templates' | 'signatures' | 'stamps'>('templates');

  // Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState<OfficialDocumentTemplate | null>(null);

  // Template Edit / Add State
  const [editingTemplate, setEditingTemplate] = useState<OfficialDocumentTemplate | null>(null);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);

  // Signature Edit / Add State
  const [editingSignature, setEditingSignature] = useState<OfficialSignature | null>(null);
  const [isAddSignatureOpen, setIsAddSignatureOpen] = useState(false);

  // Stamp Edit / Add State
  const [editingStamp, setEditingStamp] = useState<OfficialStamp | null>(null);
  const [isAddStampOpen, setIsAddStampOpen] = useState(false);

  // New Template state
  const [newTemplateData, setNewTemplateData] = useState<Omit<OfficialDocumentTemplate, 'id' | 'updatedAt'>>({
    title: '',
    category: 'letter',
    description: '',
    headerTitle: 'RÉPUBLIQUE LE MONDE À VOUS',
    headerSubtitle: 'Secrétariat Général & Affaires Officielles',
    watermarkText: 'LE MONDE À VOUS — OFFICIEL',
    bodyTemplate: 'À l\'attention de {{DESTINATAIRE}}\n\nObjet : {{OBJET}}\n\nFait à {{VILLE}}, le {{DATE}}\n\n{{SIGNER_NAME}}',
    variables: [
      { key: 'DESTINATAIRE', label: 'Destinataire', defaultValue: 'Monsieur le Préfet', description: 'Autorité' },
      { key: 'OBJET', label: 'Objet', defaultValue: 'Demande officielle', description: 'Objet de la lettre' },
      { key: 'VILLE', label: 'Ville', defaultValue: 'Paris', description: 'Lieu d’émission' },
      { key: 'DATE', label: 'Date', defaultValue: '27 Août 2026', description: 'Date' }
    ],
    defaultSignerId: signatures[0]?.id || '',
    defaultStampId: stamps[0]?.id || '',
    isOfficial: true,
    qrCodeVerification: true,
    footerLegalText: 'Document certifié conforme selon le protocole de signature électronique LMAV.',
    author: 'Super-Admin'
  });

  // Save Handlers
  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    adminConfigService.updateTemplate(editingTemplate.id, editingTemplate);
    setEditingTemplate(null);
    onReload();
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateData.title) return;
    adminConfigService.addTemplate(newTemplateData);
    setIsAddTemplateOpen(false);
    onReload();
  };

  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState<{ id: string; title: string } | null>(null);

  const handleDeleteTemplate = (id: string, title: string) => {
    setConfirmDeleteTemplate({ id, title });
  };

  const confirmDeleteTemplateAction = () => {
    if (!confirmDeleteTemplate) return;
    adminConfigService.deleteTemplate(confirmDeleteTemplate.id);
    setConfirmDeleteTemplate(null);
    onReload();
  };

  const handleSaveSignature = () => {
    if (!editingSignature) return;
    adminConfigService.updateSignature(editingSignature.id, editingSignature);
    setEditingSignature(null);
    onReload();
  };

  const handleSaveStamp = () => {
    if (!editingStamp) return;
    adminConfigService.updateStamp(editingStamp.id, editingStamp);
    setEditingStamp(null);
    onReload();
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Top Header & Section Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-blue-600" size={22} />
            Modèles de Lettres, Signatures Autographes & Cachets Officiels
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gérez tous les paramètres de rédaction, les modèles certifiés et l'apposition cryptographique des sceaux souverains.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1">
          <button
            onClick={() => setSection('templates')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              section === 'templates' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            Modèles de Lettres ({templates.length})
          </button>
          <button
            onClick={() => setSection('signatures')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              section === 'signatures' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool size={14} />
            Signatures ({signatures.length})
          </button>
          <button
            onClick={() => setSection('stamps')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              section === 'stamps' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stamp size={14} />
            Cachets & Sceaux ({stamps.length})
          </button>
        </div>
      </div>

      {/* 1. MODÈLES DE DOCUMENTS & LETTRES */}
      {section === 'templates' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-slate-600">Bibliothèque des Actes, Recours et Contrats certifiés :</p>
            <button
              onClick={() => setIsAddTemplateOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              <Plus size={15} />
              Nouveau Modèle de Lettre
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {templates.map(tpl => (
              <div 
                key={tpl.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {tpl.category}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1">{tpl.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{tpl.description}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>En-tête Officiel :</span>
                    <span className="font-bold text-slate-800 text-[11px] truncate max-w-[220px]">{tpl.headerTitle}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Variables dynamiques :</span>
                    <span className="font-bold text-blue-600">{tpl.variables.length} champs variables</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Auteur référent :</span>
                    <span className="font-bold text-slate-800">{tpl.author}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-mono text-slate-400">Mis à jour le {tpl.updatedAt}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewTemplate(tpl)}
                      className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                    >
                      <Eye size={13} />
                      Aperçu Live & Export
                    </button>
                    <button
                      onClick={() => setEditingTemplate({ ...tpl })}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      title="Éditer le modèle"
                      aria-label="Éditer le modèle"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id, tpl.title)}
                      className="p-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      title="Supprimer le modèle"
                      aria-label="Supprimer le modèle"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. SIGNATURES AUTOGRAPHES & VECTORIELLES */}
      {section === 'signatures' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-slate-600">Signatures officielles enregistrées des Experts et Dirigeants :</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {signatures.map(sig => (
              <div key={sig.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{sig.signerName}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{sig.signerTitle}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    sig.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {sig.isActive ? 'Active' : 'Désactivée'}
                  </span>
                </div>

                {/* Signature Preview Canvas Box */}
                <div className="h-24 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-2">
                  <img src={sig.signatureSvgOrDataUrl} alt={sig.signerName} className="h-16 w-auto object-contain" />
                </div>

                <div className="text-[10px] font-mono text-slate-400 bg-slate-50 p-2 rounded-xl truncate">
                  SHA-256 : {sig.hashSha256}
                </div>

                <button
                  onClick={() => setEditingSignature({ ...sig })}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Modifier Titre & Clé
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CACHETS & SCEAUX OFFICIELS */}
      {section === 'stamps' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-slate-600">Sceaux d'État, Cachets Notariaux et Tampons de Séquestre :</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {stamps.map(stamp => (
              <div key={stamp.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 text-center flex flex-col items-center">
                <div className="w-full flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {stamp.securityLevel}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600">CERTIFIÉ</span>
                </div>

                {/* Stamp visual simulation */}
                <div 
                  className="w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center p-2 text-center my-2 shadow-inner"
                  style={{ borderColor: stamp.color, color: stamp.color }}
                >
                  <div className="text-[7px] font-black uppercase tracking-tighter leading-tight">
                    {stamp.institution}
                  </div>
                  <div className="my-1">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="text-[6px] font-mono font-bold uppercase tracking-widest leading-none">
                    {stamp.motto}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{stamp.title}</h4>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">{stamp.securityHash}</p>
                </div>

                <button
                  onClick={() => setEditingStamp({ ...stamp })}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Ajuster Devise & Couleur
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Full Edit Official Template */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit className="text-blue-600" size={18} />
                  Éditeur de Modèle : {editingTemplate.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Configurez le corps, les en-têtes et les variables dynamiques.</p>
              </div>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-2 -m-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Titre du Modèle</label>
                  <input
                    type="text"
                    value={editingTemplate.title}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="letter">Lettre Officielle & Institutionnelle</option>
                    <option value="procedure">Procédure & Recours Administratif</option>
                    <option value="certificate">Attestation & Diplôme</option>
                    <option value="contract">Contrat & Convention B2B</option>
                    <option value="mandate">Mandat & Pouvoir Juridique</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">En-tête Institutionnel (Haut de Page)</label>
                <input
                  type="text"
                  value={editingTemplate.headerTitle}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, headerTitle: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sous-titre / Direction Émettrice</label>
                <input
                  type="text"
                  value={editingTemplate.headerSubtitle}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, headerSubtitle: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Texte du Filigrane</label>
                <input
                  type="text"
                  value={editingTemplate.watermarkText}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, watermarkText: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Corps du Document (Utilisez <span className="font-mono text-blue-600">{`{{VARIABLE}}`}</span> pour les valeurs dynamiques)
                </label>
                <textarea
                  rows={8}
                  value={editingTemplate.bodyTemplate}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, bodyTemplate: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Signataire par Défaut</label>
                  <select
                    value={editingTemplate.defaultSignerId}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultSignerId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {signatures.map(sig => (
                      <option key={sig.id} value={sig.id}>{sig.signerName} ({sig.signerTitle})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cachet par Défaut</label>
                  <select
                    value={editingTemplate.defaultStampId}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultStampId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {stamps.map(st => (
                      <option key={st.id} value={st.id}>{st.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                <Check size={14} />
                Enregistrer le Modèle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Signature */}
      {editingSignature && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Édition Signature Numérique</h3>
              <button
                onClick={() => setEditingSignature(null)}
                className="p-2 -m-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom du Signataire</label>
                <input
                  type="text"
                  value={editingSignature.signerName}
                  onChange={(e) => setEditingSignature({ ...editingSignature, signerName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre / Qualité</label>
                <input
                  type="text"
                  value={editingSignature.signerTitle}
                  onChange={(e) => setEditingSignature({ ...editingSignature, signerTitle: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Signature Active</span>
                <input
                  type="checkbox"
                  checked={editingSignature.isActive}
                  onChange={(e) => setEditingSignature({ ...editingSignature, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setEditingSignature(null)} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Annuler</button>
              <button onClick={handleSaveSignature} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Stamp */}
      {editingStamp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Édition Cachet & Sceau</h3>
              <button
                onClick={() => setEditingStamp(null)}
                className="p-2 -m-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institution</label>
                <input
                  type="text"
                  value={editingStamp.institution}
                  onChange={(e) => setEditingStamp({ ...editingStamp, institution: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Devise / Mentions</label>
                <input
                  type="text"
                  value={editingStamp.motto}
                  onChange={(e) => setEditingStamp({ ...editingStamp, motto: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Couleur d'Encrage</label>
                <input
                  type="color"
                  value={editingStamp.color}
                  onChange={(e) => setEditingStamp({ ...editingStamp, color: e.target.value })}
                  className="w-full h-9 p-1 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setEditingStamp(null)} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Annuler</button>
              <button onClick={handleSaveStamp} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation de suppression de modèle */}
      <SmartConfirmModal
        isOpen={!!confirmDeleteTemplate}
        onClose={() => setConfirmDeleteTemplate(null)}
        onConfirm={confirmDeleteTemplateAction}
        title={`Supprimer le modèle « ${confirmDeleteTemplate?.title || ''} » ?`}
        description="Ce modèle de lettre officielle sera définitivement supprimé de la bibliothèque."
        actionType="delete"
        riskLevel="high"
        confirmLabel="Supprimer définitivement"
      />

      {/* Live Preview Modal for Template */}
      {previewTemplate && (
        <OfficialLetterPreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
};
