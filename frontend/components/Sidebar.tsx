"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Target,
  BarChart2,
  MessageCircle,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  collapsed: boolean;
}

function NavItem({ href, icon, label, isActive, collapsed }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
        transition-all duration-200 text-sm
        ${isActive 
          ? "bg-white/10 text-white" 
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
        }
      `}
    >
      <div className="flex-shrink-0">{icon}</div>
      {!collapsed && (
        <span className="font-medium whitespace-nowrap overflow-hidden">
          {label}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar({ collapsed, setCollapsed }) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: "/dashboard/checkin", icon: <Home className="w-5 h-5" />, label: "Check In", color: "text-blue-400" },
    { href: "/dashboard/quest", icon: <Target className="w-5 h-5" />, label: "Quest", color: "text-emerald-400" },
    { href: "/dashboard/insight", icon: <BarChart2 className="w-5 h-5" />, label: "Insight", color: "text-violet-400" },
    { href: "/dashboard/chat", icon: <MessageCircle className="w-5 h-5" />, label: "Chat", color: "text-sky-400" },
    { href: "/dashboard/profile", icon: <User className="w-5 h-5" />, label: "Profile", color: "text-amber-400" },
  ];

  return (
    <div
      className={`
        fixed z-[1001] flex flex-col h-screen
        bg-gradient-to-b from-slate-900 to-slate-950
        border-r border-slate-800/50
        transition-[width] duration-200 ease-out
        ${collapsed ? "w-[var(--sidebar-width-icon)]" : "w-[var(--sidebar-width)]"}
      `}
      id="sidebar"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">DT</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg text-white tracking-tight">
              Digital Twin
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={
              <span className={isActive(item.href) ? item.color : ""}>
                {item.icon}
              </span>
            }
            label={item.label}
            isActive={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-800/50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            w-full flex items-center justify-center gap-2 px-3 py-2
            rounded-lg text-slate-500 text-sm
            hover:bg-white/5 hover:text-slate-300
            transition-all duration-200
          `}
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronLeft size={18} />
              <span className="font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
