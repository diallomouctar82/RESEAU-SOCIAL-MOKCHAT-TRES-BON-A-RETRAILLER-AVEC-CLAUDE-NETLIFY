
import React from 'react';
import { UserProfile } from '../types';
import { Shield, Award, TrendingUp, Share2, MapPin, QrCode } from 'lucide-react';

interface ProfileProps {
    userProfile?: UserProfile;
}

// Fallback constant import removed as we use props now, but needed for types if isolated
import { USER_PROFILE as DEFAULT_PROFILE } from '../constants';

export const Profile: React.FC<ProfileProps> = ({ userProfile = DEFAULT_PROFILE }) => {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-up">
      
      {/* Digital Passport Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-slate-700">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
        <div className="absolute top-8 right-8 opacity-20">
           <QrCode size={64} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
           {/* Avatar Section */}
           <div className="flex-shrink-0 relative group">
             <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/20 shadow-lg">
               <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
             </div>
             <div className="absolute -bottom-3 -right-3 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-slate-900 shadow-sm">
               NIV {userProfile.level}
             </div>
           </div>

           {/* Info Section */}
           <div className="flex-1 text-center md:text-left space-y-4">
             <div>
                <h2 className="text-sm font-semibold text-brand-400 uppercase tracking-widest mb-1">Passeport Citoyen du Monde</h2>
                <h1 className="text-3xl font-bold tracking-tight">{userProfile.name}</h1>
                <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Shield size={16} /> {userProfile.citizenshipId}
                </p>
             </div>

             <div className="grid grid-cols-2 gap-4 max-w-md mx-auto md:mx-0 bg-white/5 p-4 rounded-xl border border-white/10">
               <div>
                 <div className="text-xs text-slate-400 uppercase">Solde</div>
                 <div className="font-medium text-yellow-400 font-mono">{userProfile.credits.toFixed(0)} Ⓒ</div>
               </div>
               <div>
                 <div className="text-xs text-slate-400 uppercase">Origine</div>
                 <div className="font-medium flex items-center gap-1"><MapPin size={12} /> France</div>
               </div>
             </div>
             
             {/* XP Bar */}
             <div className="max-w-md">
               <div className="flex justify-between text-xs font-semibold mb-1">
                 <span className="text-brand-300">{userProfile.xp} XP</span>
                 <span className="text-slate-500">{userProfile.nextLevelXp} XP</span>
               </div>
               <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                 <div className="bg-gradient-to-r from-brand-500 to-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(userProfile.xp / userProfile.nextLevelXp) * 100}%` }}></div>
               </div>
               <p className="text-xs text-slate-500 mt-1 text-right">Prochain niveau : Expert Senior</p>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Skills */}
         <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-600" /> Compétences
            </h3>
            <div className="space-y-4">
               {userProfile.skills.map(skill => (
                 <div key={skill.name}>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="font-medium text-gray-700">{skill.name}</span>
                     <span className="text-gray-400">{skill.progress}%</span>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-2">
                     <div className="bg-brand-600 h-full rounded-full transition-all duration-1000" style={{ width: `${skill.progress}%` }}></div>
                   </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Badges */}
         <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={20} className="text-yellow-500" /> Badges & Certifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               {userProfile.badges.map(badge => (
                 <div key={badge.id} className="bg-gray-50 rounded-xl p-4 flex flex-col items-center text-center border border-gray-100 hover:border-brand-200 transition-colors group">
                    <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">{badge.icon}</div>
                    <div className="font-bold text-gray-900 text-sm">{badge.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{badge.description}</div>
                 </div>
               ))}
               
               {/* Placeholder for locked badge */}
               <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center text-center border border-gray-100 border-dashed opacity-50">
                    <div className="w-10 h-10 bg-gray-200 rounded-full mb-2 flex items-center justify-center">🔒</div>
                    <div className="font-bold text-gray-400 text-sm">Badge Mystère</div>
                    <div className="text-xs text-gray-400 mt-1">Continuez d'apprendre...</div>
               </div>
            </div>
         </div>
      </div>
      
      <div className="text-center">
        <button className="text-brand-600 font-medium hover:text-brand-700 flex items-center justify-center gap-2 mx-auto">
           <Share2 size={18} /> Partager mon profil public
        </button>
      </div>

    </div>
  );
};
