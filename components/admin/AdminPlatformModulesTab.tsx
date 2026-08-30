import React, { useState } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Layers2
} from 'lucide-react';
import { PlatformModuleConfig } from '../../types';
import { adminConfigService } from '../../services/adminConfigService';

interface AdminPlatformModulesTabProps {
  modules: PlatformModuleConfig[];
  onReload: () => void;
}

export const AdminPlatformModulesTab: React.FC<AdminPlatformModulesTabProps> = ({
  modules,
  onReload
}) => {
  const [filterModuleCategory, setFilterModuleCategory] = useState<string>('all');

  const categories = ['all', 'Pilier 1', 'Pilier 2', 'Pilier 3', 'Pilier 4', 'Pilier 5'];

  const filteredModules = modules.filter(m => 
    filterModuleCategory === 'all' || m.category === filterModuleCategory
  );

  const handleToggleModuleEnabled = (mod: PlatformModuleConfig) => {
    adminConfigService.updateModule(mod.id, { isEnabled: !mod.isEnabled });
    onReload();
  };

  const handleToggleModuleMaintenance = (mod: PlatformModuleConfig) => {
    adminConfigService.updateModule(mod.id, { inMaintenance: !mod.inMaintenance });
    onReload();
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="text-blue-600" size={22} />
            Modules Plateforme & Piliers Souverains ({modules.length})
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Activez, désactivez ou basculez en maintenance les différents modules métiers de l'écosystème Le Monde à Vous.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterModuleCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                filterModuleCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {cat === 'all' ? 'Tous les Piliers' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Platform Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map(mod => (
          <div 
            key={mod.id}
            className={`bg-white rounded-2xl border p-5 space-y-3 transition shadow-sm ${
              !mod.isEnabled ? 'bg-slate-50/70 border-slate-200 opacity-80' : 
              mod.inMaintenance ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {mod.category}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{mod.label}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{mod.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-500">Niveau d'accès : </span>
                <span className="font-bold text-slate-800 uppercase text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200">
                  {mod.accessLevel}
                </span>
              </div>
              <div className="text-slate-500 text-[11px]">
                <span className="font-bold text-slate-800">{mod.activeSessionsCount}</span> sessions
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleModuleEnabled(mod)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                    mod.isEnabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {mod.isEnabled ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {mod.isEnabled ? 'Activé' : 'Désactivé'}
                </button>

                <button
                  onClick={() => handleToggleModuleMaintenance(mod)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                    mod.inMaintenance
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {mod.inMaintenance ? 'En Maintenance' : 'Opérationnel'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
