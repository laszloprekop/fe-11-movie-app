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

// Exact match after normalization — no fuzzy matching in v1 (mechanics.md).
export function isCorrectGuess(guess: string, title: string): boolean {
  const normalized = normalize(guess)
  return normalized !== "" && normalized === normalize(title)
}
