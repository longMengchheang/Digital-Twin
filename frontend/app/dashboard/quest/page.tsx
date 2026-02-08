"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Loader2,
  Plus,
  Target,
  Trophy,
} from "lucide-react";

interface Quest {
  id: string;
  goal: string;
  duration: string;
  progress: number;
  completed: boolean;
  createdAt: string;
  completedDate?: string;
}

interface ToastMessage {
  id: number;
  title: string;
  message: string;
  tone: "success" | "error";
}

const durationMeta: Record<
  string,
  {
    label: string;
    reward: number;
    badgeClass: string;
    progressClass: string;
    icon: React.ReactNode;
  }
> = {
  daily: {
    label: "Daily",
    reward: 20,
    badgeClass: "border-violet-200 bg-violet-50 text-violet-700",
    progressClass: "from-violet-500 to-indigo-500",
    icon: <Calendar className="h-4 w-4" />,
  },
  weekly: {
    label: "Weekly",
    reward: 50,
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    progressClass: "from-emerald-500 to-teal-500",
    icon: <Clock className="h-4 w-4" />,
  },
  monthly: {
    label: "Monthly",
    reward: 150,
    badgeClass: "border-orange-200 bg-orange-50 text-orange-700",
    progressClass: "from-orange-500 to-amber-500",
    icon: <Target className="h-4 w-4" />,
  },
  yearly: {
    label: "Yearly",
    reward: 500,
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    progressClass: "from-blue-500 to-indigo-500",
    icon: <Target className="h-4 w-4" />,
  },
};

export default function QuestLogPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("daily");
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    void fetchQuests();
  }, []);

  const activeQuests = useMemo(() => quests.filter((quest) => !quest.completed), [quests]);
  const completedQuests = useMemo(() => quests.filter((quest) => quest.completed), [quests]);

  const addToast = (title: string, message: string, tone: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, title, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  };

  const getDurationMeta = (durationKey: string) => {
    return durationMeta[durationKey.toLowerCase()] ?? durationMeta.daily;
  };

  const fetchQuests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get("/api/quest/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mapped = (response.data ?? []).map(
        (quest: {
          _id: string;
          goal: string;
          duration: string;
          progress?: number;
          completed?: boolean;
          date?: string;
          createdAt?: string;
          completedDate?: string;
        }) => ({
          id: quest._id,
          goal: quest.goal,
          duration: quest.duration,
          progress: Number(quest.progress ?? 0),
          completed: Boolean(quest.completed),
          createdAt: quest.date ?? quest.createdAt ?? new Date().toISOString(),
          completedDate: quest.completedDate,
        }),
      );

      setQuests(mapped);
    } catch {
      addToast("Quest sync failed", "Unable to load quest log.", "error");
    }
  };

  const handleCreateQuest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!goal.trim()) {
      addToast("Missing goal", "Enter a goal before creating a quest.", "error");
      return;
    }

    setBusy(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/quest/create",
        { goal: goal.trim(), duration },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const quest = response.data?.quest;
      const createdQuest: Quest = {
        id: quest._id,
        goal: quest.goal,
        duration: quest.duration,
        progress: Number(quest.progress ?? 0),
        completed: Boolean(quest.completed),
        createdAt: quest.date ?? new Date().toISOString(),
      };

      setQuests((current) => [createdQuest, ...current]);
      setGoal("");
      setDuration("daily");
      addToast("Quest created", "Your quest is now active.");
    } catch {
      addToast("Create failed", "Could not create quest.", "error");
    } finally {
      setBusy(false);
    }
  };

  const updateQuestState = (id: string, progress: number, completed: boolean) => {
    setQuests((current) =>
      current.map((quest) => {
        if (quest.id !== id) return quest;

        if (completed && !quest.completed) {
          const reward = getDurationMeta(quest.duration).reward;
          addToast("Quest completed", `Achievement unlocked. +${reward} XP.`);
          confetti({
            particleCount: 72,
            spread: 60,
            origin: { y: 0.63 },
            colors: ["#5B8DEF", "#A78BFA", "#34D399", "#F59E0B"],
          });
        }

        return {
          ...quest,
          progress,
          completed,
          completedDate: completed ? new Date().toISOString() : quest.completedDate,
        };
      }),
    );
  };

  const updateProgress = async (id: string, nextProgress: number) => {
    try {
      const token = localStorage.getItem("token");
      const normalizedProgress = Math.max(0, Math.min(100, nextProgress));

      const response = await axios.put(
        `/api/quest/progress/${id}`,
        { progress: normalizedProgress },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const updatedQuest = response.data?.quest;
      updateQuestState(id, Number(updatedQuest?.progress ?? normalizedProgress), Boolean(updatedQuest?.completed));
    } catch {
      addToast("Update failed", "Could not update quest progress.", "error");
    }
  };

  const toggleCompletion = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `/api/quest/complete/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const updatedQuest = response.data?.quest;
      updateQuestState(id, Number(updatedQuest?.progress ?? 0), Boolean(updatedQuest?.completed));
    } catch {
      addToast("Completion failed", "Could not update quest completion.", "error");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-in space-y-6 pb-6">
      <header className="text-left">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Quest Log</h1>
        <p className="mt-1 text-sm text-slate-600">Track long-term growth with measurable progress and clear rewards.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card-calm p-4 text-left">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Active</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{activeQuests.length}</p>
        </div>
        <div className="card-calm p-4 text-left">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Completed</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{completedQuests.length}</p>
        </div>
        <div className="card-calm p-4 text-left">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Quest XP Pool</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {completedQuests.reduce((total, quest) => total + getDurationMeta(quest.duration).reward, 0)}
          </p>
        </div>
      </section>

      <section className="card-calm overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 text-left">
          <h2 className="text-lg font-semibold text-slate-900">Active quests</h2>
        </div>

        <div className="space-y-4 p-5">
          {activeQuests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-slate-500">
              No active quests yet.
            </div>
          ) : (
            activeQuests.map((quest) => {
              const meta = getDurationMeta(quest.duration);
              return (
                <article key={quest.id} className="card-lift rounded-xl border border-slate-200 bg-white p-4 text-left">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                      <span className="xp-pill">+{meta.reward} XP</span>
                    </div>
                    <span className="text-xs text-slate-500">{new Date(quest.createdAt).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-base font-medium text-slate-900">{quest.goal}</h3>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                      <span>Progress</span>
                      <span className="font-semibold text-slate-800">{quest.progress}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${meta.progressClass} transition-[width] duration-300`}
                        style={{ width: `${quest.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateProgress(quest.id, quest.progress + 10)}
                        className="btn-calm-secondary px-3 py-1.5 text-xs"
                      >
                        +10%
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProgress(quest.id, quest.progress + 25)}
                        className="btn-calm-secondary px-3 py-1.5 text-xs"
                      >
                        +25%
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCompletion(quest.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Complete
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="card-calm p-5 text-left">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
          <Plus className="h-4 w-4 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Create a quest</h2>
        </div>

        <form onSubmit={handleCreateQuest} className="space-y-4">
          <div>
            <label htmlFor="duration" className="mb-1.5 block text-sm font-medium text-slate-700">
              Duration
            </label>
            <select
              id="duration"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="input-calm"
            >
              {Object.entries(durationMeta).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label} (+{meta.reward} XP)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="goal" className="mb-1.5 block text-sm font-medium text-slate-700">
              Goal
            </label>
            <input
              id="goal"
              type="text"
              value={goal}
              maxLength={100}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Describe the outcome you want"
              className="input-calm"
            />
            <p className="mt-1 text-right text-xs text-slate-500">{goal.length}/100</p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>Quests are kept as part of your progression history, so choose goals intentionally.</p>
          </div>

          <button type="submit" disabled={busy} className="btn-calm-primary inline-flex items-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {busy ? "Creating..." : "Create quest"}
          </button>
        </form>
      </section>

      <section className="card-calm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Completed quests</h2>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <Trophy className="h-3.5 w-3.5" />
            {completedQuests.length}
          </span>
        </div>

        <div className="p-5">
          {completedQuests.length === 0 ? (
            <p className="text-sm text-slate-500">Complete active quests to fill your achievement panel.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {completedQuests.map((quest) => {
                const meta = getDurationMeta(quest.duration);
                return (
                  <article key={quest.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left">
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                      <Check className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-800">{quest.goal}</h3>
                    <p className="mt-1 text-xs text-emerald-700">
                      Completed {new Date(quest.completedDate ?? quest.createdAt).toLocaleDateString()}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="fixed bottom-5 right-5 z-[2100] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              "animate-slide-up min-w-[260px] rounded-xl border bg-white px-4 py-3 text-left shadow-lg",
              toast.tone === "success" ? "border-emerald-200" : "border-red-200",
            ].join(" ")}
          >
            <p className={toast.tone === "success" ? "font-semibold text-emerald-700" : "font-semibold text-red-600"}>
              {toast.title}
            </p>
            <p className="text-sm text-slate-600">{toast.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

