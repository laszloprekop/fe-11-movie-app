import { useEffect, useReducer, useState, type SubmitEvent } from "react"
import { getMovieDetails, getMovies } from "../api/movies"
import type { MovieDetailDto } from "../api/types"
import ErrorBanner from "../components/ErrorBanner"
import {
  buildClues,
  drawRound,
  isCorrectGuess,
  longestWinStreak,
  roundScore,
  sessionLength,
  type QuizMovie,
} from "../domain/quiz"
import { readBest, writeBest } from "../domain/storage"

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
      scores: number[]
      played: string[] // finished rounds' titles — the receipt names its tapes
      streak: number
      totalRounds: number
    }
  | { phase: "done"; scores: number[]; played: string[]; streak: number }

type QuizAction =
  | { type: "loadStarted" }
  | { type: "loadFailed"; error: unknown }
  | { type: "poolEmpty" }
  | { type: "sessionStarted"; movie: QuizMovie; pool: number[]; catalogueSize: number }
  | { type: "nextRoundStarted"; movie: QuizMovie; pool: number[] }
  | { type: "sessionEnded" }
  | { type: "clueBought" }
  | { type: "guessed"; guess: string }
  | { type: "gaveUp" }

type Playing = Extract<QuizState, { phase: "playing" }>

// Book the finished round: its score joins the list, the streak grows on a
// win and resets on a give-up (invariant 7's second half).
function bank(state: Playing) {
  const facts = {
    won: state.outcome === "won",
    cluesRevealed: state.revealed,
    wrongGuesses: state.wrongGuesses,
  }
  return {
    scores: [...state.scores, roundScore(facts, state.streak)],
    played: [...state.played, state.movie.title],
    streak: state.outcome === "won" ? state.streak + 1 : 0,
  }
}

// The reducer stores facts; every rule it needs lives in domain/quiz.ts.
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "loadStarted":
      return { phase: "loading" }
    case "loadFailed":
      return { phase: "error", error: action.error }
    case "poolEmpty":
      return { phase: "empty" }
    case "sessionStarted":
      return {
        phase: "playing",
        movie: action.movie,
        pool: action.pool,
        revealed: 1,
        wrongGuesses: 0,
        outcome: "open",
        scores: [],
        played: [],
        streak: 0,
        totalRounds: sessionLength(action.catalogueSize),
      }
    case "nextRoundStarted": {
      if (state.phase !== "playing" || state.outcome === "open") return state
      return {
        ...state,
        ...bank(state),
        movie: action.movie,
        pool: action.pool,
        revealed: 1,
        wrongGuesses: 0,
        outcome: "open",
      }
    }
    case "sessionEnded": {
      if (state.phase !== "playing" || state.outcome === "open") return state
      return { phase: "done", ...bank(state) }
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

  // Lazy initial state: useState(readBest) reads storage once, on mount —
  // useState(readBest()) would read it again on every render.
  const [best, setBest] = useState(readBest)

  // localStorage is an external system, so syncing it is effect work — the
  // one effect on this page. The early return doubles as the loop guard:
  // an effect that always setStates on its own dependency never settles.
  useEffect(() => {
    if (state.phase !== "done") return
    const total = state.scores.reduce((sum, score) => sum + score, 0)
    const streak = longestWinStreak(state.scores)
    if (total <= best.total && streak <= best.streak) return
    const next = {
      total: Math.max(best.total, total),
      streak: Math.max(best.streak, streak),
    }
    writeBest(next)
    setBest(next)
  }, [state, best])

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
      dispatch({
        type: "sessionStarted",
        movie: toQuizMovie(details),
        pool: rest,
        catalogueSize: movies.length,
      })
    } catch (error) {
      dispatch({ type: "loadFailed", error })
    }
  }

  // Round n+1 draws from the shrunken pool in state — invariant 4 by
  // construction, no bookkeeping to forget.
  async function nextRound() {
    if (state.phase !== "playing") return
    try {
      const { movieId, rest } = drawRound(state.pool, Math.random)
      const details = await getMovieDetails(movieId)
      dispatch({ type: "nextRoundStarted", movie: toQuizMovie(details), pool: rest })
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
        {best.total > 0 && (
          <p className="mt-2">
            Rekord: <strong>{best.total} poäng</strong> · Bästa svit: {best.streak}
          </p>
        )}
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

  if (state.phase === "done") {
    const total = state.scores.reduce((sum, score) => sum + score, 0)
    return (
      <>
        <h1 className="text-2xl font-bold">Gissa filmen</h1>
        <section className="mt-4 max-w-xl border p-3">
          <p className="font-bold">Kvällens fem är spelade!</p>
          <p className="mt-1">
            Totalt: <strong>{total} poäng</strong>
            {total >= best.total && total > 0 && <> — nytt rekord!</>}
          </p>
          <p>Bästa svit i kvällens fem: {longestWinStreak(state.scores)}</p>
          <ol className="mt-2">
            {state.scores.map((score, index) => (
              <li key={index}>
                Omgång {index + 1}: {score} poäng
              </li>
            ))}
          </ol>
          <button className="mt-3" onClick={startSession}>
            Spela igen
          </button>
        </section>
      </>
    )
  }

  const clues = buildClues(state.movie)
  // The live prize is derived, never stored: "what a correct guess pays right
  // now" is a question for roundScore, asked on every render — and it counts
  // the streak: what a win pays right now includes the bonus you stand on.
  const prize = roundScore(
    { won: true, cluesRevealed: state.revealed, wrongGuesses: state.wrongGuesses },
    state.streak,
  )

  return (
    <>
      <h1 className="text-2xl font-bold">Gissa filmen</h1>
      <p className="mt-2">
        Omgång {state.scores.length + 1} av {state.totalRounds} · Vinst just nu:{" "}
        <strong>{prize} poäng</strong>
        {state.streak > 0 && <> · Svit: {state.streak}</>}
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
          {state.scores.length + 1 < state.totalRounds ? (
            <button className="mt-3" onClick={nextRound}>
              Nästa omgång
            </button>
          ) : (
            <button className="mt-3" onClick={() => dispatch({ type: "sessionEnded" })}>
              Visa slutresultat
            </button>
          )}
        </section>
      )}
    </>
  )
}
