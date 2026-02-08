"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, BarChart2, MessageCircle, Target, User } from "lucide-react";
import { validatePassword } from "@/lib/validation";

type FlashType = "success" | "error";

type AuthMode = "signin" | "signup";

interface FlashState {
  type: FlashType;
  text: string;
}

function resolveMode(value: string | null): AuthMode {
  return value === "signup" ? "signup" : "signin";
}

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<FlashState | null>(null);

  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLogin = mode === "signin";

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(search);
    setMode(resolveMode(params.get("mode")));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let active = true;

    void axios
      .get("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        if (active) {
          router.replace("/dashboard/checkin");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
      });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const pageTitle = useMemo(() => {
    return isLogin ? "Sign in to your journey" : "Create your digital twin";
  }, [isLogin]);

  const setAuthMode = (nextMode: AuthMode) => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    setMode(nextMode);
    setFlash(null);
    setLoading(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setFlash({ type: "error", text: "Email and password are required." });
      return;
    }

    if (!isLogin) {
      const passwordValidation = validatePassword(password.trim());
      if (!passwordValidation.isValid) {
        setFlash({ type: "error", text: passwordValidation.message });
        return;
      }
    }

    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    setLoading(true);
    setFlash(null);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await axios.post(endpoint, {
        email: email.trim(),
        password: password.trim(),
      });

      const token = String(response.data?.token || "").trim();
      if (!token) {
        setFlash({ type: "error", text: "Authentication failed. Please try again." });
        return;
      }

      localStorage.setItem("token", token);

      if (isLogin) {
        router.replace("/dashboard/checkin");
        return;
      }

      setFlash({ type: "success", text: "Account created. Loading your dashboard..." });
      redirectTimerRef.current = setTimeout(() => {
        router.replace("/dashboard/checkin");
      }, 700);
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.msg
          ? String(error.response.data.msg)
          : isLogin
            ? "Sign in failed. Check your credentials."
            : "Registration failed. Try again.";
      setFlash({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_28px_60px_-42px_rgba(15,23,42,0.55)] md:grid-cols-[1.1fr_1fr]">
        <aside className="relative border-b border-slate-200 bg-gradient-to-br from-[#e9eeff] via-[#f0ecff] to-[#ffffff] p-7 md:border-b-0 md:border-r md:border-slate-200 md:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Digital Twin</p>
              <p className="text-xs text-slate-500">Calm RPG wellness dashboard</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Build consistency with a character-first routine.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
            Keep your momentum through focused daily rituals and long-term quests with a clean, calm interface.
          </p>

          <div className="mt-7 space-y-3">
            {[
              { label: "Daily Pulse", icon: <Activity className="h-4 w-4" /> },
              { label: "Quest Log", icon: <Target className="h-4 w-4" /> },
              { label: "Mind Map", icon: <BarChart2 className="h-4 w-4" /> },
              { label: "Companion", icon: <MessageCircle className="h-4 w-4" /> },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-lg border border-white/70 bg-white/60 px-3 py-2 text-sm text-slate-700"
              >
                <span className="text-blue-600">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="p-7 md:p-10">
          <div className="mb-6 flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm">
            <button
              type="button"
              className={[
                "w-1/2 rounded-lg px-3 py-2 font-medium transition-colors",
                isLogin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
              ].join(" ")}
              onClick={() => setAuthMode("signin")}
            >
              Sign In
            </button>
            <button
              type="button"
              className={[
                "w-1/2 rounded-lg px-3 py-2 font-medium transition-colors",
                !isLogin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
              ].join(" ")}
              onClick={() => setAuthMode("signup")}
            >
              Sign Up
            </button>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{pageTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isLogin ? "Continue where you left off." : "Start your character and enter the dashboard."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="input-calm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 chars, uppercase, lowercase, number, symbol"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="input-calm"
                required
              />
            </div>
            
            {isLogin && (
              <div className="flex justify-end">
                <a href="/auth/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            )}


            {flash && (
              <p
                className={[
                  "rounded-lg border px-3 py-2 text-sm",
                  flash.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700",
                ].join(" ")}
              >
                {flash.text}
              </p>
            )}

            <button className="btn-calm-primary flex w-full items-center justify-center gap-2" disabled={loading} type="submit">
              {loading ? "Processing..." : isLogin ? "Enter Dashboard" : "Create Character"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-500">
            {isLogin ? "Need an account?" : "Already have one?"}{" "}
            <button
              type="button"
              className="font-medium text-blue-700 hover:text-blue-800"
              onClick={() => setAuthMode(isLogin ? "signup" : "signin")}
            >
              {isLogin ? "Create one" : "Sign in"}
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}
