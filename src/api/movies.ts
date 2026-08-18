import { request } from "./client"
import type { MovieCreateDto, MovieDto } from "./types"

// The seam holds: same signature the stub had, real data behind it.
export function getMovies(): Promise<MovieDto[]> {
  return request<MovieDto[]>("/api/movies")
}

export function createMovie(draft: MovieCreateDto): Promise<MovieDto> {
  return request<MovieDto>("/api/movies", {
    method: "POST",
    body: JSON.stringify(draft),
  })
}
