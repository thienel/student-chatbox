import { StudyStats, StudySettings } from '../../../domain/study/repositories/study.repository.interface';
import { ictDayDiff } from '../../../shared/utils/ict-time';

export const DEFAULT_NEW_CARDS_PER_DAY = 20;

export function defaultStats(userId: string): StudyStats {
  return {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    totalSessions: 0,
    totalCardsReviewed: 0,
    lastStudiedDate: null,
    newCardsStudiedToday: 0,
    newCardsTodayDate: null,
  };
}

/** New cards still allowed today, given the per-day limit and today's ICT date. */
export function remainingNewAllowance(
  stats: StudyStats | null,
  settings: StudySettings | null,
  todayIct: string,
): number {
  const limit = settings?.newCardsPerDay ?? DEFAULT_NEW_CARDS_PER_DAY;
  if (!stats || stats.newCardsTodayDate !== todayIct) return limit;
  return Math.max(0, limit - stats.newCardsStudiedToday);
}

/** Account a single card review; rolls the daily new-card counter at ICT midnight. */
export function applyReview(stats: StudyStats, wasNew: boolean, todayIct: string): StudyStats {
  const s = { ...stats };
  if (wasNew) {
    if (s.newCardsTodayDate !== todayIct) {
      s.newCardsTodayDate = todayIct;
      s.newCardsStudiedToday = 0;
    }
    s.newCardsStudiedToday += 1;
  }
  s.totalCardsReviewed += 1;
  return s;
}

/** Account a completed session, advancing the consecutive-day streak (ICT). */
export function applySessionCompletion(stats: StudyStats, todayIct: string): StudyStats {
  const s = { ...stats };
  s.totalSessions += 1;
  if (s.lastStudiedDate !== todayIct) {
    if (s.lastStudiedDate && ictDayDiff(todayIct, s.lastStudiedDate) === 1) {
      s.currentStreak += 1;
    } else {
      s.currentStreak = 1;
    }
    s.longestStreak = Math.max(s.longestStreak, s.currentStreak);
    s.lastStudiedDate = todayIct;
  }
  return s;
}
