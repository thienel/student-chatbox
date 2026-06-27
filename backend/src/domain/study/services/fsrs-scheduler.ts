/**
 * FSRS-4.5 spaced-repetition scheduler (pure domain logic).
 *
 * Uses the default pre-trained weights, which work well without per-user
 * optimisation. Target retention is fixed at 90%, so the next interval in days
 * equals the card's stability. Swapping in FSRS optimiser weights later only
 * touches `DEFAULT_WEIGHTS`; replacing the algorithm only touches this file.
 */

export type Rating = 1 | 2 | 3 | 4; // again | hard | good | easy

const W = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0589, 1.533,
  0.1544, 1.0071, 1.9395, 0.11, 0.29, 2.27, 0.25, 2.9898, 0.51, 0.43,
];

const DECAY = -0.5;
const FACTOR = 19 / 81; // ≈ 0.2343
const MIN_STABILITY = 0.1;
const MAX_INTERVAL_DAYS = 36500;

export interface CardMemoryState {
  stability: number;
  difficulty: number;
  reps: number;
}

export interface ScheduleResult {
  stability: number;
  difficulty: number;
  interval: number; // whole days until next review
  nextReviewAt: Date;
}

export class FsrsScheduler {
  /**
   * Schedule the next review for a card given its prior state (null for a brand
   * new card), the rating, and how many days have elapsed since the last review.
   */
  schedule(
    state: CardMemoryState | null,
    rating: Rating,
    now: Date = new Date(),
    elapsedDays = 0,
  ): ScheduleResult {
    let stability: number;
    let difficulty: number;

    if (!state || state.reps === 0) {
      stability = Math.max(W[rating - 1], MIN_STABILITY);
      difficulty = this.clamp(W[4] - Math.exp(W[5] * (rating - 1)) + 1, 1, 10);
    } else {
      const retrievability = this.retrievability(elapsedDays, state.stability);
      difficulty = this.nextDifficulty(state.difficulty, rating);
      stability =
        rating === 1
          ? this.nextForgetStability(difficulty, state.stability, retrievability)
          : this.nextRecallStability(difficulty, state.stability, retrievability, rating);
    }

    stability = this.clamp(stability, MIN_STABILITY, MAX_INTERVAL_DAYS);
    const interval = Math.max(1, Math.round(this.clamp(stability, 1, MAX_INTERVAL_DAYS)));
    const nextReviewAt = new Date(now.getTime() + interval * 86_400_000);

    return { stability, difficulty, interval, nextReviewAt };
  }

  /** Probability of recall after `elapsedDays` given current stability. */
  retrievability(elapsedDays: number, stability: number): number {
    return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY);
  }

  private nextDifficulty(d: number, rating: Rating): number {
    const delta = d - W[6] * (rating - 3);
    const initialGood = W[4] - Math.exp(W[5] * (3 - 1)) + 1;
    const meanReverted = W[7] * initialGood + (1 - W[7]) * delta;
    return this.clamp(meanReverted, 1, 10);
  }

  private nextRecallStability(d: number, s: number, r: number, rating: 2 | 3 | 4): number {
    const hardPenalty = rating === 2 ? W[15] : 1;
    const easyBonus = rating === 4 ? W[16] : 1;
    return (
      s *
      (Math.exp(W[8]) *
        (11 - d) *
        Math.pow(s, -W[9]) *
        (Math.exp(W[10] * (1 - r)) - 1) *
        hardPenalty *
        easyBonus +
        1)
    );
  }

  private nextForgetStability(d: number, s: number, r: number): number {
    return (
      W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r))
    );
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
