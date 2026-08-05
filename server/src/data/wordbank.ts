import { Difficulty } from "../types/game.types";

/**
 * Word bank organized by category, then merged per difficulty.
 * To add a new pack (Anime, Space, Programming, etc.) just add a new
 * array below and register it in CATEGORY_MAP for the difficulty
 * tier(s) it belongs to — no game-logic changes required.
 */

const EASY_ANIMALS = [
  "dog", "cat", "fish", "bird", "cow", "pig", "duck", "frog", "bear", "lion",
  "tiger", "horse", "sheep", "goat", "mouse", "rabbit", "snake", "spider",
  "bee", "ant", "owl", "fox", "deer", "crab", "shark", "whale", "snail",
  "turtle", "chicken", "elephant",
];

const EASY_OBJECTS = [
  "chair", "table", "door", "window", "shoe", "hat", "cup", "spoon", "fork",
  "knife", "clock", "phone", "book", "pencil", "ball", "box", "key", "lamp",
  "bed", "bag", "shirt", "sock", "ring", "kite", "drum", "flag", "candle",
  "mirror", "umbrella", "brush",
];

const EASY_NATURE = [
  "sun", "moon", "star", "tree", "flower", "leaf", "cloud", "rain", "snow",
  "river", "mountain", "beach", "island", "fire", "rock", "grass", "rainbow",
  "wave", "volcano", "desert",
];

const EASY_FOOD = [
  "pizza", "burger", "apple", "banana", "cake", "bread", "egg", "milk",
  "cheese", "ice cream", "cookie", "candy", "orange", "grape", "lemon",
  "carrot", "corn", "donut", "sandwich", "taco",
];

const MEDIUM_ACTIONS = [
  "running", "jumping", "sleeping", "laughing", "crying", "dancing",
  "swimming", "flying", "climbing", "singing", "cooking", "painting",
  "reading", "writing", "fishing", "skating", "boxing", "juggling",
  "sneezing", "yawning", "whistling", "diving", "surfing", "camping",
];

const MEDIUM_PROFESSIONS = [
  "doctor", "teacher", "firefighter", "police officer", "chef", "pilot",
  "astronaut", "farmer", "artist", "musician", "dentist", "lawyer",
  "scientist", "photographer", "carpenter", "electrician", "plumber",
  "mechanic", "librarian", "waiter",
];

const MEDIUM_PLACES = [
  "school", "hospital", "airport", "restaurant", "library", "museum",
  "beach", "zoo", "castle", "farm", "stadium", "bakery", "church",
  "supermarket", "playground", "lighthouse", "bridge", "tunnel",
  "waterfall", "cave",
];

const MEDIUM_SPORTS = [
  "soccer", "basketball", "tennis", "baseball", "golf", "hockey",
  "volleyball", "cricket", "boxing", "wrestling", "skiing", "archery",
  "bowling", "cycling", "rowing", "skateboarding", "badminton", "rugby",
];

const HARD_ABSTRACT = [
  "freedom", "gravity", "loneliness", "jealousy", "curiosity", "nostalgia",
  "chaos", "harmony", "infinity", "silence", "friendship", "ambition",
  "mystery", "justice", "courage", "wisdom", "temptation", "destiny",
];

const HARD_MOVIES_GENRES = [
  "science fiction", "documentary", "time travel", "superhero", "musical",
  "horror movie", "romantic comedy", "animation", "mystery novel",
  "fairy tale",
];

const HARD_SCIENCE = [
  "photosynthesis", "gravity", "evolution", "black hole", "DNA",
  "electricity", "magnetism", "ecosystem", "atom", "galaxy",
  "solar eclipse", "volcano eruption", "earthquake", "avalanche",
  "hurricane", "greenhouse effect", "food chain", "metamorphosis",
];

const HARD_IDIOMS = [
  "raining cats and dogs", "break the ice", "piece of cake",
  "spill the beans", "under the weather", "once in a blue moon",
  "hit the sack", "let the cat out of the bag", "cost an arm and a leg",
  "on thin ice",
];

interface WordEntry {
  word: string;
  difficulty: Difficulty;
}

function tag(words: string[], difficulty: Difficulty): WordEntry[] {
  return words.map((word) => ({ word, difficulty }));
}

export const WORD_BANK: WordEntry[] = [
  ...tag(EASY_ANIMALS, "easy"),
  ...tag(EASY_OBJECTS, "easy"),
  ...tag(EASY_NATURE, "easy"),
  ...tag(EASY_FOOD, "easy"),
  ...tag(MEDIUM_ACTIONS, "medium"),
  ...tag(MEDIUM_PROFESSIONS, "medium"),
  ...tag(MEDIUM_PLACES, "medium"),
  ...tag(MEDIUM_SPORTS, "medium"),
  ...tag(HARD_ABSTRACT, "hard"),
  ...tag(HARD_MOVIES_GENRES, "hard"),
  ...tag(HARD_SCIENCE, "hard"),
  ...tag(HARD_IDIOMS, "hard"),
];

// De-duplicate by lowercase word just in case a pack overlaps another.
const seen = new Set<string>();
export const ALL_WORDS: WordEntry[] = WORD_BANK.filter((entry) => {
  const key = entry.word.toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

export function wordsForDifficulty(difficulty: Difficulty): string[] {
  return ALL_WORDS.filter((w) => w.difficulty === difficulty).map(
    (w) => w.word
  );
}

/**
 * NOTE ON SCALE: this file ships a curated ~250-word bank across 12
 * categories, organized so it is trivial to grow past 2000+ words —
 * add more category arrays (Anime, Countries, Programming, Space, ...)
 * and tag() them into ALL_WORDS. The selection/no-repeat logic in
 * GameManager does not care how large the bank is.
 */
