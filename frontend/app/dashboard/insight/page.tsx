"use client";

import { useState } from "react";
import { RefreshCw, Loader } from "lucide-react";

export default function InsightPage() {
  const [analyzingMood, setAnalyzingMood] = useState(false);

  const handleNodeHover = (e: React.MouseEvent<SVGGElement, MouseEvent>, isHover: boolean) => {
    const node = e.currentTarget;
    const circle = node.querySelector("circle");
    const text = node.querySelector("text");
    if (isHover) {
      if (circle) circle.setAttribute("fill", "#e2e8f0"); // slate-200
      if (text) text.setAttribute("font-size", "11");
      if (text) text.setAttribute("font-weight", "bold");
    } else {
      if (circle) circle.setAttribute("fill", "#f8fafc"); // slate-50
      if (text) text.setAttribute("font-size", "10");
      if (text) text.setAttribute("font-weight", "normal");
    }
  };

  const handleNodeClick = (text: string) => {
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
      <div className="mb-10 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Your Insights Dashboard
        </h1>
        <p className="text-slate-500 text-base max-w-2xl">
          Connected insights from your check-ins, quests, and chats to suggest
          next steps and estimate your current mood.
        </p>
      </div>

      {/* Network Graph Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-8 transition-transform hover:shadow-md">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-semibold text-slate-800 mb-1">
            Connection Web
          </h3>
          <p className="text-sm text-slate-500">
            Visual representation of how your activities and moods are connected
          </p>
        </div>
        <div className="p-6 flex justify-center bg-slate-50">
          <div className="w-full max-w-[500px] p-4">
            <svg
              viewBox="0 0 440 440"
              className="w-full h-auto overflow-visible"
              role="img"
              aria-label="Connection graph of suggestions and mood"
            >
              {/* Links */}
              <line
                x1="220"
                y1="220"
                x2="220"
                y2="80"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              <line
                x1="220"
                y1="220"
                x2="353.5"
                y2="150.5"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              <line
                x1="220"
                y1="220"
                x2="353.5"
                y2="289.5"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              <line
                x1="220"
                y1="220"
                x2="220"
                y2="360"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              <line
                x1="220"
                y1="220"
                x2="86.5"
                y2="289.5"
                stroke="#cbd5e1"
                strokeWidth="2"
              />

              {/* Center node */}
              <circle
                cx="220"
                cy="220"
                r="36"
                fill="#eff6ff"
                stroke="#3b82f6"
                strokeWidth="2"
                className="cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95"
                onClick={(e) => {
                  const target = e.target as SVGCircleElement;
                  target.style.transform = "scale(1.1)";
                  setTimeout(
                    () => (target.style.transform = "scale(1)"),
                    300,
                  );
                }}
              />
              <text
                x="220"
                y="220"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#1e293b"
                fontSize="14"
                className="pointer-events-none font-bold"
              >
                You
              </text>

              {/* Outer nodes */}
              <g
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={(e) => handleNodeHover(e, true)}
                onMouseLeave={(e) => handleNodeHover(e, false)}
                onClick={() =>
                  handleNodeClick("Quest: 7-Day Mindfulness Challenge")
                }
              >
                <circle
                  cx="220"
                  cy="80"
                  r="32"
                  fill="#f8fafc"
                  stroke="#94a3b8"
                  strokeWidth="1"
                  className="transition-fill duration-300"
                />
                <text
                  x="220"
                  y="80"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#475569"
                  fontSize="10"
                  className="pointer-events-none transition-all duration-300"
                >
                  Quest: Mindfulness
                </text>
              </g>
              <g
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={(e) => handleNodeHover(e, true)}
                onMouseLeave={(e) => handleNodeHover(e, false)}
                onClick={() =>
                  handleNodeClick("Habit: 10-minute daily breathing")
                }
              >
                <circle
                  cx="353.5"
                  cy="150.5"
                  r="32"
                  fill="#f8fafc"
                  stroke="#94a3b8"
                  strokeWidth="1"
                  className="transition-fill duration-300"
                />
                <text
                  x="353.5"
                  y="150.5"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#475569"
                  fontSize="10"
                  className="pointer-events-none transition-all duration-300"
                >
                  Habit: Breathing
                </text>
              </g>
              <g
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={(e) => handleNodeHover(e, true)}
                onMouseLeave={(e) => handleNodeHover(e, false)}
                onClick={() =>
                  handleNodeClick("Tip: Schedule a daily 5-minute reflection")
                }
              >
                <circle
                  cx="353.5"
                  cy="289.5"
                  r="32"
                  fill="#f8fafc"
                  stroke="#94a3b8"
                  strokeWidth="1"
                  className="transition-fill duration-300"
                />
                <text
                  x="353.5"
                  y="289.5"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#475569"
                  fontSize="10"
                  className="pointer-events-none transition-all duration-300"
                >
                  Tip: Reflection
                </text>
              </g>
              <g
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={(e) => handleNodeHover(e, true)}
                onMouseLeave={(e) => handleNodeHover(e, false)}
                onClick={() => handleNodeClick("Topic: Stress management")}
              >
                <circle
                  cx="220"
                  cy="360"
                  r="32"
                  fill="#f8fafc"
                  stroke="#94a3b8"
                  strokeWidth="1"
                  className="transition-fill duration-300"
                />
                <text
                  x="220"
                  y="360"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#475569"
                  fontSize="10"
                  className="pointer-events-none transition-all duration-300"
                >
                  Topic: Stress
                </text>
              </g>
              <g
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={(e) => handleNodeHover(e, true)}
                onMouseLeave={(e) => handleNodeHover(e, false)}
                onClick={() => handleNodeClick("Feeling: Negative")}
              >
                <circle
                  cx="86.5"
                  cy="289.5"
                  r="32"
                  fill="#f8fafc"
                  stroke="#94a3b8"
                  strokeWidth="1"
                  className="transition-fill duration-300"
                />
                <text
                  x="86.5"
                  y="289.5"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#475569"
                  fontSize="10"
                  className="pointer-events-none transition-all duration-300"
                >
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
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-transform hover:shadow-md">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-xl font-semibold text-slate-800 mb-1">
              Recommended Next Steps
            </h3>
            <p className="text-sm text-slate-500">
              Actions tailored based on your recent activity
            </p>
          </div>
          <div className="p-6">
            <ul className="list-disc pl-5 space-y-3 mb-4 text-slate-700">
              <li className="cursor-pointer hover:bg-slate-50 rounded p-1 transition-colors">
                Start:{" "}
                <span className="text-blue-600 font-medium">
                  7-Day Mindfulness Challenge
                </span>
              </li>
              <li className="cursor-pointer hover:bg-slate-50 rounded p-1 transition-colors">
                Build habit:{" "}
                <span className="text-blue-600 font-medium">
                  10-minute daily breathing
                </span>
              </li>
              <li className="cursor-pointer hover:bg-slate-50 rounded p-1 transition-colors">
                Quick tip:{" "}
                <span className="text-blue-600 font-medium">
                  Schedule a daily 5-minute reflection after breakfast
                </span>
              </li>
            </ul>
            <p className="mt-4 text-sm text-slate-500 pt-4 border-t border-slate-100">
              Focus area:{" "}
              <span className="text-blue-600 font-medium">
                Stress management
              </span>
            </p>
          </div>
        </div>

        {/* Mood Snapshot Card */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-transform hover:shadow-md">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-xl font-semibold text-slate-800 mb-1">
              Mood Snapshot
            </h3>
            <p className="text-sm text-slate-500">
              Your current emotional state based on recent interactions
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <p className="font-semibold text-lg text-slate-700">
                Likely feeling:{" "}
                <span className="text-amber-500">Negative/Stress</span>
              </p>
              <p className="text-sm text-slate-500">
                Based on 3 recent messages with negative sentiment
              </p>
              <div className="text-xs text-slate-400 italic">
                Last updated: Just now
              </div>
              <button
                className="mt-4 flex items-center gap-2 bg-transparent border border-slate-300 p-2 rounded text-sm text-slate-600 cursor-pointer transition-colors hover:bg-slate-50"
                onClick={refreshMood}
              >
                {analyzingMood ? (
                  <Loader className="animate-spin text-slate-500" size={16} />
                ) : (
                  <RefreshCw className="text-slate-500" size={16} />
                )}
                {analyzingMood ? "Analyzing..." : "Update Mood Analysis"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
