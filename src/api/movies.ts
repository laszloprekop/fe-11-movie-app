import { request } from "./client"
import type { MovieCreateDto, MovieDto, MovieUpdateDto } from "./types"

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

// PUT answers 204 No Content - the caller updates its own copy from the draft.
export function updateMovie(id: number, draft: MovieUpdateDto): Promise<void> {
  return request<void>(`/api/movies/${id}`, {
    method: "PUT",
    body: JSON.stringify(draft),
  })
}
