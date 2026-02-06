import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import CheckIn from '@/lib/models/CheckIn';
import Quest from '@/lib/models/Quest';
import ChatSignal from '@/lib/models/ChatSignal';
import User from '@/lib/models/User';
import { CHAT_SIGNAL_KEYS, ChatSignalKeyword, createEmptyChatSignalCounts } from '@/lib/chatSignals';

export const dynamic = 'force-dynamic';

type NodeType = 'Mood' | 'Signal' | 'Habit' | 'Routine' | 'Quest';
type NodeState = 'low' | 'medium' | 'high';
type EdgeStrength = 'weak' | 'medium' | 'strong';

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

interface BehaviorMapResponse {
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
  suggestions: string[];
  generatedAt: string;
}

function dayStart(date: Date): Date {
  const output = new Date(date);
  output.setHours(0, 0, 0, 0);
  return output;
}

function shiftDays(base: Date, days: number): Date {
  const output = new Date(base);
  output.setDate(output.getDate() + days);
  return output;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeString(value: string): string {
  return String(value || '').trim().toLowerCase();
}

function setIntersectionSize(a: Set<string>, b: Set<string>): number {
  let hits = 0;
  a.forEach((value) => {
    if (b.has(value)) hits += 1;
  });
  return hits;
}

function strengthFromScore(score: number): EdgeStrength {
  if (score >= 4) return 'strong';
  if (score >= 2) return 'medium';
  return 'weak';
}

function colorForNode(type: NodeType, state: NodeState): string {
  const palette: Record<NodeType, Record<NodeState, string>> = {
    Mood: {
      low: '#fca5a5',
      medium: '#f59e0b',
      high: '#34d399',
    },
    Signal: {
      low: '#fdba74',
      medium: '#fb923c',
      high: '#f97316',
    },
    Habit: {
      low: '#9ae6b4',
      medium: '#34d399',
      high: '#10b981',
    },
    Routine: {
      low: '#93c5fd',
      medium: '#60a5fa',
      high: '#3b82f6',
    },
    Quest: {
      low: '#c4b5fd',
      medium: '#a78bfa',
      high: '#8b5cf6',
    },
  };

  return palette[type][state];
}

function stateFromScore(score: number): NodeState {
  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

function formatDelta(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function clampTo100(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function edgeRank(edge: InsightEdge): number {
  const base = edge.strength === 'strong' ? 300 : edge.strength === 'medium' ? 200 : 100;
  return base + edge.score;
}

export async function GET(req: Request) {
  try {
    await dbConnect();

    const authUser = verifyToken(req);
    if (!authUser) {
      return NextResponse.json({ msg: 'No token, authorization denied.' }, { status: 401 });
    }

    const now = new Date();
    const today = dayStart(now);
    const weekStart = shiftDays(today, -6);
    const previousWeekStart = shiftDays(today, -13);

    const [user, checkInsRaw, questsRaw, chatSignalsRaw] = await Promise.all([
      User.findById(authUser.id).select('level').lean(),
      CheckIn.find({ userId: authUser.id, date: { $gte: previousWeekStart } })
        .sort({ date: -1 })
        .lean(),
      Quest.find({ userId: authUser.id })
        .sort({ date: -1 })
        .limit(60)
        .lean(),
      ChatSignal.find({ userId: authUser.id, date: { $gte: weekStart } })
        .sort({ date: -1 })
        .limit(200)
        .lean(),
    ]);

    if (!user) {
      return NextResponse.json({ msg: 'User not found.' }, { status: 404 });
    }

    const checkIns = checkInsRaw.map((entry) => ({
      dayKey: String(entry.dayKey || ''),
      date: new Date(entry.date),
      ratings: Array.isArray(entry.ratings) ? entry.ratings.map((value: number) => Number(value)) : [],
      percentage: Number(entry.percentage || 0),
    }));

    const currentWeekCheckIns = checkIns.filter((entry) => entry.date >= weekStart);
    const previousWeekCheckIns = checkIns.filter((entry) => entry.date < weekStart && entry.date >= previousWeekStart);

    const currentMoodAvg = average(currentWeekCheckIns.map((entry) => entry.percentage));
    const previousMoodAvg = average(previousWeekCheckIns.map((entry) => entry.percentage));
    const moodDelta = currentMoodAvg - previousMoodAvg;

    const currentStressDays = new Set(
      currentWeekCheckIns
        .filter((entry) => entry.ratings[2] <= 2)
        .map((entry) => entry.dayKey),
    );

    const previousStressDays = new Set(
      previousWeekCheckIns
        .filter((entry) => entry.ratings[2] <= 2)
        .map((entry) => entry.dayKey),
    );

    const currentFatigueDays = new Set(
      currentWeekCheckIns
        .filter((entry) => entry.ratings[0] <= 2)
        .map((entry) => entry.dayKey),
    );

    const lowMoodDays = new Set(
      currentWeekCheckIns
        .filter((entry) => entry.percentage < 55)
        .map((entry) => entry.dayKey),
    );

    const currentFocusDays = new Set(
      currentWeekCheckIns
        .filter((entry) => entry.ratings[1] >= 4)
        .map((entry) => entry.dayKey),
    );

    const previousFocusDays = new Set(
      previousWeekCheckIns
        .filter((entry) => entry.ratings[1] >= 4)
        .map((entry) => entry.dayKey),
    );

    const stressMoodCooccurrence = setIntersectionSize(currentStressDays, lowMoodDays);
    const fatigueMoodCooccurrence = setIntersectionSize(currentFatigueDays, lowMoodDays);

    const stressCount = currentStressDays.size;
    const fatigueCount = currentFatigueDays.size;
    const focusCount = currentFocusDays.size;

    const activeQuest = questsRaw.find((quest) => !quest.completed) || null;
    const completedQuests = questsRaw.filter((quest) => quest.completed);

    const chatTopicCounts = createEmptyChatSignalCounts();
    const allowedKeywordSet = new Set<string>(CHAT_SIGNAL_KEYS);

    for (const signal of chatSignalsRaw) {
      const keyword = String(signal.keyword || '').trim();
      const count = Number(signal.count || 0);

      if (!allowedKeywordSet.has(keyword)) {
        continue;
      }
      if (!Number.isFinite(count) || count <= 0) {
        continue;
      }

      chatTopicCounts[keyword as ChatSignalKeyword] += Math.round(count);
    }

    const habitBuckets = [
      {
        key: 'breathing',
        label: 'Breathing Habit',
        suggestion: 'Schedule a 5-minute breathing reset after high-stress blocks.',
        keywords: ['breath', 'breathing'],
        count: chatTopicCounts.breathing,
      },
      {
        key: 'reflection',
        label: 'Reflection Habit',
        suggestion: 'Capture one short reflection each evening to stabilize mood.',
        keywords: ['reflect', 'reflection', 'journal', 'gratitude', 'mindful'],
        count: chatTopicCounts.reflection,
      },
      {
        key: 'exercise',
        label: 'Exercise Habit',
        suggestion: 'Add one short movement session on low-energy days.',
        keywords: ['exercise', 'workout', 'gym', 'walk', 'run', 'yoga'],
        count: chatTopicCounts.exercise,
      },
    ];

    for (const quest of completedQuests) {
      const questText = normalizeString(String(quest.goal || ''));
      for (const bucket of habitBuckets) {
        if (bucket.keywords.some((keyword) => questText.includes(keyword))) {
          bucket.count += 2;
        }
      }
    }

    const topHabit = [...habitBuckets].sort((a, b) => b.count - a.count)[0];

    const focusRoutineCount = focusCount + chatTopicCounts.focus + Math.max(0, chatTopicCounts.motivation - 1);

    const signalCandidates = [
      {
        id: 'signal-stress',
        label: 'Stress Signal',
        count: stressCount + chatTopicCounts.stress,
        cooccurrence: stressMoodCooccurrence,
        suggestion: 'Insert a breathing break right after long work sessions.',
      },
      {
        id: 'signal-fatigue',
        label: 'Fatigue Signal',
        count: fatigueCount + chatTopicCounts.fatigue,
        cooccurrence: fatigueMoodCooccurrence,
        suggestion: 'Protect sleep consistency and reduce late-day cognitive load.',
      },
    ].sort((a, b) => {
      if (b.cooccurrence !== a.cooccurrence) return b.cooccurrence - a.cooccurrence;
      return b.count - a.count;
    });

    const topSignal = signalCandidates.find((candidate) => candidate.count > 0) || null;

    const nodes: InsightNode[] = [];
    const edges: InsightEdge[] = [];

    const moodScore = clampTo100(currentMoodAvg || 50);
    const moodState = stateFromScore(moodScore);

    nodes.push({
      id: 'node-mood',
      label: 'Mood',
      type: 'Mood',
      color: colorForNode('Mood', moodState),
      state: moodState,
      score: moodScore,
      occurrences: currentWeekCheckIns.length,
      summary: `Average mood ${Math.round(currentMoodAvg || 0)}% this week (${formatDelta(Math.round(moodDelta))} vs last week).`,
      details: [
        `${currentWeekCheckIns.length} check-ins captured this week.`,
        `${lowMoodDays.size} low-mood days detected in the last 7 days.`,
      ],
      suggestion: moodScore < 55
        ? 'Prioritize one small recovery routine before high-load tasks.'
        : 'Keep reinforcing routines that protect your emotional baseline.',
    });

    if (topSignal) {
      const signalScore = clampTo100(topSignal.count * 18 + topSignal.cooccurrence * 14);
      const signalState: NodeState = topSignal.count >= 4 || topSignal.cooccurrence >= 3 ? 'high' : topSignal.count >= 2 ? 'medium' : 'low';

      nodes.push({
        id: topSignal.id,
        label: topSignal.label,
        type: 'Signal',
        color: colorForNode('Signal', signalState),
        state: signalState,
        score: signalScore,
        occurrences: topSignal.count,
        summary: `${topSignal.label} appeared ${topSignal.count} times this week.`,
        details: [
          `${topSignal.cooccurrence} overlap day(s) with low mood in the last 7 days.`,
          'Recurring negative signal detected from weekly behavior patterning.',
        ],
        suggestion: topSignal.suggestion,
      });

      if (topSignal.cooccurrence > 0) {
        const edgeScore = Math.max(1, topSignal.cooccurrence);
        edges.push({
          id: `${topSignal.id}-to-mood`,
          source: topSignal.id,
          target: 'node-mood',
          strength: strengthFromScore(edgeScore),
          score: edgeScore,
          reason: `${topSignal.label} and lower mood appeared together ${topSignal.cooccurrence} time(s) this week.`,
        });
      }
    }

    if (topHabit && topHabit.count > 0) {
      const habitScore = clampTo100(topHabit.count * 16 + Math.max(0, moodDelta) * 2);
      const habitState: NodeState = topHabit.count >= 5 ? 'high' : topHabit.count >= 3 ? 'medium' : 'low';

      nodes.push({
        id: `habit-${topHabit.key}`,
        label: topHabit.label,
        type: 'Habit',
        color: colorForNode('Habit', habitState),
        state: habitState,
        score: habitScore,
        occurrences: topHabit.count,
        summary: `${topHabit.label} recurred ${topHabit.count} time(s) across chat and quest completion data.`,
        details: [
          'Positive recurring action detected from historical behavior signals.',
          `Mood trend this week: ${formatDelta(Math.round(moodDelta))}.`,
        ],
        suggestion: topHabit.suggestion,
      });

      const supportScore = Math.max(1, Math.round(topHabit.count / 2) + (moodDelta > 0 ? 1 : 0));
      edges.push({
        id: `habit-${topHabit.key}-to-mood`,
        source: `habit-${topHabit.key}`,
        target: 'node-mood',
        strength: strengthFromScore(supportScore),
        score: supportScore,
        reason: `${topHabit.label} is associated with mood stabilization in your weekly pattern.`,
      });
    }

    if (focusRoutineCount > 0) {
      const routineScore = clampTo100(focusRoutineCount * 14 + focusCount * 6);
      const routineState = stateFromScore(routineScore);
      nodes.push({
        id: 'routine-focus',
        label: 'Focus Routine',
        type: 'Routine',
        color: colorForNode('Routine', routineState),
        state: routineState,
        score: routineScore,
        occurrences: focusRoutineCount,
        summary: `Focus signal appeared ${focusRoutineCount} time(s) this week across check-ins and chat.`,
        details: [
          `${focusCount} high-focus check-in day(s) this week.`,
          `${chatTopicCounts.focus} focus-related chat mention(s).`,
        ],
        suggestion: 'Protect one uninterrupted deep-work block and review quest progress after.',
      });
    }

    if (activeQuest) {
      const questProgress = Array.isArray(activeQuest.ratings) ? Number(activeQuest.ratings[0] || 0) : 0;
      const questScore = clampTo100(questProgress);
      const questState = stateFromScore(questScore);
      const questLabel = String(activeQuest.goal || 'Active Quest').trim();
      const compactLabel = questLabel.length > 24 ? `${questLabel.slice(0, 21)}...` : questLabel;

      nodes.push({
        id: 'quest-active',
        label: compactLabel,
        type: 'Quest',
        color: colorForNode('Quest', questState),
        state: questState,
        score: questScore,
        occurrences: 1,
        summary: `Current quest progress is ${Math.round(questProgress)}%.`,
        details: [
          `Duration: ${String(activeQuest.duration || 'daily')}.`,
          `Created ${new Date(activeQuest.date).toLocaleDateString()}.`,
        ],
        suggestion: 'Advance this quest right after your strongest focus window each day.',
      });

      if (focusRoutineCount > 0) {
        const focusQuestScore = Math.max(1, Math.round((focusCount + questProgress / 25) / 2));
        edges.push({
          id: 'focus-to-quest',
          source: 'routine-focus',
          target: 'quest-active',
          strength: strengthFromScore(focusQuestScore),
          score: focusQuestScore,
          reason: 'Focused days are reinforcing your active quest completion momentum.',
        });
      }

      if (questProgress >= 40 && currentMoodAvg >= 55) {
        const questMoodScore = Math.max(1, Math.round(questProgress / 25));
        edges.push({
          id: 'quest-to-mood',
          source: 'quest-active',
          target: 'node-mood',
          strength: strengthFromScore(questMoodScore),
          score: questMoodScore,
          reason: 'Quest progress is positively associated with higher mood stability this week.',
        });
      }
    }

    if (nodes.length < 3) {
      const fallbackScore = clampTo100(currentWeekCheckIns.length * 20);
      const fallbackState = stateFromScore(fallbackScore);

      nodes.push({
        id: 'routine-consistency',
        label: 'Consistency Routine',
        type: 'Routine',
        color: colorForNode('Routine', fallbackState),
        state: fallbackState,
        score: fallbackScore,
        occurrences: currentWeekCheckIns.length,
        summary: `You checked in ${currentWeekCheckIns.length} time(s) this week.`,
        details: ['Consistency tracking is now active and will build stronger signals over time.'],
        suggestion: 'Maintain daily pulse entries to unlock richer behavior correlations.',
      });

      edges.push({
        id: 'consistency-to-mood',
        source: 'routine-consistency',
        target: 'node-mood',
        strength: 'weak',
        score: 1,
        reason: 'Consistent check-ins improve behavior signal quality over time.',
      });
    }

    const outerNodes = nodes.slice(0, 5);
    const filteredNodeIds = new Set(outerNodes.map((node) => node.id));
    const filteredEdges = edges.filter((edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target));

    const bestEdge = [...filteredEdges].sort((a, b) => edgeRank(b) - edgeRank(a))[0];

    const highlightMessage = bestEdge
      ? bestEdge.reason
      : 'Collect a few more check-ins this week to unlock stronger behavior intelligence links.';

    let growthPath: GrowthPath | null = null;
    if (filteredNodeIds.has('signal-stress') && Array.from(filteredNodeIds).some((id) => id.startsWith('habit-'))) {
      const habitNode = outerNodes.find((node) => node.id.startsWith('habit-'));
      if (habitNode) {
        growthPath = {
          fromNodeId: 'signal-stress',
          toNodeId: habitNode.id,
          label: 'Current growth path: convert stress spikes into intentional recovery.',
        };
      }
    } else if (filteredNodeIds.has('routine-focus') && filteredNodeIds.has('quest-active')) {
      growthPath = {
        fromNodeId: 'routine-focus',
        toNodeId: 'quest-active',
        label: 'Current growth path: channel focus windows into quest execution.',
      };
    }

    const response: BehaviorMapResponse = {
      center: {
        id: 'you',
        label: 'You',
        level: Number(user.level || 1),
      },
      nodes: outerNodes,
      edges: filteredEdges,
      highlight: {
        edgeId: bestEdge?.id,
        message: highlightMessage,
      },
      growthPath,
      weeklyEvolution: {
        moodDelta: Math.round(moodDelta),
        stressDelta: currentStressDays.size - previousStressDays.size,
        focusDelta: currentFocusDays.size - previousFocusDays.size,
      },
      suggestions: outerNodes
        .map((node) => node.suggestion)
        .filter((value, index, array) => value && array.indexOf(value) === index)
        .slice(0, 3),
      generatedAt: now.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Insight map error:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}
