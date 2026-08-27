import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Plus, 
  FileText, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Check, 
  Sparkles,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { OpportunityCollaborativeTeam } from '../../../types';

interface CareerCollaborativeMissionModalProps {
  team: OpportunityCollaborativeTeam;
  onUpdateTeam: (updatedTeam: OpportunityCollaborativeTeam) => void;
  onClose: () => void;
}

export const CareerCollaborativeMissionModal: React.FC<CareerCollaborativeMissionModalProps> = ({
  team,
  onUpdateTeam,
  onClose
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(team.requiredRoles[0]?.assignedMember?.name || 'Vous');

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = team.sharedTasks.map(t => 
      t.id === taskId ? { ...t, isDone: !t.isDone } : t
    );
    onUpdateTeam({
      ...team,
      sharedTasks: updatedTasks
    });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      assigneeName: newTaskAssignee,
      isDone: false,
      deadline: 'Dans 3 jours'
    };
    onUpdateTeam({
      ...team,
      sharedTasks: [...team.sharedTasks, newTask]
    });
    setNewTaskTitle('');
  };

  const completedCount = team.sharedTasks.filter(t => t.isDone).length;
  const progressPercent = team.sharedTasks.length > 0 ? Math.round((completedCount / team.sharedTasks.length) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fade-up">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <Sparkles size={14} /> Équipe d'Opportunité & Réponse Collective
              </div>
              <h2 className="text-xl font-black text-white">{team.title}</h2>
              <p className="text-xs text-slate-300 mt-1">Cible : <strong className="text-white">{team.targetOpportunityTitle}</strong></p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Budget & Progress Banner */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-3 py-1.5 rounded-xl font-bold">
              <DollarSign size={14} /> Budget Cible : {team.targetOpportunityBudget}
            </div>
            <span className="text-xs text-slate-400">Statut : <strong className="text-indigo-300 uppercase">{team.status}</strong></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-xs font-bold text-white">{progressPercent}% complété</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Members & Roles */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <UserCheck size={14} /> Membres & Rôles Complémentaires (Consentement Mutuel)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {team.requiredRoles.map(role => (
                <div key={role.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-bold text-indigo-300">{role.roleTitle}</h4>
                    {role.assignedMember?.hasConsented && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/40 font-bold">
                        Consentement Actif
                      </span>
                    )}
                  </div>

                  {role.assignedMember ? (
                    <div className="flex items-center gap-3">
                      <img 
                        src={role.assignedMember.avatarUrl} 
                        alt={role.assignedMember.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-700" 
                      />
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-white truncate">{role.assignedMember.name}</h5>
                        <p className="text-[10px] text-slate-400 truncate">{role.assignedMember.expertise}</p>
                      </div>
                    </div>
                  ) : (
                    <button className="w-full py-2 bg-slate-900 border border-dashed border-slate-700 rounded-xl text-[11px] text-slate-400 hover:text-white flex items-center justify-center gap-1">
                      <Plus size={13} /> Inviter un profil qualifié
                    </button>
                  )}

                  <div className="flex flex-wrap gap-1 pt-1">
                    {role.skillsNeeded.map((sk, i) => (
                      <span key={i} className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Tasks */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Plan d'Action & Tâches Partagées
            </span>

            {/* Add task bar */}
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Nouvelle tâche partagée du consortium..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddTask}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500"
              >
                Ajouter
              </button>
            </div>

            {/* Tasks List */}
            <div className="space-y-2">
              {team.sharedTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    task.isDone 
                      ? 'bg-slate-950/40 border-slate-800 opacity-60' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                      task.isDone ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600'
                    }`}>
                      {task.isDone && <Check size={13} />}
                    </div>
                    <div>
                      <span className={`text-xs ${task.isDone ? 'line-through text-slate-500' : 'text-white font-medium'}`}>
                        {task.title}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Assigné à : <strong className="text-indigo-300">{task.assigneeName}</strong> • Échéance : {task.deadline}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Documents */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText size={14} /> Documents Partagés du Consortium
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {team.sharedDocuments.map(doc => (
                <div key={doc.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} className="text-indigo-400" />
                    <div>
                      <h5 className="text-xs font-bold text-white">{doc.name}</h5>
                      <span className="text-[10px] text-slate-400">Déposé par {doc.uploadedBy} • {doc.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
