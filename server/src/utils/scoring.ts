/**
 * Levenshtein distance calculation for typo tolerance / close guess detection.
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Checks if a guess is close to the secret word (e.g. 1 or 2 letter typo).
 */
export function isCloseGuess(guess: string, word: string): boolean {
  const g = guess.trim().toLowerCase();
  const w = word.trim().toLowerCase();
  if (g === w || !g || !w) return false;
  const dist = levenshteinDistance(g, w);
  const maxAllowedDist = w.length > 5 ? 2 : 1;
  return dist > 0 && dist <= maxAllowedDist;
}

const ORDER_MULTIPLIERS = [1.0, 0.9, 0.8, 0.7];
const HINT_PENALTIES = [1.0, 0.9, 0.8, 0.7];

export interface GuessScoreParams {
  timeRemainingRatio: number; // 0.0 to 1.0
  orderIndex: number; // 0-based
  hintsRevealedCount: number; // number of hints revealed
}

/**
 * Calculates guesser points dynamically based on speed, accuracy (hints used), and order.
 */
export function calculateGuesserPoints({
  timeRemainingRatio,
  orderIndex,
  hintsRevealedCount,
}: GuessScoreParams): number {
  const basePoints = 300;
  const speedBonus = Math.round(200 * Math.max(0, Math.min(1, timeRemainingRatio)));
  const orderMultiplier = ORDER_MULTIPLIERS[orderIndex] ?? 0.6;
  const hintMultiplier = HINT_PENALTIES[hintsRevealedCount] ?? 0.6;

  const rawScore = (basePoints + speedBonus) * orderMultiplier * hintMultiplier;
  return Math.max(50, Math.round(rawScore));
}

/** Legacy wrapper for order-only fallback */
export function pointsForGuessOrder(orderIndex: number): number {
  return calculateGuesserPoints({
    timeRemainingRatio: 0.5,
    orderIndex,
    hintsRevealedCount: 0,
  });
}

/**
 * Drawer earns points based on ratio of players who guessed correctly
 * as well as average speed.
 */
export function drawerPoints(
  correctGuessers: number,
  totalGuessers: number,
  avgSpeedRatio: number = 0.5
): number {
  if (totalGuessers <= 0) return 0;
  const accuracyRatio = correctGuessers / totalGuessers;
  const speedMultiplier = 1 + Math.max(0, Math.min(1, avgSpeedRatio)) * 0.5;
  return Math.round(accuracyRatio * 200 * speedMultiplier);
}

