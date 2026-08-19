import { describe, expect, it } from "vitest"
import { isCorrectGuess, normalize } from "./quiz"

describe("normalize", () => {
  it("lowercases, trims and collapses whitespace", () => {
    expect(normalize("  The   Seventh   Seal ")).toBe("the seventh seal")
  })

  it("drops punctuation but keeps å, ä and ö", () => {
    expect(normalize("Så som i himmelen!")).toBe("så som i himmelen")
  })

  // Invariant 6: a normalized string is a fixed point — running the pipe
  // again changes nothing, so it is safe to normalize defensively anywhere.
  it("is idempotent — normalizing twice equals normalizing once", () => {
    const once = normalize("Léon: The Professional")
    expect(normalize(once)).toBe(once)
  })
})

describe("isCorrectGuess", () => {
  it("matches regardless of case, spacing and punctuation", () => {
    expect(isCorrectGuess("  schindlers list ", "Schindler's List")).toBe(true)
  })

  it("rejects a near miss — no fuzzy matching in v1", () => {
    expect(isCorrectGuess("Shawshank", "The Shawshank Redemption")).toBe(false)
  })

  it("never accepts an empty guess", () => {
    expect(isCorrectGuess("   ", "Her")).toBe(false)
  })
})
