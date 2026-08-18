import { request } from "./client"
import type { ActorDto } from "./types"

export function getActors(): Promise<ActorDto[]> {
  return request<ActorDto[]>("/api/actors")
}

// 204 No Content back - the caller already know the actor and the role it sent, so there is nothing to return
export function addActorToMovie(
  movieId: number,
  actorId: number,
  role: string | null,
): Promise<void> {
  return request<void>(`/api/movies/${movieId}/actors/${actorId}`, {
    method: "POST",
    // An empty role field means "no role", and the API's word that is null
    body: JSON.stringify({ role: role || null }),
  })
}
