import { describe, expect, it } from "vitest"
import { buildClues, drawRound, isCorrectGuess, longestWinStreak, maskSynopsis, normalize, roundScore, sessionLength, suggestTitles } from "./quiz"

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
      "År, speltid & biroll",
      "Språk & genre",
      "Skådespelare",
      "Synopsis",
    ])
    expect(clues.map((c) => c.cost)).toEqual([0, 150, 150, 150])
  })

  it("opens with year, length and the last-billed name", () => {
    expect(buildClues(movie)[0].value).toBe("2013 · 126 min · Scarlett Johansson")
  })

  it("sells language and genre together on the first paid rung", () => {
    expect(buildClues(movie)[1].value).toBe("English · Drama, Romantik")
  })

  it("serves the synopsis masked — Step 39 cashing in", () => {
    expect(buildClues(movie)[3].value).toBe(
      "███ operating system falls in love.",
    )
  })

  it("names the nulls in Swedish instead of crashing on them", () => {
    const bare = { ...movie, language: null, synopsis: null, actors: [] }
    const clues = buildClues(bare)
    expect(clues[0].value).toBe("2013 · 126 min · okänd ensemble")
    expect(clues[1].value).toBe("okänt språk · Drama, Romantik")
    expect(clues[2].value).toBe("okänd ensemble")
    expect(clues[3].value).toBe("synopsis saknas")
  })
})

describe("the session pool", () => {
  it("caps a big catalogue at SESSION_ROUNDS", () => {
    expect(sessionLength(20)).toBe(5)
  })

  it("shrinks the session to a small catalogue", () => {
    expect(sessionLength(3)).toBe(3)
  })

  it("draws the movie the dice point at and removes it from the pool", () => {
    const { movieId, rest } = drawRound([10, 20, 30], () => 0.5)
    expect(movieId).toBe(20)
    expect(rest).toEqual([10, 30])
  })

  // Invariant 4: a movie appears at most once per session — the pool only
  // ever shrinks, so a full session with real dice never repeats.
  it("invariant: a full session never repeats a movie", () => {
    let pool = [1, 2, 3, 4, 5, 6]
    const seen: number[] = []
    for (let round = 0; round < sessionLength(pool.length); round++) {
      const draw = drawRound(pool, Math.random)
      seen.push(draw.movieId)
      pool = draw.rest
    }
    expect(new Set(seen).size).toBe(seen.length)
  })
})

describe("suggestTitles", () => {
  const titles = [
    "Forrest Gump",
    "The Shawshank Redemption",
    "Lost in Translation",
    "Groundhog Day",
    "March of the Penguins",
    "Her",
  ]

  it("stays quiet under two typed characters", () => {
    expect(suggestTitles(titles, "s")).toEqual([])
    expect(suggestTitles(titles, "  s ")).toEqual([])
  })

  it("matches through normalize — case and punctuation blind", () => {
    expect(suggestTitles(titles, "SHAW")).toEqual(["The Shawshank Redemption"])
  })

  it("caps the offer at five", () => {
    const many = ["aa 1", "aa 2", "aa 3", "aa 4", "aa 5", "aa 6"]
    expect(suggestTitles(many, "aa")).toHaveLength(5)
  })

  it("goes quiet when the draft already is the only match", () => {
    expect(suggestTitles(titles, "Her")).toEqual([])
  })
})

describe("longestWinStreak", () => {
  it("reads the wins straight off the score list — zero means lost", () => {
    expect(longestWinStreak([600, 550, 0, 900, 1050])).toBe(2)
  })

  it("finds the streak wherever it sits", () => {
    expect(longestWinStreak([0, 100, 250, 400, 0])).toBe(3)
  })

  it("scores an all-loss session as zero", () => {
    expect(longestWinStreak([0, 0, 0])).toBe(0)
  })
})
