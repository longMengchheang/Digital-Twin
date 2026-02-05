'use client';

import { useState } from 'react';
import { RefreshCw, Loader } from 'lucide-react';

export default function InsightPage() {
  const [analyzingMood, setAnalyzingMood] = useState(false);

  const handleNodeHover = (e, isHover) => {
    const node = e.currentTarget;
    const circle = node.querySelector('circle');
    const text = node.querySelector('text');
    if (isHover) {
       if (circle) circle.setAttribute('fill', 'hsl(84 81% 44% / 0.3)');
       if (text) text.setAttribute('font-size', '11');
    } else {
       if (circle) circle.setAttribute('fill', 'hsl(210 25% 16%)');
       if (text) text.setAttribute('font-size', '10');
    }
  };

  const handleNodeClick = (text) => {
     console.log(`Node clicked: ${text}`);
  };

  const refreshMood = () => {
    setAnalyzingMood(true);
    setTimeout(() => {
       setAnalyzingMood(false);
    }, 1500);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-8 animate-fade-in text-left">
        <div className="mb-10 border-b border-[hsl(210_25%_16%)] pb-6">
            <h1 className="text-3xl font-bold text-[hsl(84_81%_44%)] mb-2">Your Insights Dashboard</h1>
            <p className="text-[hsl(210_15%_65%)] text-base max-w-2xl">
                Connected insights from your check-ins, quests, and chats to suggest next steps and estimate your current mood.
            </p>
        </div>

        {/* Network Graph Card */}
        <div className="bg-[hsl(210_25%_11%)] border border-[hsl(210_25%_16%)] rounded-xl overflow-hidden shadow-sm mb-8 transition-transform hover:-translate-y-1 hover:shadow-lg">
            <div className="p-6 border-b border-[hsl(210_25%_16%)]">
                <h3 className="text-xl font-semibold text-[hsl(210_40%_98%)] mb-1">Connection Web</h3>
                <p className="text-sm text-[hsl(210_15%_65%)]">
                    Visual representation of how your activities and moods are connected
                </p>
            </div>
            <div className="p-6 flex justify-center bg-[hsla(210,25%,8%,0.5)]">
                <div className="w-full max-w-[500px] p-4">
                    <svg viewBox="0 0 440 440" className="w-full h-auto overflow-visible" role="img" aria-label="Connection graph of suggestions and mood">
                        {/* Links */}
                        <line x1="220" y1="220" x2="220" y2="80" stroke="hsl(84 81% 44%)" strokeOpacity="0.5" strokeWidth="2" />
                        <line x1="220" y1="220" x2="353.5" y2="150.5" stroke="hsl(84 81% 44%)" strokeOpacity="0.5" strokeWidth="2" />
                        <line x1="220" y1="220" x2="353.5" y2="289.5" stroke="hsl(84 81% 44%)" strokeOpacity="0.5" strokeWidth="2" />
                        <line x1="220" y1="220" x2="220" y2="360" stroke="hsl(84 81% 44%)" strokeOpacity="0.5" strokeWidth="2" />
                        <line x1="220" y1="220" x2="86.5" y2="289.5" stroke="hsl(84 81% 44%)" strokeOpacity="0.5" strokeWidth="2" />

                        {/* Center node */}
                        <circle cx="220" cy="220" r="36" fill="hsl(84 81% 44% / 0.15)" stroke="hsl(84 81% 44%)"
                                className="cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95"
                                onClick={(e) => {
                                   e.target.style.transform = 'scale(1.1)';
                                   setTimeout(() => e.target.style.transform = 'scale(1)', 300);
                                }}
                        />
                        <text x="220" y="220" textAnchor="middle" dominantBaseline="middle" fill="hsl(210 40% 98%)" fontSize="14" className="pointer-events-none font-medium">
                            You
                        </text>

                        {/* Outer nodes */}
                        <g className="cursor-pointer transition-all duration-300" onMouseEnter={(e) => handleNodeHover(e, true)} onMouseLeave={(e) => handleNodeHover(e, false)} onClick={() => handleNodeClick("Quest: 7-Day Mindfulness Challenge")}>
                            <circle cx="220" cy="80" r="28" fill="hsl(210 25% 16%)" className="transition-fill duration-300" />
                            <text x="220" y="80" textAnchor="middle" dominantBaseline="middle" fill="hsl(210 40% 98%)" fontSize="10" className="pointer-events-none transition-all duration-300">
                                Quest: 7-Day Mindfulness Challenge
                            </text>
                        </g>
                        <g className="cursor-pointer transition-all duration-300" onMouseEnter={(e) => handleNodeHover(e, true)} onMouseLeave={(e) => handleNodeHover(e, false)} onClick={() => handleNodeClick("Habit: 10-minute daily breathing")}>
                            <circle cx="353.5" cy="150.5" r="28" fill="hsl(210 25% 16%)" className="transition-fill duration-300" />
                            <text x="353.5" y="150.5" textAnchor="middle" dominantBaseline="middle" fill="hsl(210 40% 98%)" fontSize="10" className="pointer-events-none transition-all duration-300">
                                Habit: 10-minute daily breathing
                            </text>
                        </g>
                        <g className="cursor-pointer transition-all duration-300" onMouseEnter={(e) => handleNodeHover(e, true)} onMouseLeave={(e) => handleNodeHover(e, false)} onClick={() => handleNodeClick("Tip: Schedule a daily 5-minute reflection")}>
                            <circle cx="353.5" cy="289.5" r="28" fill="hsl(210 25% 16%)" className="transition-fill duration-300" />
                            <text x="353.5" y="289.5" textAnchor="middle" dominantBaseline="middle" fill="hsl(210 40% 98%)" fontSize="10" className="pointer-events-none transition-all duration-300">
                                Tip: Schedule a daily 5-minute reflection...
                            </text>
                        </g>
                        <g className="cursor-pointer transition-all duration-300" onMouseEnter={(e) => handleNodeHover(e, true)} onMouseLeave={(e) => handleNodeHover(e, false)} onClick={() => handleNodeClick("Topic: Stress management")}>
                            <circle cx="220" cy="360" r="28" fill="hsl(210 25% 16%)" className="transition-fill duration-300" />
                            <text x="220" y="360" textAnchor="middle" dominantBaseline="middle" fill="hsl(210 40% 98%)" fontSize="10" className="pointer-events-none transition-all duration-300">
                                Topic: Stress management
                            </text>
                        </g>
                        <g className="cursor-pointer transition-all duration-300" onMouseEnter={(e) => handleNodeHover(e, true)} onMouseLeave={(e) => handleNodeHover(e, false)} onClick={() => handleNodeClick("Feeling: Negative")}>
                            <circle cx="86.5" cy="289.5" r="28" fill="hsl(210 25% 16%)" className="transition-fill duration-300" />
                            <text x="86.5" y="289.5" textAnchor="middle" dominantBaseline="middle" fill="hsl(210 40% 98%)" fontSize="10" className="pointer-events-none transition-all duration-300">
                                Feeling: Negative
                            </text>
                        </g>
                    </svg>
                </div>
            </div>
        </div>

        {/* Stacked Recommendations and Mood Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Recommendations Card */}
            <div className="bg-[hsl(210_25%_11%)] border border-[hsl(210_25%_16%)] rounded-xl overflow-hidden shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg">
                <div className="p-6 border-b border-[hsl(210_25%_16%)]">
                    <h3 className="text-xl font-semibold text-[hsl(210_40%_98%)] mb-1">Recommended Next Steps</h3>
                    <p className="text-sm text-[hsl(210_15%_65%)]">
                        Actions tailored based on your recent activity
                    </p>
                </div>
                <div className="p-6">
                    <ul className="list-disc pl-5 space-y-3 mb-4 text-[hsl(210_40%_98%)]">
                        <li className="cursor-pointer hover:bg-[hsla(84,81%,44%,0.1)] rounded p-1 transition-colors">Start: <span className="text-[hsl(84_81%_44%)] font-medium">7-Day Mindfulness Challenge</span></li>
                        <li className="cursor-pointer hover:bg-[hsla(84,81%,44%,0.1)] rounded p-1 transition-colors">Build habit: <span className="text-[hsl(84_81%_44%)] font-medium">10-minute daily breathing</span></li>
                        <li className="cursor-pointer hover:bg-[hsla(84,81%,44%,0.1)] rounded p-1 transition-colors">Quick tip: <span className="text-[hsl(84_81%_44%)] font-medium">Schedule a daily 5-minute reflection after breakfast</span></li>
                    </ul>
                    <p className="mt-4 text-sm text-[hsl(210_15%_65%)] pt-4 border-t border-[hsl(210_25%_16%)]">
                        Focus area: <span className="text-[hsl(84_81%_44%)] font-medium">Stress management</span>
                    </p>
                </div>
            </div>

            {/* Mood Snapshot Card */}
            <div className="bg-[hsl(210_25%_11%)] border border-[hsl(210_25%_16%)] rounded-xl overflow-hidden shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg">
                <div className="p-6 border-b border-[hsl(210_25%_16%)]">
                    <h3 className="text-xl font-semibold text-[hsl(210_40%_98%)] mb-1">Mood Snapshot</h3>
                    <p className="text-sm text-[hsl(210_15%_65%)]">
                        Your current emotional state based on recent interactions
                    </p>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        <p className="font-semibold text-lg text-[hsl(210_40%_98%)]">
                            Likely feeling: <span className="text-[hsl(84_81%_44%)]">Negative</span>
                        </p>
                        <p className="text-sm text-[hsl(210_15%_65%)]">
                            Based on 3 recent messages with negative sentiment
                        </p>
                        <div className="text-xs text-[hsl(210_15%_65%)] italic">
                            Last updated: Just now
                        </div>
                        <button
                          className="mt-4 flex items-center gap-2 bg-transparent border border-[hsl(210_25%_16%)] p-2 rounded text-sm text-[hsl(210_40%_98%)] cursor-pointer transition-colors hover:bg-[hsl(210_25%_16%)]"
                          onClick={refreshMood}
                        >
                            {analyzingMood ? <Loader className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                            {analyzingMood ? 'Analyzing...' : 'Update Mood Analysis'}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-[hsl(210_25%_11%)] border border-[hsl(210_25%_16%)] rounded-xl overflow-hidden shadow-sm mb-8 transition-transform hover:-translate-y-1 hover:shadow-lg">
            <div className="p-6 border-b border-[hsl(210_25%_16%)]">
                <h3 className="text-xl font-semibold text-[hsl(210_40%_98%)] mb-1">Recent Activity</h3>
                <p className="text-sm text-[hsl(210_15%_65%)]">
                    Your interactions from the past week
                </p>
            </div>
            <div className="p-6">
                <div className="space-y-4">
                    <div className="pb-4 border-b border-[hsl(210_25%_16%)]">
                        <p className="font-semibold text-[hsl(210_40%_98%)] mb-1">Today</p>
                        <p className="text-sm text-[hsl(210_15%_65%)]">Completed breathing exercise (8 minutes)</p>
                    </div>
                    <div className="pb-4 border-b border-[hsl(210_25%_16%)]">
                        <p className="font-semibold text-[hsl(210_40%_98%)] mb-1">Yesterday</p>
                        <p className="text-sm text-[hsl(210_15%_65%)]">Started conversation about work stress</p>
                    </div>
                    <div>
                        <p className="font-semibold text-[hsl(210_40%_98%)] mb-1">2 days ago</p>
                        <p className="text-sm text-[hsl(210_15%_65%)]">Skipped daily check-in</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Progress Trends Card */}
        <div className="bg-[hsl(210_25%_11%)] border border-[hsl(210_25%_16%)] rounded-xl overflow-hidden shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg">
            <div className="p-6 border-b border-[hsl(210_25%_16%)]">
                <h3 className="text-xl font-semibold text-[hsl(210_40%_98%)] mb-1">Progress Trends</h3>
                <p className="text-sm text-[hsl(210_15%_65%)]">
                    Your improvement over the last 30 days
                </p>
            </div>
            <div className="p-6">
                <div className="w-full h-[200px] flex items-center justify-center">
                    <svg viewBox="0 0 440 200" className="w-full h-full" role="img" aria-label="Progress trend graph">
                        {/* Simple line graph placeholder */}
                        <polyline points="20,180 60,120 100,160 140,100 180,140 220,80 260,120 300,60 340,100 380,40 420,80"
                                 fill="none" stroke="hsl(84 81% 44%)" strokeWidth="2"
                                 className="animate-[drawGraph_2s_ease-in-out_forwards]"
                                 style={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
                        />
                        <text x="20" y="20" fill="hsl(210 40% 98%)" fontSize="12">Mood improvement trend</text>
                    </svg>
                </div>
            </div>
        </div>
        <style jsx>{`
            @keyframes drawGraph {
                to { stroke-dashoffset: 0; }
            }
        `}</style>
    </div>
  );
}
