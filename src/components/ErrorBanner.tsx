import { ApiError } from "../api/client"

type Props = { error: unknown }

export default function ErrorBanner({ error }: Props) {
  const message =
    error instanceof ApiError ? error.message : "Något gick fel. Försök igen."
  return (
    <p role="alert" className="alert">
      {message}
    </p>
  )
}
