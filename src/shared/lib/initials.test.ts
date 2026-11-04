import { describe, expect, it } from "vitest"
import { initials } from "./initials"

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("rico asal coding")).toBe("RA")
  })
  it("takes two letters of a one-word name", () => {
    expect(initials("Kretya")).toBe("KR")
  })
  it("ignores extra spaces", () => {
    expect(initials("  Budi   Santoso ")).toBe("BS")
  })
  it("falls back when there is no name", () => {
    expect(initials(null)).toBe("?")
    expect(initials("", "U")).toBe("U")
    expect(initials("   ", "KR")).toBe("KR")
  })
})
