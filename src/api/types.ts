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

export type MovieActorsDto = {
  id: number
  name: string
  birthYear: number
  role: string | null
}

// What POST /api/movies/{movieId}/reviews needs - id and createdAt are the
// server's to invent.
export type ReviewCreateDto = {
  reviewerName: string
  comment: string
  rating: number
}

// The dashboard payload from GET /api/reports/dashboard — aggregates only,
// computed server-side; the client renders, it never recounts.
export type MovieRatingDto = {
  id: number
  title: string
  averageRating: number
  reviewCount: number
}

export type GenreTopMoviesDto = {
  genre: string
  movies: MovieRatingDto[]
}

export type ActorActivityDto = {
  id: number
  name: string
  movieCount: number
}

export type DashboardDto = {
  averageRating: number | null
  reviewCount: number
  topRatedPerGenre: GenreTopMoviesDto[]
  mostActiveActors: ActorActivityDto[]
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
  director: string | null
  budget: number | null
  reviews: ReviewDto[]
  actors: MovieActorsDto[]
}
