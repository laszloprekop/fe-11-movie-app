import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getMovies } from "../api/movies"
import type { MovieDto } from "../api/types"

export default function Home() {
  const [movies, setMovies] = useState<MovieDto[]>([])

  useEffect(() => {
    getMovies().then(setMovies)
  }, [])

  return (
    <>
      <h1 className="text-3xl font-bold">Movie App Mega X-Treme 3000</h1>
      <ul className="mt-4 space-y-2">
        {movies.map((movie) => (
          <li key={movie.id}>
            <Link to={`/movies/${movie.id}`} className="underline">
              {movie.title}
            </Link>{" "}
            ({movie.year})
          </li>
        ))}
      </ul>
    </>
  )
}
