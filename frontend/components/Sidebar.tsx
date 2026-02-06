"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart2,
  LogOut,
  MessageCircle,
  Shield,
  Target,
  User,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavItemProps extends NavItem {
  active: boolean;
}

interface ProgressState {
  level: number;
  currentXP: number;
  requiredXP: number;
}

const DEFAULT_PROGRESS: ProgressState = {
  level: 1,
  currentXP: 0,
  requiredXP: 100,
};

function SidebarNavItem({ href, label, icon, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={[
        "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200",
        active
          ? "border-blue-200 bg-white text-blue-700 shadow-[0_12px_24px_-22px_rgba(91,141,239,0.9)]"
          : "border-transparent text-slate-600 hover:border-blue-100 hover:bg-white/80 hover:text-slate-900",
      ].join(" ")}
    >
      <span className={active ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"}>
        {icon}
      </span>
      <span className="truncate font-medium">{label}</span>
    </Link>
  );
}

function parseNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_PROGRESS);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchProgress = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (active) setLoadingProgress(false);
        return;
      }

      try {
        const response = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!response.ok) {
          if (active) setLoadingProgress(false);
          return;
        }

        const data = await response.json();
        const profile = data?.profile;

        if (!active || !profile) {
          return;
        }

        const nextProgress: ProgressState = {
          level: Math.max(1, Math.floor(parseNumber(profile.level, DEFAULT_PROGRESS.level))),
          currentXP: Math.max(0, Math.floor(parseNumber(profile.currentXP, DEFAULT_PROGRESS.currentXP))),
          requiredXP: Math.max(100, Math.floor(parseNumber(profile.requiredXP, DEFAULT_PROGRESS.requiredXP))),
        };

        setProgress(nextProgress);
      } catch {
        // Keep current values on fetch failure.
      } finally {
        if (active) {
          setLoadingProgress(false);
        }
      }
    };

    setLoadingProgress(true);
    void fetchProgress();

    return () => {
      active = false;
    };
  }, [pathname]);

  const progressPercent = useMemo(() => {
    if (!progress.requiredXP) return 0;
    return Math.max(0, Math.min(100, Math.round((progress.currentXP / progress.requiredXP) * 100)));
  }, [progress.currentXP, progress.requiredXP]);

  const xpToNextLevel = useMemo(() => {
    return Math.max(0, progress.requiredXP - progress.currentXP);
  }, [progress.currentXP, progress.requiredXP]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    router.replace("/?mode=signin");
  };

  const navItems: NavItem[] = [
    {
      href: "/dashboard/checkin",
      label: "Daily Pulse",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      href: "/dashboard/quest",
      label: "Quest Log",
      icon: <Target className="h-5 w-5" />,
    },
    {
      href: "/dashboard/insight",
      label: "Mind Map",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      href: "/dashboard/chat",
      label: "Companion",
      icon: <MessageCircle className="h-5 w-5" />,
    },
    {
      href: "/dashboard/profile",
      label: "Character",
      icon: <User className="h-5 w-5" />,
    },
  ];

  return (
    <aside
      className={[
        "fixed z-[1000] flex h-screen flex-col border-r border-[#d9ddf4]",
        "bg-gradient-to-b from-[#f1f2fb] via-[#ecefff] to-[#eef1fb]",
        "w-[var(--sidebar-width)]",
      ].join(" ")}
    >
      <div className="flex h-16 items-center border-b border-[#d9ddf4] px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-[0_14px_24px_-18px_rgba(91,141,239,0.95)]">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-800">Digital Twin</p>
            <p className="text-[11px] text-slate-500">Calm growth system</p>
          </div>
        </div>
      </div>

      <p className="px-4 pt-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        Navigator
      </p>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname === item.href}
          />
        ))}
      </nav>

      <div className="mx-3 mb-3 rounded-xl border border-blue-100 bg-white/90 p-3 text-left">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium">Level {progress.level}</span>
          <span className="xp-pill">{loadingProgress ? "..." : `${progress.currentXP} XP`}</span>
        </div>
        <div className="progress-track h-2">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {loadingProgress ? "Loading level..." : `${xpToNextLevel} XP to next level`}
        </p>
      </div>

      <div className="border-t border-[#d9ddf4] px-3 py-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm text-slate-600 transition-all duration-200 hover:border-red-100 hover:bg-red-50 hover:text-red-600"
          type="button"
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
