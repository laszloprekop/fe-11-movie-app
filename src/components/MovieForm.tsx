import { useState, type SubmitEvent } from "react"
import type { GenreDto, MovieCreateDto, MovieDto } from "../api/types"

type Props = {
  genres: GenreDto[]
  // Filled from the movie being edited; null means the form creates.
  // The parent remounts the form (via key) whenever this changes.
  initial: MovieDto | null
  // Resolves = saved (form clears). Rejects = failed (draft stays for repair).
  onSubmit: (draft: MovieCreateDto) => Promise<void>
  onCancel: () => void
}

// Inputs always hold strings - numbers are converted at the submit boundary,
// in one place, never per keystroke.
const EMPTY = { title: "", year: "", genreId: "", duration: "" }

export default function MovieForm({
  genres,
  initial,
  onSubmit,
  onCancel,
}: Props) {
  const editing = initial !== null
  const [fields, setFields] = useState(
    initial
      ? {
          title: initial.title,
          year: String(initial.year),
          genreId: "",
          duration: String(initial.duration),
        }
      : EMPTY,
  )

  function set(name: keyof typeof EMPTY) {
    return (e: { target: { value: string } }) =>
      setFields({ ...fields, [name]: e.target.value })
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      await onSubmit({
        title: fields.title.trim(),
        year: Number(fields.year),
        genreIds: fields.genreId ? [Number(fields.genreId)] : [],
        duration: Number(fields.duration),
      })
      setFields(EMPTY)
    } catch {
      // The parent shows the error; the draft stays so it can be repaired.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid max-w-md gap-3">
      <h2 className="text-xl font-bold">
        {editing ? `Redigera: ${initial.title}` : "Lägg till film"}
      </h2>
      <label className="grid gap-1">
        Titel
        <input
          value={fields.title}
          onChange={set("title")}
          required
         
        />
      </label>
      <label className="grid gap-1">
        År
        <input
          type="number"
          value={fields.year}
          onChange={set("year")}
          required
          min="1888"
          max="2100"
         
        />
      </label>
      <label className="grid gap-1">
        Genre
        <select
          value={fields.genreId}
          onChange={set("genreId")}
          required={!editing}
          disabled={editing}
          className="disabled:opacity-50"
        >
          <option value="">{editing ? initial.genre : "Välj genre…"}</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
        {editing && (
          <small>
            Genren ändras inte vid redigering - API:ets uppdatering tar inga
            genrer.
          </small>
        )}
      </label>
      <label className="grid gap-1">
        Speltid (minuter)
        <input
          type="number"
          value={fields.duration}
          onChange={set("duration")}
          required
          min="1"
          max="1000"
         
        />
      </label>
      <div className="flex gap-3">
        <button
          type="submit"
          
        >
          {editing ? "Spara ändringar" : "Lägg till film"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="muted"
          >
            Avbryt
          </button>
        )}
      </div>
    </form>
  )
}
