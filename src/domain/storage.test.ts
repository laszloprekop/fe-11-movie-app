import { afterEach, describe, expect, it, vi } from "vitest"
import { readBest, writeBest } from "./storage"

// Vitest runs in node, where no localStorage exists — a stand-in with the
// two methods the pair uses is stubbed in per test.
function fakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("the highscore pair", () => {
  it("reads no record as zeros", () => {
    vi.stubGlobal("localStorage", fakeStorage())
    expect(readBest()).toEqual({ total: 0, streak: 0 })
  })

  it("round-trips a best", () => {
    vi.stubGlobal("localStorage", fakeStorage())
    writeBest({ total: 3200, streak: 4 })
    expect(readBest()).toEqual({ total: 3200, streak: 4 })
  })

  it("reads corrupt JSON as zeros instead of crashing", () => {
    vi.stubGlobal(
      "localStorage",
      fakeStorage({ "gissa-filmen.best": "not json{" }),
    )
    expect(readBest()).toEqual({ total: 0, streak: 0 })
  })

  it("survives an environment with no storage at all — like this one", () => {
    expect(readBest()).toEqual({ total: 0, streak: 0 })
    expect(() => writeBest({ total: 1, streak: 1 })).not.toThrow()
  })
})
