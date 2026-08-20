import { request } from "./client"
import type {
  MovieCreateDto,
  MovieDetailDto,
  MovieDto,
  MovieUpdateDto,
} from "./types"

// The filter vocab. of GET /api/movies
// - every field optional
// - absent fields stay out of the query string entirely

export type MovieFilters = {
  title?: string
  genre?: string
}

export function getMovies(filters: MovieFilters = {}): Promise<MovieDto[]> {
  const params = new URLSearchParams()
  // The list endpoint pages at 10, and every caller here wants the whole
  // catalogue. 100 = the API's MaxPageSize = the seeded catalogue size;
  // film #101 turns this line into a pager loop over X-Pagination.
  params.set("pageSize", "100")
  if (filters.title) params.set("title", filters.title)
  if (filters.genre) params.set("genre", filters.genre)
  return request<MovieDto[]>(`/api/movies?${params.toString()}`)
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

export function deleteMovie(id: number): Promise<void> {
  return request<void>(`/api/movies/${id}`, { method: "DELETE" })
}

export function getMovieDetails(id: number): Promise<MovieDetailDto> {
  return request<MovieDetailDto>(`/api/movies/${id}/details`)
}
