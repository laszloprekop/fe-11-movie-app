import { request } from "./client"
import type { ReviewCreateDto, ReviewDto } from "./types"

export function createReview(movieId: number, draft: ReviewCreateDto): Promise<ReviewDto> {
  return request<ReviewDto>(`/api/movies/${movieId}/reviews`, {
    method: "POST",
    body: JSON.stringify(draft),
  })
}
