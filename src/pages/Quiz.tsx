import { useReducer } from "react"
import { buildClues, roundScore, type QuizMovie } from "../domain/quiz"

// Step 45 replaces this with a movie drawn from the catalogue.
const DEMO_MOVIE: QuizMovie = {
  title: "Demofilmen",
  year: 1993,
  duration: 101,
  language: "Svenska",
  genre: "Drama",
  actors: ["Skådespelare Ett", "Skådespelare Två"],
  synopsis: "En demofilm där Demofilmen spelar sig själv.",
}

type QuizState =
  | { phase: "idle" }
  | {
      phase: "playing"
      movie: QuizMovie
      revealed: number
      wrongGuesses: number
    }

type QuizAction = { type: "roundStarted"; movie: QuizMovie } | { type: "clueBought" }

// The reducer stores facts; every rule it needs lives in domain/quiz.ts.
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "roundStarted":
      return { phase: "playing", movie: action.movie, revealed: 1, wrongGuesses: 0 }
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

  if (state.phase === "idle") {
    return (
      <>
        <h1 className="text-2xl font-bold">Gissa filmen</h1>
        <p className="mt-2 max-w-xl">
          Fem omgångar, en film per omgång. Första ledtråden är gratis — varje
          ny kostar poäng, varje fel gissning också.
        </p>
        <button
          className="mt-4"
          onClick={() => dispatch({ type: "roundStarted", movie: DEMO_MOVIE })}
        >
          Börja kvällens fem
        </button>
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
