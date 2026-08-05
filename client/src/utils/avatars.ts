export const AVATARS = [
  "🦊", "🐼", "🐸", "🐵", "🐨", "🐯", "🦁", "🐶", "🐱", "🐰",
  "🐻", "🐷", "🐮", "🐔", "🦄", "🐙", "🐢", "🦖", "🐳", "🐝",
  "🦉", "🐺", "🐧", "🦈", "🦋", "🐲", "👾", "🤖", "👻", "🎃",
  "🥷", "🧙",
] as const;

export function randomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}
