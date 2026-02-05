'use client';

export default function SettingsPage() {
  return (
    <div className="w-full max-w-[600px] mx-auto animate-fade-in">
      <div className="bg-[hsl(210_25%_11%)] border border-[hsl(210_25%_16%)] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[hsl(210_25%_16%)]">
           <h2 className="text-xl font-bold text-[hsl(84_81%_44%)] m-0">Settings</h2>
        </div>
        <div className="p-6">
           <p className="text-[hsl(210_40%_98%)]">Customize your experience here!</p>
        </div>
      </div>
    </div>
  );
}
