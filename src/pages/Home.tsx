import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getMovies } from "../api/movies"
import { getGenres } from "../api/genres"
import type { GenreDto, MovieCreateDto, MovieDto } from "../api/types"
import ErrorBanner from "../components/ErrorBanner"
import MovieForm from "../components/MovieForm"

// One value, three shapes - an impossible state (loaded AND erroring) cannot
// even be written down.
type PageState =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; movies: MovieDto[]; genres: GenreDto[] }

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

  function handleCreate(draft: MovieCreateDto) {
    // Stub - Step 14 sends this through the door.
    console.log("would POST /api/movies", draft)
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
              <li key={movie.id}>
                <Link to={`/movies/${movie.id}`} className="underline">
                  {movie.title}
                </Link>{" "}
                ({movie.year})
              </li>
            ))}
          </ul>
          <MovieForm genres={state.genres} onSubmit={handleCreate} />
        </>
      )}
    </>
  )
}
