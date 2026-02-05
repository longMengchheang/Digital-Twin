"use client";

import { useState } from "react";
import Sidebar from "../../components/Sidebar";

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className={`flex-1 min-h-screen flex justify-center items-center relative transition-[margin-left,width] duration-200 ease-linear bg-slate-50 ${collapsed ? "ml-[var(--sidebar-width-icon)] w-[calc(100%-var(--sidebar-width-icon))]" : "ml-[var(--sidebar-width)] w-[calc(100%-var(--sidebar-width))]"}`}
      >
        <div className="w-full max-w-4xl min-h-full flex flex-col justify-start items-center text-center p-8 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
