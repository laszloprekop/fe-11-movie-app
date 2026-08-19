import { describe, expect, it } from "vitest"
import { isCorrectGuess, maskSynopsis, normalize } from "./quiz"

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

describe("maskSynopsis", () => {
  it("masks every occurrence of a title word, whatever its case", () => {
    expect(
      maskSynopsis("Her voice is everywhere; her name is Samantha.", "Her"),
    ).toBe("███ voice is everywhere; ███ name is Samantha.")
  })

  it("masks common title words too — a flood of The is by design", () => {
    expect(
      maskSynopsis("The banker and the fence.", "The Shawshank Redemption"),
    ).toBe("███ banker and ███ fence.")
  })

  it("leaves title words alone inside longer words", () => {
    expect(maskSynopsis("Mothers and heroes are safe.", "Her")).toBe(
      "Mothers and heroes are safe.",
    )
  })

  it("masks å/ä/ö words — regexes with \\b cannot", () => {
    expect(maskSynopsis("Ett år går fort.", "År ut och år in")).toBe(
      "Ett ███ går fort.",
    )
  })

  // Invariant 5: no normalized word of the title survives in the masked text.
  it("invariant: the masked synopsis never contains a title word", () => {
    const title = "The Shawshank Redemption"
    const masked = maskSynopsis(
      "The redemption of the banker Andy, the quiet one.",
      title,
    )
    const survivors = new Set(normalize(masked).split(" "))
    for (const word of normalize(title).split(" ")) {
      expect(survivors.has(word)).toBe(false)
    }
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
