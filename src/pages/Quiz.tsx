import { useReducer, useState, type SubmitEvent } from "react"
import { getMovieDetails, getMovies } from "../api/movies"
import type { MovieDetailDto } from "../api/types"
import ErrorBanner from "../components/ErrorBanner"
import {
  buildClues,
  drawRound,
  isCorrectGuess,
  roundScore,
  type QuizMovie,
} from "../domain/quiz"

// The page is where API words become domain words — only this mapper knows
// the DTO, so the quiz rules survive an API reshape untouched.
function toQuizMovie(details: MovieDetailDto): QuizMovie {
  return {
    title: details.title,
    year: details.year,
    duration: details.duration,
    language: details.language,
    genre: details.genre,
    actors: details.actors.map((actor) => actor.name),
    synopsis: details.synopsis,
  }
}

type QuizState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "empty" }
  | { phase: "error"; error: unknown }
  | {
      phase: "playing"
      movie: QuizMovie
      pool: number[]
      revealed: number
      wrongGuesses: number
      outcome: "open" | "won" | "gaveUp"
    }

type QuizAction =
  | { type: "loadStarted" }
  | { type: "loadFailed"; error: unknown }
  | { type: "poolEmpty" }
  | { type: "roundStarted"; movie: QuizMovie; pool: number[] }
  | { type: "clueBought" }
  | { type: "guessed"; guess: string }
  | { type: "gaveUp" }

// The reducer stores facts; every rule it needs lives in domain/quiz.ts.
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "loadStarted":
      return { phase: "loading" }
    case "loadFailed":
      return { phase: "error", error: action.error }
    case "poolEmpty":
      return { phase: "empty" }
    case "roundStarted":
      return {
        phase: "playing",
        movie: action.movie,
        pool: action.pool,
        revealed: 1,
        wrongGuesses: 0,
        outcome: "open",
      }
    case "clueBought":
      if (state.phase !== "playing" || state.outcome !== "open") return state
      return {
        ...state,
        revealed: Math.min(state.revealed + 1, buildClues(state.movie).length),
      }
    case "guessed": {
      if (state.phase !== "playing" || state.outcome !== "open") return state
      if (isCorrectGuess(action.guess, state.movie.title))
        return { ...state, outcome: "won" }
      return { ...state, wrongGuesses: state.wrongGuesses + 1 }
    }
    case "gaveUp":
      if (state.phase !== "playing" || state.outcome !== "open") return state
      return { ...state, outcome: "gaveUp" }
  }
}

export default function Quiz() {
  const [state, dispatch] = useReducer(quizReducer, { phase: "idle" })
  const [draft, setDraft] = useState("")

  function handleGuess(e: SubmitEvent) {
    e.preventDefault()
    dispatch({ type: "guessed", guess: draft })
    setDraft("")
  }

  // Every fetch here answers a click, so no useEffect: effects are for
  // fetch-on-render, handlers are for fetch-on-event.
  async function startSession() {
    dispatch({ type: "loadStarted" })
    try {
      const movies = await getMovies()
      if (movies.length === 0) {
        dispatch({ type: "poolEmpty" })
        return
      }
      const { movieId, rest } = drawRound(
        movies.map((movie) => movie.id),
        Math.random,
      )
      const details = await getMovieDetails(movieId)
      dispatch({ type: "roundStarted", movie: toQuizMovie(details), pool: rest })
    } catch (error) {
      dispatch({ type: "loadFailed", error })
    }
  }

  if (state.phase === "idle" || state.phase === "loading") {
    return (
      <>
        <h1 className="text-2xl font-bold">Gissa filmen</h1>
        <p className="mt-2 max-w-xl">
          Fem omgångar, en film per omgång. Första ledtråden är gratis — varje
          ny kostar poäng, varje fel gissning också.
        </p>
        <button className="mt-4" onClick={startSession} disabled={state.phase === "loading"}>
          {state.phase === "loading" ? "Blandar filmerna…" : "Börja kvällens fem"}
        </button>
      </>
    )
  }

  if (state.phase === "empty") {
    return (
      <>
        <h1 className="text-2xl font-bold">Gissa filmen</h1>
        <p className="mt-2">Katalogen är tom — lägg till filmer, kom sen tillbaka.</p>
      </>
    )
  }

  if (state.phase === "error") {
    return (
      <>
        <h1 className="text-2xl font-bold">Gissa filmen</h1>
        <div className="mt-2 max-w-xl">
          <ErrorBanner error={state.error} />
        </div>
      </>
    )
  }

  const clues = buildClues(state.movie)
  // The live prize is derived, never stored: "what a correct guess pays right
  // now" is a question for roundScore, asked on every render.
  const prize = roundScore(
    { won: true, cluesRevealed: state.revealed, wrongGuesses: state.wrongGuesses },
    0,
  )

  return (
    <>
      <h1 className="text-2xl font-bold">Gissa filmen</h1>
      <p className="mt-2">
        Vinst just nu: <strong>{prize} poäng</strong>
        {state.wrongGuesses > 0 && <> · Fel gissningar: {state.wrongGuesses}</>}
      </p>
      <ol className="mt-4 grid max-w-xl gap-3">
        {clues.slice(0, state.revealed).map((clue) => (
          <li key={clue.label} className="border p-3">
            <p className="font-bold">{clue.label}</p>
            <p>{clue.value}</p>
          </li>
        ))}
      </ol>
      {state.outcome === "open" ? (
        <>
          {state.revealed < clues.length && (
            <button className="mt-4" onClick={() => dispatch({ type: "clueBought" })}>
              Köp nästa ledtråd (−{clues[state.revealed].cost} poäng)
            </button>
          )}
          <form onSubmit={handleGuess} className="mt-4 flex max-w-xl gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Vilken film är det?"
              aria-label="Din gissning"
              required
              className="grow"
            />
            <button type="submit">Gissa</button>
            <button
              type="button"
              className="muted"
              onClick={() => dispatch({ type: "gaveUp" })}
            >
              Ge upp
            </button>
          </form>
        </>
      ) : (
        <section className="mt-4 max-w-xl border p-3">
          <p className="font-bold">
            {state.outcome === "won"
              ? `Rätt! ${prize} poäng.`
              : "Du gav upp — 0 poäng."}
          </p>
          <p className="mt-1">
            Filmen var <strong>{state.movie.title}</strong> ({state.movie.year}).
          </p>
          <button className="mt-3" onClick={startSession}>
            Ny omgång
          </button>
        </section>
      )}
    </>
  )
}
