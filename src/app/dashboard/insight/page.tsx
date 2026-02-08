"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  BarChart2,
  Brain,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type NodeType = "Mood" | "Signal" | "Habit" | "Routine" | "Quest";
type NodeState = "low" | "medium" | "high";
type EdgeStrength = "weak" | "medium" | "strong";

interface InsightNode {
  id: string;
  label: string;
  type: NodeType;
  color: string;
  state: NodeState;
  score: number;
  occurrences: number;
  summary: string;
  details: string[];
  suggestion: string;
}

interface InsightEdge {
  id: string;
  source: string;
  target: string;
  strength: EdgeStrength;
  score: number;
  reason: string;
}

interface GrowthPath {
  fromNodeId: string;
  toNodeId: string;
  label: string;
}

interface WeeklyEvolution {
  moodDelta: number;
  stressDelta: number;
  focusDelta: number;
}

interface MapUpdate {
  changed: boolean;
  changeType: "initialized" | "new_pattern" | "connection_shift" | "rebalanced" | "stable";
  message: string;
}

interface WeeklyReflection {
  title: string;
  dominantPattern: string;
  improvement: string;
  narrative: string;
}

interface BehaviorMapPayload {
  center: {
    id: string;
    label: string;
    level: number;
  };
  nodes: InsightNode[];
  edges: InsightEdge[];
  highlight: {
    edgeId?: string;
    message: string;
  };
  growthPath: GrowthPath | null;
  weeklyEvolution: WeeklyEvolution;
  mapUpdate: MapUpdate;
  weeklyReflection: WeeklyReflection;
  dataWindow: {
    signals24h: number;
    signals7d: number;
    signals30d: number;
  };
  suggestions: string[];
  generatedAt: string;
}

interface PositionedNode extends InsightNode {
  x: number;
  y: number;
}

const OUTER_NODE_POSITIONS = [
  { x: 220, y: 78 },
  { x: 350, y: 150 },
  { x: 350, y: 290 },
  { x: 220, y: 362 },
  { x: 90, y: 290 },
];

const EDGE_STYLE: Record<EdgeStrength, { width: number; opacity: number; dasharray?: string }> = {
  weak: { width: 1.6, opacity: 0.28, dasharray: "4 5" },
  medium: { width: 2.6, opacity: 0.48 },
  strong: { width: 4, opacity: 0.78 },
};

const NODE_RADIUS: Record<NodeState, number> = {
  low: 30,
  medium: 34,
  high: 38,
};

const TYPE_LABEL: Record<NodeType, string> = {
  Mood: "State",
  Signal: "Signal",
  Habit: "Habit",
  Routine: "Routine",
  Quest: "Quest",
};

function formatDelta(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MindMapPage() {
  const router = useRouter();

  const [mapData, setMapData] = useState<BehaviorMapPayload | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const positionedNodes = useMemo<PositionedNode[]>(() => {
    if (!mapData) return [];

    return mapData.nodes.slice(0, 5).map((node, index) => {
      const fallback = OUTER_NODE_POSITIONS[OUTER_NODE_POSITIONS.length - 1];
      const point = OUTER_NODE_POSITIONS[index] || fallback;
      return {
        ...node,
        x: point.x,
        y: point.y,
      };
    });
  }, [mapData]);

  const nodeById = useMemo(() => {
    const map = new Map<string, PositionedNode>();
    for (const node of positionedNodes) {
      map.set(node.id, node);
    }
    return map;
  }, [positionedNodes]);

  const positionById = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    map.set("you", { x: 220, y: 220 });
    for (const node of positionedNodes) {
      map.set(node.id, { x: node.x, y: node.y });
    }
    return map;
  }, [positionedNodes]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return positionedNodes[0] || null;
    return positionedNodes.find((node) => node.id === selectedNodeId) || positionedNodes[0] || null;
  }, [positionedNodes, selectedNodeId]);

  const moodNode = useMemo(() => {
    return positionedNodes.find((node) => node.type === "Mood") || null;
  }, [positionedNodes]);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const loadMap = async (isRefresh = false) => {
    const headers = authHeaders();
    if (!headers) {
      router.replace("/?mode=signin");
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get("/api/insight/map", {
        headers,
      });

      const payload = response.data as BehaviorMapPayload;
      setMapData(payload);
      setSelectedNodeId((current) => {
        if (current && payload.nodes.some((node) => node.id === current)) {
          return current;
        }
        return payload.nodes[0]?.id || null;
      });
      setError("");
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        router.replace("/?mode=signin");
        return;
      }

      setError("Unable to generate your behavior intelligence map right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadMap();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          Building your behavior intelligence map...
        </div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
        {error || "Mind map is currently unavailable."}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl animate-fade-in space-y-6">
      <header className="text-left">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
          <Brain className="h-3.5 w-3.5" />
          Behavior Intelligence Map
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">A living mirror of your behavior patterns</h1>
        <p className="mt-1 text-sm text-slate-600">
          Nodes are generated from Daily Pulse, Quest Log, and Companion inputs. Connections are weighted by recurrence and correlation.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">{error}</div>
      )}

      <div
        className={
          mapData.mapUpdate.changed
            ? "rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
            : "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
        }
      >
        {mapData.mapUpdate.message}
      </div>

      <section className="card-calm overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="text-left">
            <h2 className="text-lg font-semibold text-slate-900">Connection Web</h2>
            <p className="mt-1 text-sm text-slate-500">Strong links glow brighter and indicate high-impact behavioral patterns.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void loadMap(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-700"
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>

        <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/50 px-4 py-6 md:px-6">
          <div className="mx-auto max-w-[580px]">
            <svg viewBox="0 0 440 440" className="w-full overflow-visible" role="img" aria-label="Behavior intelligence map">
              <defs>
                <filter id="strongGlow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="2.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="centerAura" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#dbeafe" stopOpacity="0" />
                </radialGradient>
                <marker id="growthArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#6366f1" opacity="0.7" />
                </marker>
              </defs>

              {mapData.edges.map((edge) => {
                const sourcePosition = positionById.get(edge.source);
                const targetPosition = positionById.get(edge.target);
                if (!sourcePosition || !targetPosition) return null;

                const sourceNode = nodeById.get(edge.source);
                const style = EDGE_STYLE[edge.strength];
                const edgeColor = sourceNode?.color || "#94a3b8";

                return (
                  <line
                    key={edge.id}
                    x1={sourcePosition.x}
                    y1={sourcePosition.y}
                    x2={targetPosition.x}
                    y2={targetPosition.y}
                    stroke={edgeColor}
                    strokeOpacity={style.opacity}
                    strokeWidth={style.width}
                    strokeDasharray={style.dasharray}
                    filter={edge.strength === "strong" ? "url(#strongGlow)" : undefined}
                  />
                );
              })}

              {mapData.growthPath && (() => {
                const sourcePosition = positionById.get(mapData.growthPath.fromNodeId);
                const targetPosition = positionById.get(mapData.growthPath.toNodeId);
                if (!sourcePosition || !targetPosition) return null;

                return (
                  <line
                    x1={sourcePosition.x}
                    y1={sourcePosition.y}
                    x2={targetPosition.x}
                    y2={targetPosition.y}
                    stroke="#6366f1"
                    strokeOpacity="0.65"
                    strokeWidth="2"
                    strokeDasharray="5 4"
                    markerEnd="url(#growthArrow)"
                  />
                );
              })()}

              <circle cx="220" cy="220" r="88" fill="url(#centerAura)" />
              <g style={{ animation: "insightPulse 4.6s ease-in-out infinite" }}>
                <circle cx="220" cy="220" r="42" fill="#eff6ff" stroke="#5b8def" strokeWidth="3" />
                <circle cx="220" cy="220" r="48" fill="none" stroke="#93c5fd" strokeOpacity="0.4" strokeWidth="1.2" />
              </g>
              <text x="220" y="214" textAnchor="middle" fill="#1e3a8a" fontSize="14" fontWeight="700">
                {mapData.center.label}
              </text>
              <text x="220" y="234" textAnchor="middle" fill="#64748b" fontSize="10">
                Level {mapData.center.level}
              </text>

              {positionedNodes.map((node, index) => {
                const radius = NODE_RADIUS[node.state];
                const selected = selectedNode?.id === node.id;

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    style={{
                      animation: "insightFloat 8s ease-in-out infinite",
                      animationDelay: `${index * 0.45}s`,
                      cursor: "pointer",
                    }}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 3}
                      fill={node.color}
                      fillOpacity={selected ? 0.28 : 0.16}
                    />
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius}
                      fill="#ffffff"
                      stroke={node.color}
                      strokeWidth={selected ? 3 : 2}
                      filter={node.state === "high" ? "url(#strongGlow)" : undefined}
                    />
                    <text x={node.x} y={node.y - 8} textAnchor="middle" fill={node.color} fontSize="9" fontWeight="700">
                      {TYPE_LABEL[node.type].toUpperCase()}
                    </text>
                    <text x={node.x} y={node.y + 8} textAnchor="middle" fill="#334155" fontSize="10.5" fontWeight="500">
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          {(["Mood", "Signal", "Habit", "Routine", "Quest"] as NodeType[]).map((type) => (
            <div key={type} className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: type === "Mood" ? "#f59e0b" : type === "Signal" ? "#fb923c" : type === "Habit" ? "#34d399" : type === "Routine" ? "#60a5fa" : "#a78bfa" }}
              />
              <span>{type}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="card-calm p-5 text-left">
          <h3 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Insight Highlight
          </h3>
          <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-sm text-blue-900">
            {mapData.highlight.message}
          </p>

          {mapData.growthPath && (
            <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 px-3 py-3 text-sm text-violet-900">
              {mapData.growthPath.label}
            </div>
          )}

          <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">{mapData.weeklyReflection.title}</p>
            <p>{mapData.weeklyReflection.dominantPattern}</p>
            <p>{mapData.weeklyReflection.improvement}</p>
            <p className="text-slate-600">{mapData.weeklyReflection.narrative}</p>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Updated {formatTimestamp(mapData.generatedAt)} • Signals 24h/7d/30d:{" "}
            {mapData.dataWindow.signals24h}/{mapData.dataWindow.signals7d}/{mapData.dataWindow.signals30d}
          </p>
        </article>

        <article className="card-calm p-5 text-left">
          <h3 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
            <BarChart2 className="h-4 w-4 text-blue-600" />
            Weekly Evolution
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-slate-600">Mood trend</span>
              <span className={mapData.weeklyEvolution.moodDelta >= 0 ? "inline-flex items-center gap-1 text-emerald-600" : "inline-flex items-center gap-1 text-red-500"}>
                {mapData.weeklyEvolution.moodDelta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {formatDelta(mapData.weeklyEvolution.moodDelta)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-slate-600">Stress signal delta</span>
              <span className={mapData.weeklyEvolution.stressDelta <= 0 ? "inline-flex items-center gap-1 text-emerald-600" : "inline-flex items-center gap-1 text-red-500"}>
                {mapData.weeklyEvolution.stressDelta <= 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                {formatDelta(mapData.weeklyEvolution.stressDelta)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-slate-600">Focus routine delta</span>
              <span className={mapData.weeklyEvolution.focusDelta >= 0 ? "inline-flex items-center gap-1 text-emerald-600" : "inline-flex items-center gap-1 text-red-500"}>
                {mapData.weeklyEvolution.focusDelta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {formatDelta(mapData.weeklyEvolution.focusDelta)}
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="card-calm p-5 text-left">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Node Diagnostic</h3>
          {selectedNode ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-base font-semibold text-slate-900">{selectedNode.label}</span>
                  <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    {selectedNode.type}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{selectedNode.summary}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Diagnostics</p>
                <p className="mt-1 text-sm text-slate-700">Appeared: {selectedNode.occurrences} time(s) this week</p>
                <p className="text-sm text-slate-700">Signal score: {selectedNode.score}/100</p>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  {selectedNode.details.map((detail) => (
                    <p key={detail}>- {detail}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                <span className="font-semibold">Suggested action:</span> {selectedNode.suggestion}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Click a node to inspect its weekly diagnostics.</p>
          )}
        </article>

        <article className="card-calm p-5 text-left">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Suggested Next Actions</h3>
          <div className="space-y-2">
            {mapData.suggestions.length ? (
              mapData.suggestions.map((suggestion, index) => (
                <div key={`${suggestion}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                  {suggestion}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">More data is needed to generate action recommendations.</p>
            )}
          </div>

          {moodNode && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              <span className="font-semibold">Mood snapshot:</span> {moodNode.summary}
            </div>
          )}
        </article>
      </section>

      <style jsx>{`
        @keyframes insightFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes insightPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
        }
      `}</style>
    </div>
  );
}

