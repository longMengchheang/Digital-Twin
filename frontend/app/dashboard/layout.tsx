"use client";

import Sidebar from "../../components/Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="min-h-screen ml-[var(--sidebar-width)] w-[calc(100%-var(--sidebar-width))]">
        <div className="dashboard-backdrop min-h-screen">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
