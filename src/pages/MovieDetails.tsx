import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getMovieDetails } from "../api/movies"
import type { MovieDetailDto } from "../api/types"
import ErrorBanner from "../components/ErrorBanner"

type PageState =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; movie: MovieDetailDto }

export default function MovieDetails() {
  // useParams always hands back strings - the URL is text. Converting and
  // validating it is our job, before it goes anywhere near the API.
  const { id } = useParams()
  const movieId = Number(id)
  const navigate = useNavigate()
  const [state, setState] = useState<PageState>({ status: "loading" })

  useEffect(() => {
    if (Number.isNaN(movieId)) return
    let ignore = false
    getMovieDetails(movieId)
      .then((movie) => {
        if (!ignore) setState({ status: "ready", movie })
      })
      .catch((error: unknown) => {
        if (!ignore) setState({ status: "error", error })
      })
    return () => {
      ignore = true
    }
  }, [movieId])

  if (Number.isNaN(movieId)) {
    return <p className="mt-4">Ogiltigt film-id i adressen.</p>
  }

  return (
    <>
      <button onClick={() => navigate(-1)} className="mb-4 underline">
        ← Tillbaka
      </button>

      {state.status === "loading" && <p>Laddar filmen…</p>}
      {state.status === "error" && <ErrorBanner error={state.error} />}
      {state.status === "ready" && (
        <article className="max-w-2xl">
          <h1 className="text-3xl font-bold">
            {state.movie.title} <span className="font-normal">({state.movie.year})</span>
          </h1>
          <p className="mt-1 text-sm">
            {state.movie.genre} · {state.movie.duration} min
            {state.movie.language && <> · {state.movie.language}</>}
            {state.movie.budget !== null && (
              <> · budget {state.movie.budget.toLocaleString("sv-SE")} USD</>
            )}
          </p>
          {state.movie.synopsis && <p className="mt-4">{state.movie.synopsis}</p>}

          <h2 className="mt-6 text-xl font-bold">Skådespelare</h2>
          <ul className="mt-2 space-y-1">
            {state.movie.actors.map((actor) => (
              <li key={actor.id}>
                {actor.name} <span className="text-sm">(f. {actor.birthYear})</span>
              </li>
            ))}
            {state.movie.actors.length === 0 && <li>Inga skådespelare registrerade.</li>}
          </ul>

          <h2 className="mt-6 text-xl font-bold">Recensioner</h2>
          <ul className="mt-2 space-y-3">
            {state.movie.reviews.map((review) => (
              <li key={review.id} className="rounded border p-3">
                <p className="font-bold">
                  {review.reviewerName} · {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </p>
                <p>{review.comment}</p>
              </li>
            ))}
            {state.movie.reviews.length === 0 && <li>Inga recensioner ännu.</li>}
          </ul>
        </article>
      )}
    </>
  )
}
