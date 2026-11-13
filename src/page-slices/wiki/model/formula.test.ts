import { describe, expect, it } from "vitest"
import { evaluateFormula } from "./formula"

const row: Record<string, unknown> = {
  Qty: 10,
  Harga: 45000,
  "Total DP/Dibayar": "IDR 100,000",
  Lunas: true,
  Kosong: null,
}
const lookup = (name: string) => row[name]

describe("evaluateFormula", () => {
  it("multiplies columns", () => {
    expect(evaluateFormula('prop("Qty") * prop("Harga")', lookup)).toBe(450000)
  })
  it("follows precedence and parentheses", () => {
    expect(evaluateFormula("2 + 3 * (4 - 1)", lookup)).toBe(11)
    expect(evaluateFormula("-2 * -3", lookup)).toBe(6)
  })
  it("reads text, checkboxes and empties as numbers", () => {
    expect(evaluateFormula('prop("Total DP/Dibayar")', lookup)).toBe(100000)
    expect(evaluateFormula('prop("Lunas") + prop("Kosong")', lookup)).toBe(1)
  })
  it("has round / min / max / abs / sum", () => {
    expect(evaluateFormula("round(10 / 3, 2)", lookup)).toBe(3.33)
    expect(evaluateFormula("max(1, 5, 3) - min(4, 2)", lookup)).toBe(3)
    expect(evaluateFormula("abs(-4) + sum(1, 2, 3)", lookup)).toBe(10)
  })
  it("gives null for mistakes, never runs code", () => {
    expect(evaluateFormula('prop("Qty") *', lookup)).toBeNull()
    expect(evaluateFormula("alert(1)", lookup)).toBeNull()
    expect(evaluateFormula("1 / 0", lookup)).toBeNull()
    expect(evaluateFormula("", lookup)).toBeNull()
    expect(evaluateFormula("constructor.constructor('x')()", lookup)).toBeNull()
  })
})
