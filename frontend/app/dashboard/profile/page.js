'use client';
import { useState, useEffect } from 'react';
import { Edit2, User, Mail, MapPin, Award, Activity, Target, Zap } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem('userProfile')) || {
      name: "Kaze Arufa",
      age: 25,
      email: "kaze.arufa@example.com",
      location: "Tokyo, Japan",
      bio: "Passionate about personal growth and mindfulness. Love exploring new challenges and helping others achieve their goals.",
      level: 12,
      currentXP: 150,
      requiredXP: 200,
      dailyStreak: 886,
      totalQuests: 47,
      completedQuests: 32,
      badges: ["First Quest", "Week Warrior", "Level 10", "Streak Master"],
      avatarStage: "wise",
      joinDate: "April 2022"
    };
    setProfile(savedProfile);
    setFormData(savedProfile);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const updatedProfile = { ...profile, ...formData };
    setProfile(updatedProfile);
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    setIsEditing(false);
  };

  if (!profile) return <div>Loading...</div>;

  const progressPercent = Math.round((profile.currentXP / profile.requiredXP) * 100);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - progressPercent / 100);

  return (
    <div className="bg-[hsl(210_25%_11%)] border border-[hsl(210_25%_16%)] rounded-xl overflow-hidden shadow-lg animate-fade-in w-full max-w-[800px] mx-auto">
      <div className="p-4 bg-[hsl(210_25%_11%)] border-b border-[hsl(210_25%_16%)]">
        <h1 className="text-xl font-bold text-[hsl(84_81%_44%)] m-0 tracking-wider">PROFILE DASHBOARD</h1>
      </div>
      <div className="p-6 space-y-6">
        {/* Avatar and Info */}
        <div className="text-center space-y-4">
           <div className="w-24 h-24 mx-auto bg-[hsl(210_25%_16%)] rounded-full flex items-center justify-center text-4xl border-4 border-[hsla(84,81%,44%,0.2)] shadow-[0_0_15px_hsla(84,81%,44%,0.4)]">
             🧙
           </div>
           <div className="space-y-3">
             <div className="flex items-center justify-center gap-2">
               <h2 className="text-xl font-bold text-[hsl(210_40%_98%)] m-0">{profile.name}</h2>
               <button className="bg-transparent border-none p-1 cursor-pointer text-[hsl(210_15%_65%)] hover:text-[hsl(210_40%_98%)] transition-colors" onClick={() => setIsEditing(true)}>
                 <Edit2 size={16} />
               </button>
             </div>

             <div className="max-w-sm mx-auto space-y-2 text-sm flex flex-col gap-2">
               <div className="flex items-center justify-center gap-2 text-[hsl(210_15%_65%)]">
                 <User size={16} /> <span>Age: {profile.age}</span>
               </div>
               <div className="flex items-center justify-center gap-2 text-[hsl(210_15%_65%)]">
                 <Mail size={16} /> <span>{profile.email}</span>
               </div>
               <div className="flex items-center justify-center gap-2 text-[hsl(210_15%_65%)]">
                 <MapPin size={16} /> <span>{profile.location}</span>
               </div>
               <div className="flex items-center justify-center gap-2 text-[hsl(210_15%_65%)]">
                 <Activity size={16} /> <span>Joined {profile.joinDate}</span>
               </div>
             </div>

             <div className="max-w-md mx-auto">
               <p className="text-sm bg-[hsla(210,25%,16%,0.2)] rounded-lg p-3 italic text-[hsl(210_40%_98%)]">
                 "{profile.bio}"
               </p>
             </div>
           </div>
        </div>

        {/* Level Progress */}
        <div className="text-center space-y-3 animate-fade-in [animation-delay:100ms]">
          <h3 className="text-lg font-semibold text-[hsl(210_40%_98%)] m-0">LEVEL PROGRESS</h3>
          <div className="relative w-[100px] h-[100px] mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(210 25% 16%)" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(84 81% 44%)" strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={offset}
                      className="transition-[stroke-dashoffset] duration-[1500ms] ease-out" />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-2xl font-bold text-[hsl(210_40%_98%)] leading-none">{profile.level}</div>
              <div className="text-xs text-[hsl(210_15%_65%)] uppercase tracking-wide">Level</div>
            </div>
          </div>
          <p className="text-sm text-[hsl(210_15%_65%)]">
            <span className="text-[hsl(210_40%_98%)] font-medium">{profile.currentXP}</span> / <span className="text-[hsl(210_40%_98%)] font-medium">{profile.requiredXP}</span> XP (<span className="text-[hsl(84_81%_44%)]">{progressPercent}</span>%)
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in [animation-delay:200ms]">
          <div className="text-center p-3 bg-[hsla(210,25%,16%,0.2)] rounded-lg border border-[hsl(210_25%_16%)]">
             <div className="flex items-center justify-center gap-1 mb-1">
               <Zap className="text-[hsl(48_96%_50%)]" size={16} /> <span className="text-sm font-medium text-[hsl(210_15%_65%)]">Streak</span>
             </div>
             <p className="text-xl font-bold text-[hsl(48_96%_50%)] m-0">{profile.dailyStreak}</p>
          </div>
          <div className="text-center p-3 bg-[hsla(210,25%,16%,0.2)] rounded-lg border border-[hsl(210_25%_16%)]">
             <div className="flex items-center justify-center gap-1 mb-1">
               <Target className="text-[hsl(84_81%_44%)]" size={16} /> <span className="text-sm font-medium text-[hsl(210_15%_65%)]">Quests</span>
             </div>
             <p className="text-xl font-bold text-[hsl(84_81%_44%)] m-0">{profile.completedQuests}/{profile.totalQuests}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-3 animate-fade-in [animation-delay:300ms]">
          <div className="flex items-center gap-2">
            <Award className="text-[hsl(48_96%_50%)]" size={20} />
            <h3 className="text-lg font-semibold text-[hsl(210_40%_98%)] m-0">BADGES</h3>
          </div>
          <div className="flex flex-wrap gap-2">
             {profile.badges.length === 0 ? <p className="text-[hsl(210_15%_65%)] text-sm">No badges yet.</p> : profile.badges.map(badge => (
               <div key={badge} className="bg-[hsl(210_25%_16%)] text-[hsl(210_40%_98%)] px-3 py-1 rounded-full text-xs font-medium border border-[hsl(210_25%_24%)] transition-colors hover:border-[hsl(48_96%_50%)]">
                 {badge}
               </div>
             ))}
          </div>
        </div>

        {/* Avatar Stage */}
        <div className="text-center p-3 bg-[hsla(218,91%,60%,0.1)] rounded-lg border border-[hsla(218,91%,60%,0.2)] animate-fade-in [animation-delay:300ms]">
          <p className="text-sm text-[hsl(210_15%_65%)] mb-1 m-0">Avatar Stage</p>
          <p className="font-medium text-[hsl(218_91%_60%)] capitalize text-base m-0">{profile.avatarStage}</p>
          <p className="text-xs text-[hsl(210_15%_65%)] mt-1 m-0">Keep leveling up to evolve your avatar!</p>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[2000] backdrop-blur-sm animate-fade-in">
          <div className="bg-[hsl(210_25%_11%)] p-8 rounded-xl w-full max-w-[500px] border border-[hsl(210_25%_16%)] shadow-2xl relative">
            <h3 className="text-xl font-bold text-[hsl(84_81%_44%)] mt-0 mb-6 text-center border-b border-[hsl(210_25%_16%)] pb-4">Edit Profile</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
               <div className="flex flex-col gap-2 text-left">
                 <label className="text-sm font-medium text-[hsl(210_15%_65%)]">Name</label>
                 <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="p-3 bg-[hsl(210_25%_8%)] border border-[hsl(210_25%_16%)] rounded text-[hsl(210_40%_98%)] text-sm focus:border-[hsl(84_81%_44%)] focus:outline-none" />
               </div>
               <div className="flex flex-col gap-2 text-left">
                 <label className="text-sm font-medium text-[hsl(210_15%_65%)]">Age</label>
                 <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: parseInt(e.target.value)})} required className="p-3 bg-[hsl(210_25%_8%)] border border-[hsl(210_25%_16%)] rounded text-[hsl(210_40%_98%)] text-sm focus:border-[hsl(84_81%_44%)] focus:outline-none" />
               </div>
               <div className="flex flex-col gap-2 text-left">
                 <label className="text-sm font-medium text-[hsl(210_15%_65%)]">Email</label>
                 <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="p-3 bg-[hsl(210_25%_8%)] border border-[hsl(210_25%_16%)] rounded text-[hsl(210_40%_98%)] text-sm focus:border-[hsl(84_81%_44%)] focus:outline-none" />
               </div>
               <div className="flex flex-col gap-2 text-left">
                 <label className="text-sm font-medium text-[hsl(210_15%_65%)]">Location</label>
                 <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="p-3 bg-[hsl(210_25%_8%)] border border-[hsl(210_25%_16%)] rounded text-[hsl(210_40%_98%)] text-sm focus:border-[hsl(84_81%_44%)] focus:outline-none" />
               </div>
               <div className="flex flex-col gap-2 text-left">
                 <label className="text-sm font-medium text-[hsl(210_15%_65%)]">Bio</label>
                 <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} rows="3" className="p-3 bg-[hsl(210_25%_8%)] border border-[hsl(210_25%_16%)] rounded text-[hsl(210_40%_98%)] text-sm focus:border-[hsl(84_81%_44%)] focus:outline-none resize-none"></textarea>
               </div>
               <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[hsl(210_25%_16%)]">
                 <button type="button" className="px-4 py-2 bg-transparent border border-[hsl(210_25%_24%)] text-[hsl(210_40%_98%)] rounded cursor-pointer transition-colors hover:bg-[hsl(210_25%_16%)]" onClick={() => setIsEditing(false)}>Cancel</button>
                 <button type="submit" className="px-4 py-2 bg-[hsl(84_81%_44%)] text-white border-none rounded cursor-pointer transition-colors hover:bg-[hsl(84_81%_34%)]">Save Changes</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
