import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <section>
      <h1 className="text-2xl font-bold">
        404 — den rullen finns inte i hyllan
      </h1>
      <Link to="/" className="underline">
        Tillbaka hem
      </Link>
    </section>
  )
}
