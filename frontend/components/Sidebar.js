'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Target,
  BarChart2,
  MessageCircle,
  History,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ collapsed, setCollapsed }) {
  const pathname = usePathname();

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const isActive = (path) => pathname === path;

  return (
    <div
      className={`fixed z-[1001] flex flex-col h-screen bg-[hsl(210_25%_8%)] border-r border-[hsl(210_25%_16%)] transition-[width] duration-200 ease-linear ${collapsed ? 'w-[var(--sidebar-width-icon)]' : 'w-[var(--sidebar-width)]'}`}
      id="sidebar"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 h-[60px] border-b border-[hsl(210_25%_16%)]">
        <p className={`font-bold text-2xl text-[hsl(84_81%_44%)] whitespace-nowrap overflow-hidden ${collapsed ? 'hidden' : 'block'}`}>Digital Twin</p>
      </div>

      {/* Main Chat Items */}
      <div className="p-2 border-b border-[hsl(210_25%_16%)]">
        <Link
          href="/dashboard/checkin"
          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors duration-200 mb-1 text-sm text-[hsl(210_40%_98%)] hover:bg-[rgba(79,84,92,0.4)] ${isActive('/dashboard/checkin') ? 'bg-[rgba(79,84,92,0.6)]' : ''}`}
        >
          <Home className="w-5 h-5 flex-shrink-0 text-[hsl(48_96%_50%)]" />
          <span className={`whitespace-nowrap overflow-hidden ${collapsed ? 'hidden' : 'block'}`}>Daily Check In</span>
        </Link>
        <Link
          href="/dashboard/quest"
          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors duration-200 mb-1 text-sm text-[hsl(210_40%_98%)] hover:bg-[rgba(79,84,92,0.4)] ${isActive('/dashboard/quest') ? 'bg-[rgba(79,84,92,0.6)]' : ''}`}
        >
          <Target className="w-5 h-5 flex-shrink-0 text-[hsl(350,100%,70%)]" />
          <span className={`whitespace-nowrap overflow-hidden ${collapsed ? 'hidden' : 'block'}`}>Quest</span>
        </Link>
        <Link
          href="/dashboard/insight"
          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors duration-200 mb-1 text-sm text-[hsl(210_40%_98%)] hover:bg-[rgba(79,84,92,0.4)] ${isActive('/dashboard/insight') ? 'bg-[rgba(79,84,92,0.6)]' : ''}`}
        >
          <BarChart2 className="w-5 h-5 flex-shrink-0 text-[hsl(262_83%_58%)]" />
          <span className={`whitespace-nowrap overflow-hidden ${collapsed ? 'hidden' : 'block'}`}>Insight</span>
        </Link>
        <Link
          href="/dashboard/chat"
          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors duration-200 mb-1 text-sm text-[hsl(210_40%_98%)] hover:bg-[rgba(79,84,92,0.4)] ${isActive('/dashboard/chat') ? 'bg-[rgba(79,84,92,0.6)]' : ''}`}
        >
          <MessageCircle className="w-5 h-5 flex-shrink-0 text-[hsl(84_81%_44%)]" />
          <span className={`whitespace-nowrap overflow-hidden ${collapsed ? 'hidden' : 'block'}`}>Chat</span>
        </Link>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 mask-linear">
        <div className={`text-xs text-[hsl(210_15%_65%)] py-2 px-3 uppercase tracking-wider whitespace-nowrap ${collapsed ? 'hidden' : 'block'}`}>Recent Chats</div>
        <div className="mt-2">
          <Link
            href="/dashboard/history"
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors duration-200 mb-1 text-sm text-[hsl(210_40%_98%)] hover:bg-[rgba(79,84,92,0.4)] ${isActive('/dashboard/history') ? 'bg-[rgba(79,84,92,0.6)]' : ''}`}
          >
            <History className="w-5 h-5 flex-shrink-0 text-[hsl(210_40%_98%)]" />
            <span className={`whitespace-nowrap overflow-hidden ${collapsed ? 'hidden' : 'block'}`}>History Example</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-[hsl(210_25%_16%)] bg-[hsl(210_25%_8%)] absolute bottom-0 left-0 w-full flex justify-between items-center">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors duration-200 text-sm text-[hsl(210_40%_98%)] hover:bg-[rgba(79,84,92,0.4)] overflow-hidden w-full"
        >
          <User className="w-5 h-5 flex-shrink-0 text-[hsl(218_91%_60%)]" />
          <div className={`truncate ${collapsed ? 'hidden' : 'block'}`}>Profile</div>
        </Link>
        <button
          className="bg-none border-none cursor-pointer transition-all duration-200 p-1 rounded text-[hsl(210_15%_65%)] hover:bg-[rgba(79,84,92,0.4)]"
          onClick={toggleCollapse}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  );
}
