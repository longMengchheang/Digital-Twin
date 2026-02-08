import { getNeonDb } from '@/lib/neon/db';
import { featureSignals } from '@/lib/neon/schema';
import { normalizeSignalType } from '@/lib/chat-signals';

type FeatureSignalSource =
  | 'daily_pulse'
  | 'quest_create'
  | 'quest_progress'
  | 'quest_completion'
  | 'quest_log'
  | 'companion';

interface FeatureSignalInput {
  signalType: string;
  intensity: number;
  confidence: number;
}

interface RecordFeatureSignalsArgs {
  userId: string;
  source: FeatureSignalSource;
  sourceRef?: string;
  createdAt?: Date;
  signals: FeatureSignalInput[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sanitizeSignals(signals: FeatureSignalInput[]) {
  const rows: Array<{ signalType: string; intensity: number; confidence: number }> = [];

  for (const signal of signals) {
    const signalType = normalizeSignalType(signal.signalType);
    if (!signalType) {
      continue;
    }

    const intensity = Math.round(clamp(Number(signal.intensity || 0), 1, 5));
    const confidence = Number(clamp(Number(signal.confidence || 0), 0, 1).toFixed(3));
    rows.push({ signalType, intensity, confidence });
  }

  return rows;
}

export async function recordFeatureSignals(args: RecordFeatureSignalsArgs): Promise<void> {
  const db = await getNeonDb();
  const createdAt = args.createdAt || new Date();
  const sanitized = sanitizeSignals(args.signals);

  if (!sanitized.length) {
    return;
  }

  await db.insert(featureSignals).values(
    sanitized.map((signal) => ({
      userId: args.userId,
      source: args.source,
      sourceRef: args.sourceRef || null,
      signalType: signal.signalType,
      intensity: signal.intensity,
      confidence: signal.confidence,
      createdAt,
      updatedAt: createdAt,
    })),
  );
}
