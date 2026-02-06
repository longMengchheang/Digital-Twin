"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Activity,
  Award,
  Calendar,
  Edit2,
  Flame,
  Loader2,
  Mail,
  MapPin,
  Target,
  Trophy,
  User,
  X,
} from "lucide-react";

interface MoodState {
  emoji: string;
  label: string;
}

interface UserProfile {
  id: string;
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
  currentMood: MoodState;
}

const badgeIcons: Record<string, string> = {
  "First Quest": "🏁",
  "Week Warrior": "⚔️",
  "Level 10": "🎯",
  "Streak Master": "🔥",
  Mindful: "🧠",
  "Early Bird": "🌅",
};

export default function CharacterPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchProfile();
  }, []);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const fetchProfile = async () => {
    const headers = authHeaders();
    if (!headers) {
      router.push("/");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get("/api/profile", { headers });
      const incoming = response.data?.profile as UserProfile | undefined;

      if (!incoming) {
        setError("Profile data is unavailable.");
        return;
      }

      setProfile(incoming);
      setFormData(incoming);
      setError("");
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        router.push("/");
        return;
      }

      setError("Failed to load character profile.");
    } finally {
      setLoading(false);
    }
  };

  const xpPercent = useMemo(() => {
    if (!profile?.requiredXP) return 0;
    return Math.round((profile.currentXP / profile.requiredXP) * 100);
  }, [profile]);

  const initials = useMemo(() => {
    if (!profile?.name) return "DT";
    return profile.name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [profile]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    const headers = authHeaders();
    if (!headers) {
      router.push("/");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await axios.put(
        "/api/profile",
        {
          name: formData.name,
          age: formData.age,
          email: formData.email,
          location: formData.location,
          bio: formData.bio,
          avatarStage: formData.avatarStage,
        },
        { headers },
      );

      const updatedProfile = response.data?.profile as UserProfile | undefined;
      if (updatedProfile) {
        setProfile(updatedProfile);
        setFormData(updatedProfile);
      }

      setIsEditing(false);
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        router.push("/");
        return;
      }

      const message =
        axios.isAxiosError(requestError) && requestError.response?.data?.msg
          ? String(requestError.response.data.msg)
          : "Failed to save profile.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading character...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || "Profile is unavailable."}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-in space-y-6">
      {error && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">{error}</div>
      )}

      <section className="card-calm overflow-hidden">
        <div className="relative bg-gradient-to-br from-[#e9eeff] via-[#efeafd] to-white px-6 py-7 text-left md:px-8">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="absolute right-4 top-4 rounded-lg border border-slate-300 bg-white/90 p-2 text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-700"
          >
            <Edit2 className="h-4 w-4" />
          </button>

          <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-center">
            <div className="text-center md:text-left">
              <div className="mx-auto mb-3 flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-white bg-gradient-to-br from-blue-500 to-violet-500 text-3xl font-bold text-white shadow-[0_20px_30px_-24px_rgba(91,141,239,0.95)] md:mx-0">
                {initials}
              </div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Character Class</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{profile.avatarStage}</p>
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Character</h1>
              <p className="mt-1 text-sm text-slate-600">Manage identity, progression, and achievements in one screen.</p>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-700">Level {profile.level}</span>
                  <span className="xp-pill">
                    {profile.currentXP} / {profile.requiredXP} XP
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${xpPercent}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-600">{profile.requiredXP - profile.currentXP} XP until level {profile.level + 1}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="card-calm p-4 text-left">
          <div className="inline-flex rounded-lg bg-orange-50 p-2 text-orange-600">
            <Flame className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{profile.dailyStreak}</p>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Day streak</p>
        </article>

        <article className="card-calm p-4 text-left">
          <div className="inline-flex rounded-lg bg-emerald-50 p-2 text-emerald-600">
            <Target className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {profile.completedQuests}/{profile.totalQuests}
          </p>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Quests completed</p>
        </article>

        <article className="card-calm p-4 text-left">
          <div className="inline-flex rounded-lg bg-blue-50 p-2 text-blue-600">
            <Activity className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl">{profile.currentMood?.emoji || "🙂"}</p>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Mood: {profile.currentMood?.label || "Stable"}</p>
        </article>

        <article className="card-calm p-4 text-left">
          <div className="inline-flex rounded-lg bg-violet-50 p-2 text-violet-600">
            <Trophy className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{profile.badges.length}</p>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Achievements</p>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <article className="card-calm p-5 text-left">
          <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
            <User className="h-4 w-4 text-blue-600" />
            Character profile
          </h2>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-900">{profile.name}</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-500" />
              {profile.email}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-500" />
              {profile.location}
            </p>
            <p className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              Joined {profile.joinDate}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Bio</p>
            <p className="mt-1 text-sm text-slate-700">{profile.bio}</p>
          </div>
        </article>

        <article className="card-calm p-5 text-left">
          <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Award className="h-4 w-4 text-amber-500" />
            Achievement board
          </h2>

          {profile.badges.length ? (
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((badge) => (
                <div
                  key={badge}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800"
                >
                  <span>{badgeIcons[badge] ?? "🏆"}</span>
                  <span className="font-medium">{badge}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No achievements yet. Complete quests to unlock your first badge.</p>
          )}
        </article>
      </section>

      {isEditing && (
        <div className="fixed inset-0 z-[2200] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm">
          <div className="card-calm w-full max-w-lg p-6 text-left animate-fade-in">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Edit character</h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-slate-300 p-1.5 text-slate-600 transition-colors hover:border-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleSave}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  value={formData.name ?? ""}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="input-calm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="age">
                    Age
                  </label>
                  <input
                    id="age"
                    type="number"
                    min={1}
                    value={formData.age ?? 0}
                    onChange={(event) => setFormData({ ...formData, age: Number(event.target.value) })}
                    className="input-calm"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    value={formData.location ?? ""}
                    onChange={(event) => setFormData({ ...formData, location: event.target.value })}
                    className="input-calm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email ?? ""}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  className="input-calm"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="bio">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  value={formData.bio ?? ""}
                  onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
                  className="input-calm resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                <button type="button" className="btn-calm-secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-calm-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
