// Mirrors MovieCore's DTOs — these are the API's words, not ours.
// ASP.NET serializes PascalCase properties as camelCase JSON.
export type MovieDto = {
  id: number
  title: string
  year: number
  genre: string
  duration: number
}
