import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getMovieDetails } from "../api/movies"
import { createReview } from "../api/reviews"
import type { ActorDto, MovieDetailDto, ReviewCreateDto } from "../api/types"
import ErrorBanner from "../components/ErrorBanner"
import ReviewForm from "../components/ReviewForm"
import { addActorToMovie, getActors } from "../api/actors"
import ActorPicker from "../components/ActorPicker"

type PageState =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | {
      status: "ready"
      movie: MovieDetailDto
      allActors: ActorDto[]
      saveError?: unknown
      actorError?: unknown
    }

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
    Promise.all([getMovieDetails(movieId), getActors()])
      .then(([movie, allActors]) => {
        if (!ignore) setState({ status: "ready", movie, allActors })
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

  async function handleAddActor(actor: ActorDto, role: string) {
    if (state.status !== "ready") return
    try {
      await addActorToMovie(movieId, actor.id, role)
      // 204 back — the new list entry is built from what we already know.
      setState({
        ...state,
        movie: {
          ...state.movie,
          actors: [...state.movie.actors, { ...actor, role: role || null }],
        },
        actorError: undefined,
      })
    } catch (error) {
      setState({ ...state, actorError: error })
      throw error // rethrown so the picker keeps its draft
    }
  }

  async function handleAddReview(draft: ReviewCreateDto) {
    if (state.status !== "ready") return
    try {
      const created = await createReview(movieId, draft)
      // Nested update: a fresh movie object holding a fresh reviews array.
      setState({
        ...state,
        movie: { ...state.movie, reviews: [...state.movie.reviews, created] },
        saveError: undefined,
      })
    } catch (error) {
      setState({ ...state, saveError: error })
      throw error // rethrown so the form keeps its draft
    }
  }

  return (
    <>
      <button onClick={() => navigate(-1)} className="small mb-4">
        ← Tillbaka
      </button>

      {state.status === "loading" && <p>Laddar filmen…</p>}
      {state.status === "error" && <ErrorBanner error={state.error} />}
      {state.status === "ready" && (
        <article className="max-w-2xl">
          <h1 className="text-3xl font-bold">
            {state.movie.title}{" "}
            <span className="font-normal">({state.movie.year})</span>
          </h1>
          <p className="mt-1 text-sm">
            {state.movie.genre} · {state.movie.duration} min
            {state.movie.director && <> · regi {state.movie.director}</>}
            {state.movie.language && <> · {state.movie.language}</>}
            {state.movie.budget !== null && (
              <> · budget {state.movie.budget.toLocaleString("sv-SE")} USD</>
            )}
          </p>
          {state.movie.synopsis && (
            <p className="mt-4">{state.movie.synopsis}</p>
          )}

          <h2 className="mt-6 text-xl font-bold">Skådespelare</h2>
          <ul className="mt-2 space-y-1">
            {state.actorError !== undefined && (
              <ErrorBanner error={state.actorError} />
            )}
            <ActorPicker actors={state.allActors} onAdd={handleAddActor} />
            {state.movie.actors.map((actor) => (
              <li key={actor.id}>
                {actor.name}{" "}
                {actor.role && (
                  <span className="italic"> som {actor.role}</span>
                )}{" "}
                <span className="text-sm">(f. {actor.birthYear})</span>
              </li>
            ))}
            {state.movie.actors.length === 0 && (
              <li>Inga skådespelare registrerade.</li>
            )}
          </ul>

          <h2 className="mt-6 text-xl font-bold">Recensioner</h2>
          <ul className="mt-2 space-y-3">
            {state.movie.reviews.map((review) => (
              <li key={review.id} className="border p-3 [&_p]:my-1">
                <p className="font-bold">
                  {review.reviewerName} · {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </p>
                <p>{review.comment}</p>
              </li>
            ))}
            {state.movie.reviews.length === 0 && (
              <li>Inga recensioner ännu.</li>
            )}
          </ul>

          {state.saveError !== undefined && (
            <ErrorBanner error={state.saveError} />
          )}
          <ReviewForm onSubmit={handleAddReview} />
        </article>
      )}
    </>
  )
}
