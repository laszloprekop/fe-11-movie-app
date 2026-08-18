import { request } from "./client"
import type { GenreDto } from "./types"

export function getGenres(): Promise<GenreDto[]> {
  return request<GenreDto[]>("/api/genres")
}
