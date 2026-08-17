import type { MovieDto } from "./types"

// Stub
export async function getMovies(): Promise<MovieDto[]> {
  return [
    { id: 1, title: "Forrest Gump", year: 1994, genre: "Drama", duration: 142 },
    {
      id: 2,
      title: "Groundhog Day",
      year: 1993,
      genre: "Comedy",
      duration: 101,
    },
    { id: 3, title: "Her", year: 2013, genre: "Romance", duration: 126 },
  ]
}
