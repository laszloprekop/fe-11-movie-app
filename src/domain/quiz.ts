// Pure quiz rules — no React, no fetch. mechanics.md, spelled as code.

// One normalization for both sides of every comparison: lowercase, drop
// punctuation, collapse whitespace. \p{L} means "any letter in any script",
// so å, ä and ö survive — Swedish titles are typed in Swedish.
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
}

// The mask is fixed-width on purpose: ███ leaks nothing, not even length.
export const MASK = "███"

// Blank every title word in the synopsis so the last clue cannot contain the
// answer. Split on runs of non-letters (keeping them): words get compared
// through normalize, punctuation and spacing survive untouched.
export function maskSynopsis(synopsis: string, title: string): string {
  const titleWords = new Set(normalize(title).split(" "))
  return synopsis
    .split(/([^\p{L}\p{N}]+)/u)
    .map((part) => (titleWords.has(normalize(part)) ? MASK : part))
    .join("")
}

// Exact match after normalization — no fuzzy matching in v1 (mechanics.md).
export function isCorrectGuess(guess: string, title: string): boolean {
  const normalized = normalize(guess)
  return normalized !== "" && normalized === normalize(title)
}
