import React from 'react';
import { 
  X, 
  MapPin, 
  HardDrive, 
  Video, 
  MessageSquare, 
  Sparkles, 
  Lock, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  Shield,
  HelpCircle,
  LucideIcon
} from 'lucide-react';
import { TRANSVERSAL_SERVICES, TransversalServiceDef } from './NavigationItems';

interface TransversalServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onOpenDialloOS: () => void;
}

export const TransversalServicesModal: React.FC<TransversalServicesModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenDialloOS
}) => {
  if (!isOpen) return null;

  const handleLaunchService = (service: TransversalServiceDef) => {
    if (service.tabTarget === 'diallo-os') {
      onClose();
      onOpenDialloOS();
    } else {
      onNavigate(service.tabTarget);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Capacités & Services Transversaux</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
                  Google Workspace & Sécurité
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Ces services agissent comme des moteurs partagés et s’intègrent naturellement au cœur de vos objectifs de vie.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 bg-slate-50">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-900 flex items-start gap-3">
            <HelpCircle size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-indigo-950">Pourquoi ces services ne sont plus des applications isolées ?</p>
              <p className="mt-0.5 text-indigo-800 leading-relaxed">
                Plutôt que d'ouvrir Google Maps ou Drive séparément, ils sont désormais directement appelés là où vous en avez besoin (localisation d'un logement, coffre documentaire d'un dossier administratif, visio avec un expert ou salon B2B). Vous pouvez également ouvrir chaque vue dédiée ci-dessous.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {TRANSVERSAL_SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-600 flex items-center justify-center transition">
                          <Icon size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{service.title}</h3>
                          <span className="text-[10px] text-slate-500 font-medium">{service.provider}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {service.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {service.description}
                    </p>
                  </div>

                  <div>
                    <div className="mb-3 pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Appelé dans vos parcours :
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {service.integratedIn.map((mod, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                          >
                            {mod}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleLaunchService(service)}
                      className="w-full py-2 px-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
                    >
                      <span>Ouvrir l'Espace Dédié</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Shield size={14} className="text-indigo-600" />
            <span>Sécurité et synchronisation chiffrée de bout en bout</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
