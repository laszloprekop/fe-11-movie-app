import { useParams } from "react-router-dom"

export default function MovieDetails() {
  const { id } = useParams()
  return <h1 className="text-2xl font-bold">film #{id}</h1>
}
