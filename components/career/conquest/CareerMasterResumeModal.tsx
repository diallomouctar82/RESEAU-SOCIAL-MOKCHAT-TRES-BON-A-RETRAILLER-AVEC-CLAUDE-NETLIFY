import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Sparkles, 
  Globe, 
  Edit3, 
  Trash2, 
  Save, 
  Download, 
  TrendingUp,
  Layers
} from 'lucide-react';
import { MasterResumeProfile, MasterResumeExperience, MasterResumeSkill } from '../../../types';

interface CareerMasterResumeModalProps {
  masterResume: MasterResumeProfile;
  onUpdateMasterResume: (updated: MasterResumeProfile) => void;
  onClose: () => void;
}

export const CareerMasterResumeModal: React.FC<CareerMasterResumeModalProps> = ({
  masterResume,
  onUpdateMasterResume,
  onClose
}) => {
  const [profile, setProfile] = useState<MasterResumeProfile>(masterResume);
  const [activeTab, setActiveTab] = useState<'experiences' | 'skills' | 'education' | 'certifs' | 'portfolio'>('experiences');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [showAddExpModal, setShowAddExpModal] = useState(false);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);

  // New Exp form state
  const [newRole, setNewRole] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAchievements, setNewAchievements] = useState('');

  // New Skill form state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<MasterResumeSkill['category']>('technique');
  const [newSkillLevel, setNewSkillLevel] = useState(4);

  const handleSaveBio = () => {
    setIsEditingBio(false);
    onUpdateMasterResume(profile);
  };

  const handleAddExperience = () => {
    if (!newRole || !newCompany) return;
    const achievementsList = newAchievements
      .split('\n')
      .map(a => a.trim())
      .filter(a => a.length > 0);

    const newExp: MasterResumeExperience = {
      id: `exp-${Date.now()}`,
      role: newRole,
      company: newCompany,
      location: newLocation || 'International',
      startDate: '2024-01',
      endDate: 'Présent',
      isCurrent: true,
      description: newDesc,
      keyAchievements: achievementsList.length > 0 ? achievementsList : ['Pilotage opérationnel de la mission.'],
      skillsUsed: ['Direction', 'Stratégie', 'Exécution'],
      category: 'emploi',
      verifiedByLMav: true
    };

    const updated = {
      ...profile,
      experiences: [newExp, ...profile.experiences],
      lastUpdated: 'À l\'instant'
    };

    setProfile(updated);
    onUpdateMasterResume(updated);
    setShowAddExpModal(false);
    setNewRole('');
    setNewCompany('');
    setNewLocation('');
    setNewDesc('');
    setNewAchievements('');
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const newSkill: MasterResumeSkill = {
      name: newSkillName.trim(),
      category: newSkillCategory,
      level: newSkillLevel,
      verified: true,
      verifiedSource: 'Déclaré & Attesté'
    };

    const updated = {
      ...profile,
      skills: [...profile.skills, newSkill],
      lastUpdated: 'À l\'instant'
    };

    setProfile(updated);
    onUpdateMasterResume(updated);
    setShowAddSkillModal(false);
    setNewSkillName('');
  };

  const handleDeleteExp = (expId: string) => {
    const updated = {
      ...profile,
      experiences: profile.experiences.filter(e => e.id !== expId),
      lastUpdated: 'À l\'instant'
    };
    setProfile(updated);
    onUpdateMasterResume(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fade-up">
      <div className="bg-slate-900 text-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-800">
        
        {/* HEADER */}
        <div className="p-5 md:p-6 bg-slate-950 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-2xl">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Référentiel Professionnel Vivant</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-extrabold border border-emerald-800/60 flex items-center gap-1">
                  <ShieldCheck size={11} /> Source Unique de Vérité
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-black">
                CV Maître Universel ({profile.fullName})
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* PROFILE SUMMARY BAR */}
        <div className="bg-slate-950/60 p-5 md:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-black text-white">{profile.headlineTitle}</h3>
              <span className="text-xs text-slate-400">· {profile.location}</span>
            </div>
            {isEditingBio ? (
              <div className="space-y-2 pt-2">
                <textarea
                  value={profile.summaryBio}
                  onChange={(e) => setProfile({ ...profile, summaryBio: e.target.value })}
                  className="w-full h-20 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white resize-none"
                />
                <button
                  onClick={handleSaveBio}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Save size={12} /> Enregistrer le résumé
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                {profile.summaryBio}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditingBio(!isEditingBio)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Edit3 size={13} /> {isEditingBio ? 'Annuler' : 'Modifier Résumé'}
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 gap-2 overflow-x-auto">
          {[
            { id: 'experiences', label: 'Expériences Validées', count: profile.experiences.length, icon: Briefcase },
            { id: 'skills', label: 'Compétences & Niveaux', count: profile.skills.length, icon: Sparkles },
            { id: 'education', label: 'Formations & Diplômes', count: profile.education.length, icon: GraduationCap },
            { id: 'certifs', label: 'Certifications LMAV', count: profile.certifications.length, icon: Award },
            { id: 'portfolio', label: 'Preuves & Réalisations', count: profile.portfolioProjects.length, icon: Layers }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* CONTENT VIEWPORT */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900 space-y-6">
          
          {/* TAB 1: EXPERIENCES */}
          {activeTab === 'experiences' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-400">
                  Toutes les opportunités génèrent leurs CV spécifiques directement depuis ces expériences authentiques.
                </p>
                <button
                  onClick={() => setShowAddExpModal(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Plus size={14} /> Ajouter une Expérience
                </button>
              </div>

              <div className="space-y-3">
                {profile.experiences.map((exp) => (
                  <div 
                    key={exp.id} 
                    className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{exp.role}</h4>
                          {exp.verifiedByLMav && (
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 size={10} /> Vérifiée
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-blue-400 font-semibold">{exp.company} · {exp.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          {exp.startDate} → {exp.endDate}
                        </span>
                        <button
                          onClick={() => handleDeleteExp(exp.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{exp.description}</p>

                    {/* Achievements */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Accomplissements & Résultats chiffrés :</span>
                      <ul className="space-y-1">
                        {exp.keyAchievements.map((ach, idx) => (
                          <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                            <span className="text-emerald-400 font-black">✓</span>
                            <span>{ach}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Skills & Metrics */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {exp.skillsUsed.map((sk, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded-md text-[10px] border border-slate-800">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SKILLS */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-400">
                  Matrice de compétences vérifiées par attestations, cours Campus ou évaluations Coach 3D.
                </p>
                <button
                  onClick={() => setShowAddSkillModal(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Plus size={14} /> Ajouter une Compétence
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.skills.map((sk, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{sk.name}</span>
                        {sk.verified && (
                          <span className="text-emerald-400" title={sk.verifiedSource || 'Vérifié'}>
                            <ShieldCheck size={13} />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize">{sk.category.replace('_', ' ')}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div 
                          key={lvl} 
                          className={`w-2 h-4 rounded-sm ${
                            lvl <= sk.level ? 'bg-blue-500' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EDUCATION */}
          {activeTab === 'education' && (
            <div className="space-y-3">
              {profile.education.map((edu) => (
                <div key={edu.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-white">{edu.degree}</h4>
                      <p className="text-xs text-blue-400 font-medium">{edu.institution} · {edu.location}</p>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      Promotion {edu.graduationYear}
                    </span>
                  </div>
                  {edu.honors && (
                    <span className="inline-block text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                      🏆 {edu.honors}
                    </span>
                  )}
                  {edu.keyCourses && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {edu.keyCourses.map((c, idx) => (
                        <span key={idx} className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: CERTIFS */}
          {activeTab === 'certifs' && (
            <div className="space-y-3">
              {profile.certifications.map((cert, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                      <Award size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">{cert.title}</h4>
                      <p className="text-[11px] text-slate-400">{cert.issuer} · {cert.year}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {cert.certificateId || 'CERT-OK'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-3">
              {profile.portfolioProjects.map((proj, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-white">{proj.title}</h4>
                    <span className="text-xs text-blue-400 font-semibold">{proj.role}</span>
                  </div>
                  <p className="text-xs text-slate-300">{proj.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.tags.map((t, tidx) => (
                      <span key={tidx} className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* MODAL: ADD EXPERIENCE */}
        {showAddExpModal && (
          <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl animate-fade-up">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Plus size={16} className="text-blue-400" /> Ajouter une Expérience Validée
                </h4>
                <button onClick={() => setShowAddExpModal(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Intitulé du Poste / Mission</label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Ex: Responsable Commercial Afrique de l'Ouest"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Entreprise / Organisation</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="Ex: Groupe Logistique Diallo & Co"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Description sommaire</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Responsabilités clés et périmètre..."
                    className="w-full h-16 bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Accomplissements chiffrés (1 par ligne)</label>
                  <textarea
                    value={newAchievements}
                    onChange={(e) => setNewAchievements(e.target.value)}
                    placeholder="+35% de ventes réalisées&#10;12 personnes managées&#10;Négociation de 3 contrats d'envergure"
                    className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddExpModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddExperience}
                  disabled={!newRole || !newCompany}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold"
                >
                  Enregistrer dans le CV Maître
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD SKILL */}
        {showAddSkillModal && (
          <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-fade-up">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Plus size={16} className="text-blue-400" /> Ajouter une Compétence
                </h4>
                <button onClick={() => setShowAddSkillModal(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Nom de la compétence</label>
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="Ex: Négociation Contrats Incoterms 2020"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Catégorie</label>
                  <select
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                  >
                    <option value="technique">Technique & IT</option>
                    <option value="metier">Métier & Business</option>
                    <option value="gestion_projet">Gestion de Projet</option>
                    <option value="soft_skills">Soft Skills & Leadership</option>
                    <option value="langues">Langues</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Niveau d'expertise (1 à 5)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setNewSkillLevel(lvl)}
                        className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                          newSkillLevel === lvl ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {lvl}/5
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddSkillModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddSkill}
                  disabled={!newSkillName.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
