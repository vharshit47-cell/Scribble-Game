/** Points for guessers by the order they guessed correctly (1st, 2nd, ...). */
const GUESSER_POINTS = [100, 80, 60, 40, 20];
const GUESSER_FALLBACK_POINTS = 10; // for 6th+ correct guesser

export function pointsForGuessOrder(orderIndex: number): number {
  // orderIndex is 0-based
  return GUESSER_POINTS[orderIndex] ?? GUESSER_FALLBACK_POINTS;
}

/**
 * Drawer earns points proportional to how many non-drawing players
 * guessed correctly: (correctGuessers / totalGuessers) * 100, rounded.
 */
export function drawerPoints(
  correctGuessers: number,
  totalGuessers: number
): number {
  if (totalGuessers <= 0) return 0;
  return Math.round((correctGuessers / totalGuessers) * 100);
}
