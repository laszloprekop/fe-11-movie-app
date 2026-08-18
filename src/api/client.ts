// The one door to the API. The base URL comes from the environment; every
// request and every error passes through here - no component calls fetch.
const BASE_URL = import.meta.env.VITE_API_URL as string | undefined

// ProblemDetails is the API's standard error body.
export type ProblemDetails = {
  title?: string
  detail?: string
  status?: number
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails | null

  constructor(status: number, problem: ProblemDetails | null) {
    super(
      problem?.detail ??
        Object.values(problem?.errors ?? {})[0]?.[0] ??
        problem?.title ??
        `API-fel (${status})`,
    )
    this.name = "ApiError"
    this.status = status
    this.problem = problem
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(0, {
      title: "API:t är inte konfigurerat",
      detail: "VITE_API_URL saknas i miljön för det här bygget.",
    })
  }

  // Content-Type only when a body travels - a JSON header on a plain GET forces an unnecessary preflight.
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: init?.body
      ? { "Content-Type": "application/json", ...init.headers }
      : init?.headers,
  })

  if (!response.ok) {
    const problem = (await response
      .json()
      .catch(() => null)) as ProblemDetails | null
    throw new ApiError(response.status, problem)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
