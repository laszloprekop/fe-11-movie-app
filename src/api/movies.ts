import { request } from "./client"
import type { MovieDto } from "./types"

// The seam holds: same signature the stub had, real data behind it.
export function getMovies(): Promise<MovieDto[]> {
  return request<MovieDto[]>("/api/movies")
}
