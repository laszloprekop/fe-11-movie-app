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
