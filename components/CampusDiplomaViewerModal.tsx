// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 MODAL DE VISUALISATION & DÉLIVRANCE DE DIPLÔME OFFICIEL — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React from 'react';
import { 
    X, 
    Printer, 
    Download, 
    Share2, 
    ShieldCheck, 
    Award, 
    CheckCircle2, 
    QrCode, 
    Copy,
    ExternalLink,
    Lock
} from 'lucide-react';
import { Certificate, UserProfile } from '../types';

interface CampusDiplomaViewerModalProps {
    certificate: Certificate;
    userProfile: UserProfile;
    onClose: () => void;
}

export const CampusDiplomaViewerModal: React.FC<CampusDiplomaViewerModalProps> = ({
    certificate,
    userProfile,
    onClose
}) => {
    const handlePrint = () => {
        window.print();
    };

    const handleCopySerial = () => {
        navigator.clipboard.writeText(certificate.serialNumber);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="max-w-4xl w-full flex flex-col my-auto space-y-4">
                
                {/* Top Action Bar */}
                <div className="flex items-center justify-between text-white px-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <ShieldCheck size={16} /> Titre & Diplôme Authentifié par MokTrust
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur"
                        >
                            <Printer size={14} /> Imprimer / PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Cadre Officiel du Diplôme */}
                <div className="bg-[#fffdf7] text-slate-900 rounded-3xl p-8 sm:p-14 shadow-2xl border-[12px] border-double border-slate-900 relative overflow-hidden text-center space-y-6">
                    
                    {/* Filigrane d'authenticité */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                        <Award size={500} />
                    </div>

                    {/* Sceau & En-tête Supérieur */}
                    <div className="space-y-2 relative z-10">
                        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-slate-600 border-b-2 border-slate-900 pb-1">
                            Académie Universelle & Chaire d'Excellence
                        </div>
                        <h2 className="text-xl sm:text-2xl font-serif font-black tracking-widest text-slate-900 uppercase">
                            LE MONDE À VOUS
                        </h2>
                        <p className="text-[11px] text-slate-500 italic">
                            {certificate.institution || "Institut International d'Enseignement et de Recherche"}
                        </p>
                    </div>

                    {/* Titre du Diplôme */}
                    <div className="py-2 relative z-10">
                        <div className="text-xs font-serif uppercase tracking-widest text-amber-800 font-bold mb-2">
                            DIPLÔME D'ÉTAT & CERTIFICATION SUPÉRIEURE
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-serif font-black text-slate-950 leading-tight">
                            {certificate.courseTitle}
                        </h1>
                    </div>

                    {/* Récipiendaire */}
                    <div className="space-y-1 relative z-10 py-2">
                        <p className="text-xs text-slate-600 italic">
                            Le Conseil Académique atteste que les épreuves terminales ont été validées avec succès par
                        </p>
                        <div className="text-2xl sm:text-3xl font-serif font-black text-indigo-950 underline decoration-amber-500/50 decoration-2 underline-offset-8">
                            {certificate.studentName || userProfile.name}
                        </div>
                        <p className="text-xs text-slate-500 pt-2">
                            Note Finale Attribuée : <span className="font-bold text-slate-900">{certificate.grade.toFixed(1)} / 20</span>
                        </p>
                    </div>

                    {/* Signatures & Sceau d'Or */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-200 relative z-10">
                        
                        {/* Signature Professeur Diallo */}
                        <div className="text-center space-y-1">
                            <div className="font-serif italic text-base text-slate-800">Professeur Diallo</div>
                            <div className="h-0.5 w-32 bg-slate-900 mx-auto"></div>
                            <div className="text-[10px] uppercase font-bold text-slate-500">
                                Président du Jury Académique
                            </div>
                        </div>

                        {/* Sceau d'Or en relief */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 text-slate-950 font-black flex flex-col items-center justify-center shadow-lg border-4 border-amber-200 rotate-6 shrink-0">
                            <ShieldCheck size={24} className="mb-0.5" />
                            <span className="text-[9px] uppercase tracking-wider">OFFICIEL</span>
                            <span className="text-[7px] font-mono">AUTHENTIQUE</span>
                        </div>

                        {/* Date & N° de Série */}
                        <div className="text-center space-y-1">
                            <div className="font-mono text-xs text-slate-800 font-bold">{certificate.issueDate}</div>
                            <div className="h-0.5 w-32 bg-slate-900 mx-auto"></div>
                            <div className="text-[10px] uppercase font-bold text-slate-500">
                                Date de Délivrance
                            </div>
                        </div>

                    </div>

                    {/* Pied de Page Cryptographique */}
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-100 gap-2">
                        <div className="flex items-center gap-1.5">
                            <Lock size={12} className="text-emerald-600" />
                            <span>Hash / N° de Série : {certificate.serialNumber}</span>
                        </div>
                        <div className="text-slate-500">
                            Vérifiable sur la plateforme Le Monde à Vous (MokTrust Verified)
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};
