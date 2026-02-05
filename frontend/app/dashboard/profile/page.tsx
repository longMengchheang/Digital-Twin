"use client";
import { useState, useEffect } from "react";
import {
  Edit2,
  User,
  Mail,
  MapPin,
  Award,
  Activity,
  Target,
  Zap,
} from "lucide-react";

interface UserProfile {
  name: string;
  age: number;
  email: string;
  location: string;
  bio: string;
  level: number;
  currentXP: number;
  requiredXP: number;
  dailyStreak: number;
  totalQuests: number;
  completedQuests: number;
  badges: string[];
  avatarStage: string;
  joinDate: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    const savedStr = localStorage.getItem("userProfile");
    const savedProfile = (savedStr ? JSON.parse(savedStr) : null) || {
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
      joinDate: "April 2022",
    };
    setProfile(savedProfile);
    setFormData(savedProfile);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const updatedProfile = { ...profile, ...formData } as UserProfile;
    setProfile(updatedProfile);
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
    setIsEditing(false);
  };

  if (!profile) return <div className="text-slate-500">Loading...</div>;

  const progressPercent = Math.round(
    (profile.currentXP / profile.requiredXP) * 100,
  );
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - progressPercent / 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-fade-in w-full max-w-[800px] mx-auto">
      <div className="p-4 bg-white border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-800 m-0 tracking-wider">
          PROFILE DASHBOARD
        </h1>
      </div>
      <div className="p-6 space-y-6">
        {/* Avatar and Info */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-slate-50 rounded-full flex items-center justify-center text-4xl border-4 border-slate-100 shadow-sm">
            🧙
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 m-0">
                {profile.name}
              </h2>
              <button
                className="bg-transparent border-none p-1 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 size={16} />
              </button>
            </div>

            <div className="max-w-sm mx-auto space-y-2 text-sm flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <User size={16} /> <span>Age: {profile.age}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <Mail size={16} /> <span>{profile.email}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <MapPin size={16} /> <span>{profile.location}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <Activity size={16} /> <span>Joined {profile.joinDate}</span>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <p className="text-sm bg-slate-50 rounded-lg p-3 italic text-slate-600 border border-slate-100">
                "{profile.bio}"
              </p>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="text-center space-y-3 animate-fade-in [animation-delay:100ms]">
          <h3 className="text-lg font-semibold text-slate-700 m-0">
            LEVEL PROGRESS
          </h3>
          <div className="relative w-[100px] h-[100px] mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={offset}
                className="transition-[stroke-dashoffset] duration-[1500ms] ease-out"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-2xl font-bold text-slate-800 leading-none">
                {profile.level}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">
                Level
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            <span className="text-slate-800 font-medium">
              {profile.currentXP}
            </span>{" "}
            /{" "}
            <span className="text-slate-800 font-medium">
              {profile.requiredXP}
            </span>{" "}
            XP (<span className="text-blue-600">{progressPercent}</span>%)
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in [animation-delay:200ms]">
          <div className="text-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="text-amber-500" size={16} />{" "}
              <span className="text-sm font-medium text-slate-500">Streak</span>
            </div>
            <p className="text-xl font-bold text-amber-500 m-0">
              {profile.dailyStreak}
            </p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="text-emerald-500" size={16} />{" "}
              <span className="text-sm font-medium text-slate-500">Quests</span>
            </div>
            <p className="text-xl font-bold text-emerald-500 m-0">
              {profile.completedQuests}/{profile.totalQuests}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-3 animate-fade-in [animation-delay:300ms]">
          <div className="flex items-center gap-2">
            <Award className="text-blue-500" size={20} />
            <h3 className="text-lg font-semibold text-slate-700 m-0">BADGES</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.badges.length === 0 ? (
              <p className="text-slate-400 text-sm">No badges yet.</p>
            ) : (
              profile.badges.map((badge) => (
                <div
                  key={badge}
                  className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium border border-slate-200 transition-colors hover:border-blue-400 hover:bg-white hover:text-blue-600"
                >
                  {badge}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Avatar Stage */}
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in [animation-delay:300ms]">
          <p className="text-sm text-slate-500 mb-1 m-0">Avatar Stage</p>
          <p className="font-medium text-blue-600 capitalize text-base m-0">
            {profile.avatarStage}
          </p>
          <p className="text-xs text-slate-400 mt-1 m-0">
            Keep leveling up to evolve your avatar!
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/50 flex justify-center items-center z-[2000] backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-xl w-full max-w-[500px] border border-slate-200 shadow-2xl relative">
            <h3 className="text-xl font-bold text-slate-800 mt-0 mb-6 text-center border-b border-slate-100 pb-4">
              Edit Profile
            </h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 text-left">
                <label className="text-sm font-medium text-slate-600">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-800 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-2 text-left">
                <label className="text-sm font-medium text-slate-600">
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: parseInt(e.target.value) })
                  }
                  required
                  className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-800 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-2 text-left">
                <label className="text-sm font-medium text-slate-600">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-800 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-2 text-left">
                <label className="text-sm font-medium text-slate-600">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-800 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-2 text-left">
                <label className="text-sm font-medium text-slate-600">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={3}
                  className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-800 text-sm focus:border-blue-500 focus:outline-none resize-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="px-4 py-2 bg-transparent border border-slate-300 text-slate-600 rounded cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white border-none rounded cursor-pointer transition-colors hover:bg-slate-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
