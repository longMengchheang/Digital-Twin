import User from '@/lib/models/User';
import { applyXPDelta, normalizeProgressState, ProgressState } from '@/lib/progression';

export async function adjustUserXP(userId: string, deltaXP: number): Promise<ProgressState | null> {
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  const next = applyXPDelta(
    normalizeProgressState({
      level: user.level,
      currentXP: user.currentXP,
      requiredXP: user.requiredXP,
    }),
    deltaXP,
  );

  user.level = next.level;
  user.currentXP = next.currentXP;
  user.requiredXP = next.requiredXP;
  await user.save();

  return next;
}
