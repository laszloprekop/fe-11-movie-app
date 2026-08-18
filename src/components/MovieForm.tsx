import { useState, type FormEvent } from "react"
import type { GenreDto, MovieCreateDto } from "../api/types"

type Props = {
  genres: GenreDto[]
  // Resolves = saved (form clears). Rejects = failed (draft stays for repair).
  onSubmit: (draft: MovieCreateDto) => Promise<void>
}

// Inputs always hold strings - numbers are converted at the submit boundary,
// in one place, never per keystroke.
const EMPTY = { title: "", year: "", genreId: "", duration: "" }

export default function MovieForm({ genres, onSubmit }: Props) {
  const [fields, setFields] = useState(EMPTY)

  function set(name: keyof typeof EMPTY) {
    return (e: { target: { value: string } }) =>
      setFields({ ...fields, [name]: e.target.value })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await onSubmit({
        title: fields.title.trim(),
        year: Number(fields.year),
        genreIds: [Number(fields.genreId)],
        duration: Number(fields.duration),
      })
      setFields(EMPTY)
    } catch {
      // The parent shows the error; the draft stays so it can be repaired.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid max-w-md gap-3">
      <h2 className="text-xl font-bold">Lägg till film</h2>
      <label className="grid gap-1">
        Titel
        <input value={fields.title} onChange={set("title")} required className="rounded border p-2" />
      </label>
      <label className="grid gap-1">
        År
        <input type="number" value={fields.year} onChange={set("year")} required min="1888" max="2100" className="rounded border p-2" />
      </label>
      <label className="grid gap-1">
        Genre
        <select value={fields.genreId} onChange={set("genreId")} required className="rounded border p-2">
          <option value="">Välj genre…</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1">
        Speltid (minuter)
        <input type="number" value={fields.duration} onChange={set("duration")} required min="1" max="1000" className="rounded border p-2" />
      </label>
      <button type="submit" className="justify-self-start rounded bg-emerald-700 px-4 py-2 text-white">
        Lägg till film
      </button>
    </form>
  )
}
