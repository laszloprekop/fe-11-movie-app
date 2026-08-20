// Pure quiz rules — no React, no fetch. mechanics.md, spelled as code.
import {
  CLUE_COST,
  SESSION_ROUNDS,
  START_SCORE,
  STREAK_BONUS,
  WIN_FLOOR,
  WRONG_GUESS_COST,
} from "./rules"

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

// A session is as long as the catalogue allows, capped by the rules.
export function sessionLength(poolSize: number): number {
  return Math.min(SESSION_ROUNDS, poolSize)
}

// Draw one movie and hand back the shrunken pool — no repeats by
// construction (invariant 4). Chance is a *parameter*: the app passes
// Math.random, a test passes a stub and nails the dice.
export function drawRound(
  pool: number[],
  random: () => number,
): { movieId: number; rest: number[] } {
  const index = Math.floor(random() * pool.length)
  return { movieId: pool[index], rest: pool.toSpliced(index, 1) }
}

// Offer catalogue titles once the writing starts: two normalized characters
// in, at most five out — a clue to the array, never a menu. Goes quiet when
// the draft already is the only match, so a picked title stops suggesting
// itself.
export function suggestTitles(titles: string[], draft: string): string[] {
  const needle = normalize(draft)
  if (needle.length < 2) return []
  const hits = titles.filter((title) => normalize(title).includes(needle))
  if (hits.length === 1 && normalize(hits[0]) === needle) return []
  return hits.slice(0, 5)
}

// The best streak of a finished session, read straight off the score list:
// invariant 1 guarantees a win never pays 0, so "positive score" *is* "won".
export function longestWinStreak(scores: number[]): number {
  let best = 0
  let run = 0
  for (const score of scores) {
    run = score > 0 ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

// The domain's own movie shape — the quiz rules survive an API reshape
// because only the page that fetches knows the DTO. All display strings are
// built here so the ladder is testable without a renderer.
export type QuizMovie = {
  title: string
  year: number
  duration: number
  language: string | null
  genre: string
  actors: string[]
  synopsis: string | null
}

export type Clue = { label: string; value: string; cost: number }

// The ladder is fixed: cheapest information first, the free opener at the
// top, the masked synopsis last — mechanics.md's table as data. The opener
// leaks the year, the length and the last-billed name: casts are seeded in
// billing order, so the tail is a supporting player, never the star.
export function buildClues(movie: QuizMovie): Clue[] {
  const supporting = movie.actors.at(-1) ?? "okänd ensemble"
  return [
    {
      label: "År, speltid & biroll",
      value: `${movie.year} · ${movie.duration} min · ${supporting}`,
      cost: 0,
    },
    { label: "Språk", value: movie.language ?? "okänt språk", cost: CLUE_COST },
    { label: "Genre", value: movie.genre, cost: CLUE_COST },
    {
      label: "Skådespelare",
      value: movie.actors.length > 0 ? movie.actors.join(", ") : "okänd ensemble",
      cost: CLUE_COST,
    },
    {
      label: "Synopsis",
      value: movie.synopsis ? maskSynopsis(movie.synopsis, movie.title) : "synopsis saknas",
      cost: CLUE_COST,
    },
  ]
}

// What a finished round knows about itself — facts, not conclusions.
export type RoundFacts = {
  won: boolean
  cluesRevealed: number // counts the free opener, hence the -1 below
  wrongGuesses: number
}

// The score is computed from the facts every time it is needed — measured,
// not stored. The floor applies to the base; the bonus lands on top of the
// floored value. streak counts the wins *before* this one: the bonus rewards
// being on a streak, not starting one.
export function roundScore(facts: RoundFacts, streak: number): number {
  if (!facts.won) return 0
  const base =
    START_SCORE -
    (facts.cluesRevealed - 1) * CLUE_COST -
    facts.wrongGuesses * WRONG_GUESS_COST
  return Math.max(WIN_FLOOR, base) + STREAK_BONUS * streak
}
