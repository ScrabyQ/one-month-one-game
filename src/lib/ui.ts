export function getInitials(value: string, fallback = "OM"): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return fallback;
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
