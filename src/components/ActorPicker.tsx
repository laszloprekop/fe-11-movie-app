import { useState, type SubmitEvent } from "react"
import type { ActorDto } from "../api/types"

type Props = {
  actors: ActorDto[]
  // resolves = saved (form clears). Rejects = failed (draft stays for repair).
  onAdd: (actor: ActorDto, role: string) => Promise<void>
}

export default function ActorPicker({ actors, onAdd }: Props) {
  const [actorId, setActorId] = useState("")
  const [role, setRole] = useState("")

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    const actor = actors.find((a) => String(a.id) === actorId)
    // Option valies are strings, the URL rule from MovieDetails
    if (!actor) return
    try {
      await onAdd(actor, role.trim())
      setActorId("")
      setRole("")
    } catch {
      // the parent shows the error
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap gap-2">
      <select
        value={actorId}
        onChange={(e) => setActorId(e.target.value)}
        aria-label="Välj skådespelare"
        required
        className="rounded border px-2 py-1"
      >
        <option value="">Välj skådespelare…</option>
        {actors.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Roll (t.ex. Huvudskurk)"
        aria-label="Roll"
        className="border px-2 py-1"
      />
      <button type="submit" className="border px-3 py-1">
        Lägg till
      </button>
    </form>
  )
}
