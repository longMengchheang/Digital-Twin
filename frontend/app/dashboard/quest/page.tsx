"use client";

import { useState, useEffect } from "react";
import {
  Target,
  Calendar,
  Clock,
  Trophy,
  Check,
  Plus,
  AlertTriangle,
} from "lucide-react";
import confetti from "canvas-confetti";
import axios from "axios";

interface Quest {
  id: string;
  userId: string;
  goal: string;
  duration: string;
  ratings: number[];
  progress: number;
  completed: boolean;
  createdAt: string;
  completedDate?: string;
}

interface Toast {
  id: number;
  title: string;
  message: string;
  type: "success" | "error";
}

export default function QuestPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("Daily");
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get("/api/quest/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuests(
        res.data.map((q: any) => ({
          id: q._id,
          ...q,
          progress: q.ratings[0] || 0,
          createdAt: q.date,
        })),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (title: string, message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleCreateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      showToast("Error", "Please enter a goal.", "error");
      return;
    }
    // ... (rest of logic same) ...
    if (
        !confirm(
          `Are you sure you want to create this ${duration.toLowerCase()} quest?\n\n"${goal}"\n\nRemember: Quests cannot be deleted once created.`,
        )
      ) {
        return;
      }
  
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          "/api/quest/create",
          { goal, duration },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const newQuest: Quest = {
          id: res.data.quest._id,
          ...res.data.quest,
          progress: 0,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        setQuests((prev) => [...prev, newQuest]);
        setGoal("");
        setDuration("Daily");
        showToast(
          "Quest Created!",
          `Your ${duration.toLowerCase()} quest has been added.`,
        );
      } catch (err) {
        showToast("Error", "Failed to create quest.", "error");
      }
  };

  const updateProgress = async (id: string, progress: number) => {
    // ... 
    try {
        const token = localStorage.getItem("token");
        const newProgress = Math.min(Math.max(progress, 0), 100);
        const res = await axios.put(
          `/api/quest/progress/${id}`,
          { progress: newProgress },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
  
        const updatedData = res.data.quest;
        updateQuestState(id, updatedData.ratings[0], updatedData.completed);
      } catch (err) {
        showToast("Error", "Failed to update progress.", "error");
      }
  };

  const toggleCompletion = async (id: string) => {
    try {
        const token = localStorage.getItem("token");
        const res = await axios.put(
          `/api/quest/complete/${id}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const updatedData = res.data.quest;
        updateQuestState(id, updatedData.ratings[0], updatedData.completed);
      } catch (err) {
        showToast("Error", "Failed to toggle completion.", "error");
      }
  };

  const updateQuestState = (id: string, progress: number, completed: boolean) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          if (completed && !q.completed) {
            showToast("Quest Completed!", "Congratulations!");
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
          return { ...q, progress, completed };
        }
        return q;
      }),
    );
  };

  const activeQuests = quests.filter((q) => !q.completed);
  const completedQuests = quests.filter((q) => q.completed);

  const getDurationIcon = (d: string) => {
    switch (d.toLowerCase()) {
      case "daily":
        return <Calendar className="w-5 h-5" />;
      case "weekly":
        return <Clock className="w-5 h-5" />;
// ...
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getDurationColor = (d: string) => {
    switch (d.toLowerCase()) {
      case "daily":
        return "text-amber-600";
//...
      default:
        return "text-slate-600";
    }
  };

  const getDurationBg = (d: string) => {
    switch (d.toLowerCase()) {
      case "daily":
        return "bg-amber-100";
//...
      default:
        return "bg-slate-100";
    }
  };

  const getProgressColor = (d: string) => {
    switch (d.toLowerCase()) {
      case "daily":
        return "bg-amber-500";
//...
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto animate-fade-in pb-12">
      <div className="flex flex-col gap-6">
        <div className="text-left mb-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Quest Tracker
          </h2>
          <p className="text-slate-500 text-sm">
            Track and complete your personal development goals
          </p>
        </div>

        {/* Active Quests */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex justify-between items-center p-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 m-0">
              Your Active Quests
            </h3>
            <span className="text-xs bg-rose-100 text-rose-700 py-1 px-2 rounded font-bold">
              {activeQuests.length} Active
            </span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {activeQuests.length === 0 ? (
              <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                No active quests. Create a new quest below!
              </div>
            ) : (
              activeQuests.map((quest) => (
                <div
                  key={quest.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 transition-all duration-200 hover:shadow-md hover:border-blue-300"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded ${getDurationBg(quest.duration)} ${getDurationColor(quest.duration)}`}
                      >
                        {getDurationIcon(quest.duration)}
                      </div>
                      <span
                        className={`text-xs font-bold uppercase tracking-wide ${getDurationColor(quest.duration)}`}
                      >
                        {quest.duration}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(quest.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-base font-medium text-slate-800 mb-4 leading-normal">
                    {quest.goal}
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{quest.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-[width] duration-300 ${getProgressColor(quest.duration)}`}
                        style={{ width: `${quest.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-xs font-medium cursor-pointer transition-colors hover:bg-slate-100"
                        onClick={() =>
                          updateProgress(quest.id, quest.progress + 25)
                        }
                      >
                        +25%
                      </button>
                      <button
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-xs font-medium cursor-pointer transition-colors hover:bg-slate-100"
                        onClick={() =>
                          updateProgress(quest.id, quest.progress + 50)
                        }
                      >
                        +50%
                      </button>
                    </div>
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white border-none rounded text-xs font-medium cursor-pointer transition-colors hover:bg-emerald-700"
                      onClick={() => toggleCompletion(quest.id)}
                    >
                      <Check size={16} />
                      Complete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Form */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mt-0 mb-4 border-b border-slate-100 pb-2">
            Create New Quest
          </h3>
          <form onSubmit={handleCreateQuest} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 text-left">
              <label
                htmlFor="quest-duration"
                className="text-sm font-medium text-slate-600"
              >
                Quest Duration
              </label>
              <select
                id="quest-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Daily">Daily Quest</option>
                <option value="Weekly">Weekly Quest</option>
                <option value="Monthly">Monthly Quest</option>
                <option value="Yearly">Yearly Quest</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 text-left">
              <label
                htmlFor="quest-goal"
                className="text-sm font-medium text-slate-600"
              >
                Quest Goal
              </label>
              <input
                id="quest-goal"
                type="text"
                placeholder="What do you want to achieve?"
                maxLength={100}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
              />
              <p className="text-right text-xs text-slate-400">
                <span>{goal.length}</span>/100 characters
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-100 rounded text-rose-700 text-xs mb-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <div>
                <strong>Important:</strong> Quests cannot be deleted once
                created. Please make sure you want to track this goal before
                creating it.
              </div>
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 p-3 bg-slate-900 text-white border-none rounded font-bold cursor-pointer transition-colors hover:bg-slate-800 shadow-sm"
            >
              <Plus size={16} />
              Create Quest
            </button>
          </form>
        </div>

        {/* Achievements */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex justify-between items-center p-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 m-0">
              Quest Achievements
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-700 py-1 px-2 rounded font-bold">
              {completedQuests.length} Completed
            </span>
          </div>
          <div className="p-4">
            {completedQuests.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic">
                No achievements yet. Complete some quests to see them here!
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                {completedQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className="bg-slate-50 border border-emerald-200 rounded p-3 text-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 rounded-bl-full flex items-start justify-end pr-1 pt-1">
                      <Check size={12} className="text-white" />
                    </div>
                    <div className="font-bold text-slate-800 text-sm mb-1">
                      {quest.goal}
                    </div>
                    <div className="text-xs text-emerald-600">
                      Completed:{" "}
                      {quest.completedDate
                        ? new Date(quest.completedDate).toLocaleDateString()
                        : "Recently"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Toasts */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[2000] pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`min-w-[300px] p-4 rounded shadow-lg animate-fade-in pointer-events-auto border-l-4 bg-white text-slate-800 ${toast.type === "success" ? "border-l-emerald-500" : "border-l-rose-500"}`}
            >
              <div
                className={`font-bold mb-1 ${toast.type === "success" ? "text-emerald-700" : "text-rose-700"}`}
              >
                {toast.title}
              </div>
              <div className="text-sm text-slate-600">{toast.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
