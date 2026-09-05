export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "?";
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return (first + last).toUpperCase();
}

const AVATAR_PALETTES = [
  { bg: "var(--color-brand-100)", text: "var(--color-brand-700)" },
  { bg: "var(--color-brand-50)", text: "var(--color-brand-600)" },
  { bg: "var(--color-surface)", text: "var(--color-purple)" },
  { bg: "var(--color-brand-100)", text: "var(--color-navy-800)" },
  { bg: "var(--color-surface)", text: "var(--color-text-primary)" },
  { bg: "var(--color-brand-50)", text: "var(--color-brand-700)" },
];

export function getAvatarColor(identifier: string): { bg: string; text: string } {
  const str = identifier.trim() || "?";
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}
