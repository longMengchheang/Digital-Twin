'use client';

import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';
import { Settings } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className={`flex-1 min-h-screen flex justify-center items-center relative transition-[margin-left,width] duration-200 ease-linear ${collapsed ? 'ml-[var(--sidebar-width-icon)] w-[calc(100%-var(--sidebar-width-icon))]' : 'ml-[var(--sidebar-width)] w-[calc(100%-var(--sidebar-width))]'}`}
      >
        <div className="w-full max-w-3xl min-h-full flex flex-col justify-center items-center text-center p-8 overflow-y-auto">
          {children}
        </div>
        <Link
          href="/dashboard/settings"
          className="absolute top-4 right-4 p-2 bg-none border-none cursor-pointer transition-transform duration-200 rounded text-[hsl(210_15%_65%)] hover:bg-[rgba(79,84,92,0.4)] hover:scale-110"
        >
           <Settings size={24} className="text-[hsl(84_81%_44%)]" />
        </Link>
      </div>
    </>
  );
}
