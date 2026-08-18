import { useState, type SubmitEvent } from "react"
import type { ReviewCreateDto } from "../api/types"

type Props = {
  // Resolves = saved (form clears). Rejects = failed (draft stays for repair).
  onSubmit: (draft: ReviewCreateDto) => Promise<void>
}

const EMPTY = { reviewerName: "", rating: "5", comment: "" }

export default function ReviewForm({ onSubmit }: Props) {
  const [fields, setFields] = useState(EMPTY)

  function set(name: keyof typeof EMPTY) {
    return (e: { target: { value: string } }) =>
      setFields({ ...fields, [name]: e.target.value })
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    try {
      await onSubmit({
        reviewerName: fields.reviewerName.trim(),
        rating: Number(fields.rating),
        comment: fields.comment.trim(),
      })
      setFields(EMPTY)
    } catch {
      // The parent shows the error; the draft stays so it can be repaired.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid max-w-md gap-3">
      <h3 className="text-lg font-bold">Skriv en recension</h3>
      <label className="grid gap-1">
        Ditt namn
        <input
          value={fields.reviewerName}
          onChange={set("reviewerName")}
          required
          className="rounded border p-2"
        />
      </label>
      <label className="grid gap-1">
        Betyg
        <select
          value={fields.rating}
          onChange={set("rating")}
          className="rounded border p-2"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {"★".repeat(n)}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1">
        Kommentar
        <textarea
          value={fields.comment}
          onChange={set("comment")}
          required
          rows={3}
          className="rounded border p-2"
        />
      </label>
      <button
        type="submit"
        className="justify-self-start rounded bg-emerald-700 px-4 py-2 text-white"
      >
        Skicka recension
      </button>
    </form>
  )
}
