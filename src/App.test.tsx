import { describe, expect, it } from "vitest"
import { renderToString } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import App from "./App"

// Smoke test: the route tree renders without a browser.
// MemoryRouter keeps history in memory, so no window is needed —
// and no extra dependencies.
describe("the shell", () => {
  it("renders the home page at /", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    )
    expect(html).toContain("Movie App Mega X-Treme 3000")
  })

  it("renders 404 for an unknown path", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/nonsense"]}>
        <App />
      </MemoryRouter>,
    )
    expect(html).toContain("404")
  })
})
