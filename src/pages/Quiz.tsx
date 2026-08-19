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
// The dice never roll in here: a reducer must be pure, so the draw happens
// in the handler and arrives as an action.
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
      <div className="studio">
        <h1 className="sr-only">Gissa filmen</h1>
        <div className="slipcase aspect-[380/483] w-[380px] max-w-full">
          <div className="slipcase-band px-6 pt-7 pb-6">
            <p className="vhs-display text-5xl">GISSA FILMEN</p>
            <p className="vhs-label mt-2 opacity-85">Home Entertainment</p>
          </div>
          <div className="stripes tall" />
          <div className="flex grow flex-col items-center px-6 pt-7 pb-4 text-center">
            <div className="my-auto grid justify-items-center gap-4">
              <p className="vhs-label">Kvällens fem</p>
              <p className="max-w-[38ch] text-xs opacity-80">
                Fem omgångar, en film per omgång — noll nåd. Första ledtråden är
                gratis; varje ny kostar poäng, varje fel gissning också.
              </p>
              <p className="flex items-center gap-2">
                <span className="vhs-display text-2xl">VHS</span>
                <span className="font-mono text-[9px] opacity-70">
                  MOVIE APP MEGA X-TREME 3000 · T-120
                </span>
              </p>
              {best.total > 0 && (
                <p className="font-mono text-xs">
                  Rekord: <strong>{best.total} poäng</strong> · Bästa svit: {best.streak}
                </p>
              )}
              <button
                className="on-card"
                onClick={startSession}
                disabled={state.phase === "loading"}
              >
                {state.phase === "loading" ? "Blandar filmerna…" : "Börja kvällens fem"}
              </button>
            </div>
            <p className="colophon">
              En övning för Lexicon LTU 2026 • En produkt av SyntaxSyndicate
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (state.phase === "empty") {
    return (
      <div className="studio">
        <h1 className="text-2xl font-bold">Gissa filmen</h1>
        <p className="mt-4">Katalogen är tom — lägg till filmer, kom sen tillbaka.</p>
      </div>
    )
  }

  if (state.phase === "error") {
    return (
      <div className="studio">
        <h1 className="text-2xl font-bold">Gissa filmen</h1>
        <div className="mt-4 w-full max-w-xl">
          <ErrorBanner error={state.error} />
        </div>
      </div>
    )
  }

  if (state.phase === "done") {
    const total = state.scores.reduce((sum, score) => sum + score, 0)
    const isRecord = total > 0 && total >= best.total
    return (
      <div className="studio">
        <h1 className="sr-only">Gissa filmen</h1>
        <div className="slipcase w-[430px] max-w-full">
          <div className="slipcase-band px-6 pt-5 pb-4">
            <p className="vhs-display text-3xl">SLUTRESULTAT</p>
            <p className="vhs-label mt-1 opacity-85">Kvällens fem är spelade</p>
          </div>
          <div className="stripes thin" />
          <div className="px-8 py-6 font-mono">
            <p className="stars">* * * * * * * * * * * * *</p>
            <ol className="mt-3 grid gap-2.5">
              {state.scores.map((score, index) => (
                // The round number is the identity here, so the index is for
                // once the honest key.
                <li key={index} className="spine">
                  <span className="cap" />
                  <span className="spine-label">
                    <span>
                      OMGÅNG {index + 1} · {state.played[index].toUpperCase()}
                    </span>
                    <strong>{score}</strong>
                  </span>
                </li>
              ))}
            </ol>
            <p className="stars mt-3">* * * * * * * * * * * * *</p>
            <div className="total-row mt-4">
              <span className="vhs-label">Totalt</span>
              <span className="vhs-display text-3xl">{total} POÄNG</span>
              {isRecord && <span className="sticker">NYTT REKORD!</span>}
            </div>
            <p className="stars mt-4">*** TACK FÖR IKVÄLL ***</p>
          </div>
        </div>
        <p className="rekord mt-7 font-mono">
          Rekord: <strong>{best.total} poäng</strong> · Bästa svit: {best.streak}
        </p>
        <button className="mt-4" onClick={startSession}>
          Spela igen
        </button>
      </div>
    )
  }

  const clues = buildClues(state.movie)
  // The live prize is derived, never stored: "what a correct guess pays right
  // now" is a question for roundScore, asked on every render.
  const prize = roundScore(
    { won: true, cluesRevealed: state.revealed, wrongGuesses: state.wrongGuesses },
    state.streak,
  )

  // Boards 02 and 03 are two states of the same objects: one stage, one
  // sleeve, one tape. The is-settled class drives every transition — the
  // tape's rotate-slide, the sleeve's width and tilt, the containers' heights.
  const settled = state.outcome !== "open"
  const won = state.outcome === "won"

  return (
    <div className="studio">
      <div className={settled ? "quiz-stage is-settled" : "quiz-stage"}>
        <div className="slipcase quiz-case">
          <div className="slipcase-band">
            <div className="case-open-only" inert={settled}>
              <p className="vhs-label px-6 pt-3 pb-3">Gissa filmen</p>
            </div>
            <div className="case-settled-only" inert={!settled}>
              <div className="px-6 pt-8 pb-7">
                <p className="vhs-display text-[42px]">{state.movie.title.toUpperCase()}</p>
                <p className="vhs-label mt-2 opacity-85">
                  {state.movie.year} · {state.movie.genre} · {state.movie.duration} min
                </p>
              </div>
            </div>
          </div>
          <div className="stripes tall" />
          <div className="case-open-only" inert={settled}>
            <div className="px-7 pt-4 pb-4">
              <div className="status mx-auto mt-1 w-[283px] max-w-full font-mono">
                <div>
                  <span>OMGÅNG</span>
                  <strong>
                    {state.scores.length + 1} AV {state.totalRounds}
                  </strong>
                </div>
                <div>
                  <span>VINST JUST NU</span>
                  <strong className="hot">{prize} POÄNG</strong>
                </div>
                <div>
                  <span>SVIT</span>
                  <strong>{state.streak > 0 ? state.streak : "—"}</strong>
                </div>
                <div>
                  <span>FEL GISSNINGAR</span>
                  <strong>{state.wrongGuesses}</strong>
                </div>
              </div>
              <div className="mt-4">
                {clues.slice(0, state.revealed).map((clue, index) => (
                  <div
                    key={clue.label}
                    className={index === state.revealed - 1 ? "spec-row fresh" : "spec-row"}
                  >
                    <span className="spec-label">{clue.label}</span>
                    <span>{clue.value}</span>
                  </div>
                ))}
                {clues.slice(state.revealed).map((clue, index) => (
                  <div key={clue.label} className="spec-row locked">
                    <span className="spec-label">{clue.label}</span>
                    {index === 0 ? (
                      <button className="kop" onClick={() => dispatch({ type: "clueBought" })}>
                        KÖP −{clue.cost}
                      </button>
                    ) : (
                      <span className="spec-price">−{clue.cost}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <p className="small-print max-w-[36ch]">
                  Otillåten gissning utan poängavdrag är förbjuden enligt husets regler.
                  Ledtrådar säljs styckvis. Ingen ånger. Svit bryts vid uppgivande.
                </p>
                <span className="barcode">7 350045 511011</span>
              </div>
            </div>
          </div>
          <div className="case-settled-only" inert={!settled}>
            <div className="grid justify-items-center gap-3 px-6 py-5 text-center">
              {state.movie.synopsis && (
                <p className="max-w-[44ch] text-xs opacity-80">{state.movie.synopsis}</p>
              )}
              <p className="vhs-label">
                {state.movie.actors.length > 0 ? state.movie.actors.join(" · ") : "Okänd ensemble"}
              </p>
              <span className="barcode">7 350045 511011</span>
            </div>
          </div>
        </div>

        <div className="tape-wrap" aria-hidden={settled}>
          <div className="tape">
            <div className="tape-strip" />
            <div className="reel left" />
            <div className="reel right" />
            <div className="tape-label">
              {settled ? (
                <span className="vhs-hand">{state.movie.title}</span>
              ) : (
                // The guess is written on the tape by hand; the terminal's
                // block cursor marks the field until the writing starts.
                <form id="guess-form" onSubmit={handleGuess} className="label-write">
                  {/* a textarea, so a long title wraps like real handwriting;
                      Enter still submits, Shift+Enter makes a line break */}
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        e.currentTarget.form?.requestSubmit()
                      }
                    }}
                    placeholder=" "
                    aria-label="Din gissning"
                    required
                    rows={3}
                    className="hand-input"
                  />
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="side-panel">
          {settled ? (
            <>
              {won ? (
                <p className="burst">
                  <span className="sticker">RÄTT! +{prize} POÄNG</span>
                </p>
              ) : (
                <p className="text-lg font-bold">Du gav upp — 0 poäng.</p>
              )}
              <div className="mt-6 font-mono">
                <p className="text-sm opacity-60">FILMEN VAR:</p>
                <p className="mt-1 text-lg font-bold">
                  {state.movie.title} ({state.movie.year})
                </p>
              </div>
              <div className="status mt-6 font-mono">
                <div>
                  <span>OMGÅNG</span>
                  <strong>
                    {state.scores.length + 1} AV {state.totalRounds}
                  </strong>
                </div>
                <div>
                  <span>BANKAT</span>
                  <strong className="hot">{won ? prize : 0} POÄNG</strong>
                </div>
                <div>
                  <span>SVIT</span>
                  <strong>{won ? state.streak + 1 : 0}</strong>
                </div>
              </div>
              {state.scores.length + 1 < state.totalRounds ? (
                <button className="mt-6" onClick={nextRound}>
                  Nästa omgång
                </button>
              ) : (
                <button className="mt-6" onClick={() => dispatch({ type: "sessionEnded" })}>
                  Visa slutresultat
                </button>
              )}
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Gissa filmen</h1>
              <div className="tape-space" />
              <div className="flex gap-3">
                <button type="submit" form="guess-form">
                  Gissa
                </button>
                <button type="button" className="muted" onClick={() => dispatch({ type: "gaveUp" })}>
                  Ge upp
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
