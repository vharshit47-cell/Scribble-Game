import { customAlphabet } from "nanoid";

// Unambiguous uppercase alphabet (no 0/O, 1/I) for room codes players type by hand.
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export function generateRoomCode(): string {
  return nanoid();
}
