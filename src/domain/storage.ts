// One pair of functions owns persistence — mechanics.md: best session total
// and best streak, nothing else. Storage can be missing (private mode, the
// node test runner) or hold garbage; both read as "no record yet".
const KEY = "gissa-filmen.best"

export type Best = { total: number; streak: number }

const NO_RECORD: Best = { total: 0, streak: 0 }

export function readBest(): Best {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return NO_RECORD
    const parsed = JSON.parse(raw) as Partial<Best>
    return { total: parsed.total ?? 0, streak: parsed.streak ?? 0 }
  } catch {
    return NO_RECORD
  }
}

export function writeBest(next: Best): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // A full or forbidden storage loses the record, never the game.
  }
}
