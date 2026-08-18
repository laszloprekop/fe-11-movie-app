import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getMovies } from "../api/movies"
import type { MovieDto } from "../api/types"
import ErrorBanner from "../components/ErrorBanner"

// One value, three shapes - an impossible state (loaded AND erroring) cannot
// even be written down.
type PageState =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; movies: MovieDto[] }

export default function Home() {
  const [state, setState] = useState<PageState>({ status: "loading" })

  useEffect(() => {
    let ignore = false
    getMovies()
      .then((movies) => {
        if (!ignore) setState({ status: "ready", movies })
      })
      .catch((error: unknown) => {
        if (!ignore) setState({ status: "error", error })
      })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <>
      <h1 className="text-3xl font-bold">Movie App Mega X-Treme 3000</h1>
      {state.status === "loading" && <p className="mt-4">Laddar filmerna…</p>}
      {state.status === "error" && <ErrorBanner error={state.error} />}
      {state.status === "ready" && (
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
      )}
    </>
  )
}
