// Mirrors MovieCore's DTOs — these are the API's words, not ours.
// ASP.NET serializes PascalCase properties as camelCase JSON.
export type MovieDto = {
  id: number
  title: string
  year: number
  genre: string
  duration: number
}

export type GenreDto = {
  id: number
  name: string
}

// What POST /api/movies expects. Note: genres travel as ids here but come
// back flattened to one string on MovieDto - two shapes, one movie.
export type MovieCreateDto = {
  title: string
  year: number
  genreIds: number[]
  duration: number
}

// What PUT /api/movies/{id} expects - deliberately no genreIds: the API's
// contract says genres do not change through an update.
export type MovieUpdateDto = {
  title: string
  year: number
  duration: number
}

export type ReviewDto = {
  id: number
  reviewerName: string
  comment: string
  rating: number
  createdAt: string // a C# DateTime, but JSON has no dates - it arrives as an ISO string
}

export type ActorDto = {
  id: number
  name: string
  birthYear: number
}

// The heavier half: MovieDto's fields plus the flattened 1:1 details and
// both relation lists. C#'s decimal? and string? become number/string | null.
export type MovieDetailDto = {
  id: number
  title: string
  year: number
  genre: string
  duration: number
  synopsis: string | null
  language: string | null
  budget: number | null
  reviews: ReviewDto[]
  actors: ActorDto[]
}
