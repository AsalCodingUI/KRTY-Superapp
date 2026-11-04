/**
 * The letters on an avatar: the first letter of the first two words
 * ("Rico Asal" → "RA"), or the first two letters of a one-word name
 * ("Kretya" → "KR"), uppercase. `fallback` when there is no name.
 */
export function initials(
  name: string | null | undefined,
  fallback = "?",
): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return fallback
  const letters =
    words.length === 1
      ? Array.from(words[0]).slice(0, 2).join("")
      : Array.from(words[0])[0] + Array.from(words[1])[0]
  return letters.toUpperCase()
}
