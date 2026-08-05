/**
 * Builds a masked version of the word, revealing letters progressively
 * based on elapsed-time percentage. Spaces are always shown so multi-word
 * answers ("ice cream") read naturally.
 */
export function maskWord(word: string, revealPercent: number): string {
  const letters = word.split("");
  const revealableIndices = letters
    .map((c, i) => (c === " " ? -1 : i))
    .filter((i) => i !== -1);

  const revealCount = Math.floor(revealableIndices.length * revealPercent);

  // Deterministic reveal order per word (stable across calls) so hints
  // only ever add letters, never swap which ones are shown.
  const revealOrder = deterministicOrder(word, revealableIndices);
  const revealedSet = new Set(revealOrder.slice(0, revealCount));

  return letters
    .map((c, i) => {
      if (c === " ") return " ";
      return revealedSet.has(i) ? c : "_";
    })
    .join(" ");
}

function deterministicOrder(seed: string, indices: number[]): number[] {
  // Simple seeded shuffle so the same word always reveals letters in the
  // same order within a turn, but different words reveal differently.
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const arr = [...indices];
  for (let i = arr.length - 1; i > 0; i--) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    const j = hash % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Hint reveal schedule as fractions of elapsed turn time. */
export const HINT_SCHEDULE = [0.2, 0.4, 0.6];
