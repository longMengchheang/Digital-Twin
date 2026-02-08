"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart2, Check, Loader2 } from "lucide-react";

interface ResponseEntry {
  question: string;
  rating: number;
}

interface CheckInResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
}

interface MoodOption {
  value: number;
  emoji: string;
  label: string;
  toneClass: string;
  selectedToneClass: string;
}

const moodOptions: MoodOption[] = [
  {
    value: 1,
    emoji: "😟",
    label: "Low",
    toneClass: "border-rose-200 bg-rose-50 text-rose-700",
    selectedToneClass: "border-rose-300 bg-rose-100 ring-2 ring-rose-200",
  },
  {
    value: 2,
    emoji: "😐",
    label: "Neutral",
    toneClass: "border-slate-200 bg-slate-50 text-slate-700",
    selectedToneClass: "border-slate-300 bg-slate-100 ring-2 ring-slate-200",
  },
  {
    value: 3,
    emoji: "🙂",
    label: "Good",
    toneClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    selectedToneClass: "border-emerald-300 bg-emerald-100 ring-2 ring-emerald-200",
  },
  {
    value: 4,
    emoji: "😄",
    label: "Great",
    toneClass: "border-sky-200 bg-sky-50 text-sky-700",
    selectedToneClass: "border-sky-300 bg-sky-100 ring-2 ring-sky-200",
  },
  {
    value: 5,
    emoji: "🤩",
    label: "Excellent",
    toneClass: "border-violet-200 bg-violet-50 text-violet-700",
    selectedToneClass: "border-violet-300 bg-violet-100 ring-2 ring-violet-200",
  },
];

const fallbackQuestions = [
  "How has your emotional energy been today?",
  "How focused did you feel on key priorities?",
  "How steady was your stress level today?",
  "How connected did you feel to people around you?",
  "How positive do you feel about tomorrow?",
];

export default function DailyPulsePage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [responses, setResponses] = useState<ResponseEntry[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchQuestions();
  }, []);

  const completionPercent = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
  }, [currentQuestionIndex, questions.length]);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const fetchQuestions = async () => {
    const headers = authHeaders();
    if (!headers) {
      router.push("/");
      return;
    }

    try {
      const response = await axios.get("/api/checkin/questions", { headers });
      const incomingQuestions = response.data?.questions;
      setQuestions(Array.isArray(incomingQuestions) && incomingQuestions.length ? incomingQuestions : fallbackQuestions);
      setError("");
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        router.push("/");
        return;
      }

      if (axios.isAxiosError(requestError) && requestError.response?.status === 400) {
        setIsAlreadyCompleted(true);
      } else {
        setQuestions(fallbackQuestions);
        setError("Unable to sync questions. Using fallback flow.");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitCheckIn = async (entries: ResponseEntry[]) => {
    setSubmitting(true);
    setError("");

    const headers = authHeaders();
    if (!headers) {
      router.push("/");
      return;
    }

    try {
      const ratings = entries.map((entry) => entry.rating);
      const response = await axios.post(
        "/api/checkin/submit",
        { ratings },
        { headers },
      );

      const apiResult = response.data?.result as CheckInResult | undefined;
      const computedTotal = ratings.reduce((sum, value) => sum + value, 0);
      const computedMax = ratings.length * 5;
      const computedPercentage = Math.round((computedTotal / computedMax) * 100);

      const finalResult: CheckInResult =
        apiResult && Number.isFinite(apiResult.totalScore)
          ? apiResult
          : {
              totalScore: computedTotal,
              maxScore: computedMax,
              percentage: computedPercentage,
            };

      setResult(finalResult);
      setIsCompleted(true);

      if (finalResult.percentage >= 80) {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.62 },
          colors: ["#5B8DEF", "#A78BFA", "#34D399", "#F59E0B"],
        });
      }
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        router.push("/");
        return;
      }

      const message =
        axios.isAxiosError(requestError) && requestError.response?.data?.msg
          ? String(requestError.response.data.msg)
          : "Failed to submit daily pulse.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRating) return;

    const nextResponses = [
      ...responses,
      {
        question: questions[currentQuestionIndex],
        rating: selectedRating,
      },
    ];
    setResponses(nextResponses);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((current) => current + 1);
      setSelectedRating(0);
      return;
    }

    await submitCheckIn(nextResponses);
  };

  const getMoodByScore = (percentage: number) => {
    if (percentage >= 80) return moodOptions[4];
    if (percentage >= 60) return moodOptions[3];
    if (percentage >= 40) return moodOptions[2];
    if (percentage >= 20) return moodOptions[1];
    return moodOptions[0];
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span>Loading daily pulse...</span>
        </div>
      </div>
    );
  }

  if (isAlreadyCompleted) {
    return (
      <div className="mx-auto w-full max-w-3xl animate-fade-in">
        <section className="card-calm p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Daily Pulse complete</h1>
          <p className="mt-2 text-slate-500">You already checked in today. Come back tomorrow for the next pulse.</p>
        </section>
      </div>
    );
  }

  if (isCompleted && result) {
    const mood = getMoodByScore(result.percentage);

    return (
      <div className="mx-auto w-full max-w-3xl animate-fade-in space-y-5">
        <section className="card-calm p-7 text-center">
          <p className="text-5xl" aria-label="result mood">
            {mood.emoji}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Pulse logged successfully</h1>
          <p className="mt-1 text-slate-600">Your current state is trending toward {mood.label.toLowerCase()}.</p>

          <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Score</p>
              <p className="text-lg font-semibold text-slate-800">
                {result.totalScore}/{result.maxScore}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Completion</p>
              <p className="text-lg font-semibold text-slate-800">{result.percentage}%</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Reward</p>
              <p className="xp-pill">+{result.percentage} XP</p>
            </div>
          </div>

          <div className="mt-4 progress-track">
            <div className="progress-fill" style={{ width: `${result.percentage}%` }} />
          </div>
        </section>

        <section className="card-calm p-5">
          <div className="mb-3 flex items-center gap-2 text-left">
            <BarChart2 className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Response Breakdown</h2>
          </div>
          <div className="space-y-2">
            {responses.map((entry, index) => {
              const entryMood = moodOptions.find((option) => option.value === entry.rating) ?? moodOptions[2];
              return (
                <div
                  key={`${entry.question}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <p className="text-sm text-slate-700">{entry.question}</p>
                  <span className="text-2xl" aria-label={entryMood.label}>
                    {entryMood.emoji}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-in space-y-4">
      {error && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">{error}</div>
      )}

      <header className="text-left">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Daily Pulse</h1>
        <p className="mt-1 text-sm text-slate-600">A quick emotional check to anchor today&apos;s direction.</p>
      </header>

      <section className="card-calm p-6">
        <div className="mb-5 flex items-center justify-between gap-2 text-sm">
          <p className="font-medium text-slate-700">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <span className="text-slate-500">{completionPercent}% of pulse flow</span>
        </div>

        <div className="mb-6 progress-track">
          <div className="progress-fill" style={{ width: `${completionPercent}%` }} />
        </div>

        <p className="mb-6 text-lg font-medium leading-relaxed text-slate-900">{questions[currentQuestionIndex]}</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {moodOptions.map((mood) => {
            const isSelected = selectedRating === mood.value;
            return (
              <button
                key={mood.value}
                type="button"
                onClick={() => setSelectedRating(mood.value)}
                className={[
                  "rounded-xl border px-3 py-3 text-center transition-all duration-200",
                  mood.toneClass,
                  isSelected ? mood.selectedToneClass : "hover:border-slate-300",
                ].join(" ")}
              >
                <span className="block text-3xl">{mood.emoji}</span>
                <span className="mt-1 block text-xs font-semibold">{mood.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={!selectedRating || submitting}
          className="btn-calm-primary mt-6 flex w-full items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving pulse...
            </>
          ) : currentQuestionIndex < questions.length - 1 ? (
            <>
              Next question
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            "Complete daily pulse"
          )}
        </button>
      </section>
    </div>
  );
}
