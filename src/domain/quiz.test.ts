import { describe, expect, it } from "vitest"
import { buildClues, isCorrectGuess, maskSynopsis, normalize, roundScore } from "./quiz"

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

describe("roundScore", () => {
  // Invariant 3: the perfect round is worth exactly the opening score.
  it("pays exactly START_SCORE for a flawless free-clue win", () => {
    expect(roundScore({ won: true, cluesRevealed: 1, wrongGuesses: 0 }, 0)).toBe(1000)
  })

  it("subtracts per paid clue and per wrong guess", () => {
    // two paid clues and one wrong guess: 1000 − 2·150 − 100
    expect(roundScore({ won: true, cluesRevealed: 3, wrongGuesses: 1 }, 0)).toBe(600)
  })

  // Invariants 1 and 2: a win never pays under the floor, never negative.
  it("never pays a win less than WIN_FLOOR", () => {
    expect(roundScore({ won: true, cluesRevealed: 5, wrongGuesses: 9 }, 0)).toBe(100)
  })

  it("adds the streak bonus on top of the floored base", () => {
    expect(roundScore({ won: true, cluesRevealed: 5, wrongGuesses: 9 }, 3)).toBe(250)
  })

  // Invariant 7, the paying half — the streak reset lives with session state.
  it("pays zero for giving up, whatever the streak", () => {
    expect(roundScore({ won: false, cluesRevealed: 5, wrongGuesses: 2 }, 4)).toBe(0)
  })
})

describe("buildClues", () => {
  const movie = {
    title: "Her",
    year: 2013,
    duration: 126,
    language: "English",
    genre: "Drama, Romantik",
    actors: ["Joaquin Phoenix", "Scarlett Johansson"],
    synopsis: "Her operating system falls in love.",
  }

  it("lays the fixed ladder: free opener first, synopsis last", () => {
    const clues = buildClues(movie)
    expect(clues.map((c) => c.label)).toEqual([
      "Speltid & språk",
      "År",
      "Genre",
      "Skådespelare",
      "Synopsis",
    ])
    expect(clues.map((c) => c.cost)).toEqual([0, 150, 150, 150, 150])
  })

  it("combines duration and language into the free clue", () => {
    expect(buildClues(movie)[0].value).toBe("126 min · English")
  })

  it("serves the synopsis masked — Step 39 cashing in", () => {
    expect(buildClues(movie)[4].value).toBe(
      "███ operating system falls in love.",
    )
  })

  it("names the nulls in Swedish instead of crashing on them", () => {
    const bare = { ...movie, language: null, synopsis: null, actors: [] }
    const clues = buildClues(bare)
    expect(clues[0].value).toBe("126 min · okänt språk")
    expect(clues[3].value).toBe("okänd ensemble")
    expect(clues[4].value).toBe("synopsis saknas")
  })
})
