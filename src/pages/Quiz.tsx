import { useReducer } from "react"
import { getMovieDetails, getMovies } from "../api/movies"
import type { MovieDetailDto } from "../api/types"
import ErrorBanner from "../components/ErrorBanner"
import { buildClues, drawRound, roundScore, type QuizMovie } from "../domain/quiz"

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
    }

type QuizAction =
  | { type: "loadStarted" }
  | { type: "loadFailed"; error: unknown }
  | { type: "poolEmpty" }
  | { type: "roundStarted"; movie: QuizMovie; pool: number[] }
  | { type: "clueBought" }

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
      }
    case "clueBought":
      if (state.phase !== "playing") return state
      return {
        ...state,
        revealed: Math.min(state.revealed + 1, buildClues(state.movie).length),
      }
  }
}

export default function Quiz() {
  const [state, dispatch] = useReducer(quizReducer, { phase: "idle" })

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
      </p>
      <ol className="mt-4 grid max-w-xl gap-3">
        {clues.slice(0, state.revealed).map((clue) => (
          <li key={clue.label} className="border p-3">
            <p className="font-bold">{clue.label}</p>
            <p>{clue.value}</p>
          </li>
        ))}
      </ol>
      {state.revealed < clues.length && (
        <button className="mt-4" onClick={() => dispatch({ type: "clueBought" })}>
          Köp nästa ledtråd (−{clues[state.revealed].cost} poäng)
        </button>
      )}
    </>
  )
}
