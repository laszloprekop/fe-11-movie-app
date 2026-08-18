import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { createMovie, getMovies, updateMovie } from "../api/movies"
import { getGenres } from "../api/genres"
import type { GenreDto, MovieCreateDto, MovieDto } from "../api/types"
import ErrorBanner from "../components/ErrorBanner"
import MovieForm from "../components/MovieForm"

// One value, three shapes - an impossible state (loaded AND erroring) cannot
// even be written down.
type PageState =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | {
      status: "ready"
      movies: MovieDto[]
      genres: GenreDto[]
      editing?: MovieDto
      saveError?: unknown
    }

export default function Home() {
  const [state, setState] = useState<PageState>({ status: "loading" })

  useEffect(() => {
    let ignore = false
    Promise.all([getMovies(), getGenres()])
      .then(([movies, genres]) => {
        if (!ignore) setState({ status: "ready", movies, genres })
      })
      .catch((error: unknown) => {
        if (!ignore) setState({ status: "error", error })
      })
    return () => {
      ignore = true
    }
  }, [])

  async function handleCreate(draft: MovieCreateDto) {
    if (state.status !== "ready") return
    try {
      const created = await createMovie(draft)
      setState({ ...state, movies: [...state.movies, created], saveError: undefined })
    } catch (error) {
      setState({ ...state, saveError: error })
      throw error // rethrown so the form keeps its draft
    }
  }

  async function handleUpdate(draft: MovieCreateDto) {
    if (state.status !== "ready" || !state.editing) return
    const id = state.editing.id
    const { title, year, duration } = draft // PUT takes no genreIds
    try {
      await updateMovie(id, { title, year, duration })
      setState({
        ...state,
        movies: state.movies.map((m) => (m.id === id ? { ...m, title, year, duration } : m)),
        editing: undefined,
        saveError: undefined,
      })
    } catch (error) {
      setState({ ...state, saveError: error })
      throw error
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold">Movie App Mega X-Treme 3000</h1>
      {state.status === "loading" && <p className="mt-4">Laddar filmerna…</p>}
      {state.status === "error" && <ErrorBanner error={state.error} />}
      {state.status === "ready" && (
        <>
          <ul className="mt-4 space-y-2">
            {state.movies.map((movie) => (
              <li key={movie.id} className="flex items-center gap-3">
                <Link to={`/movies/${movie.id}`} className="underline">
                  {movie.title}
                </Link>{" "}
                ({movie.year})
                <button
                  onClick={() => setState({ ...state, editing: movie, saveError: undefined })}
                  className="rounded border px-2 py-0.5 text-sm"
                >
                  Redigera
                </button>
              </li>
            ))}
          </ul>
          {state.saveError !== undefined && <ErrorBanner error={state.saveError} />}
          <MovieForm
            key={state.editing?.id ?? "new"}
            genres={state.genres}
            initial={state.editing ?? null}
            onSubmit={state.editing ? handleUpdate : handleCreate}
            onCancel={() => setState({ ...state, editing: undefined })}
          />
        </>
      )}
    </>
  )
}
