/**
 * A database's formula column, as Notion's (the arithmetic part):
 *
 *   prop("Qty") * prop("Harga")
 *   prop("Total") - prop("Total DP/Dibayar")
 *   round(prop("Harga") / 3, 2)
 *
 * Numbers, + - * / %, parentheses, prop("<column name>") (empty or text
 * that isn't a number counts as 0; a checkbox as 1 / 0), and round(x, n),
 * min(…), max(…), abs(x), sum(…). Parsed by hand: no eval, nothing else
 * reachable. A mistake reads as null (the cell shows "—").
 */

type Token =
  | { t: "num"; v: number }
  | { t: "str"; v: string }
  | { t: "id"; v: string }
  | { t: "op"; v: string }

function lex(src: string): Token[] {
  const out: Token[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (/\s/.test(c)) {
      i++
    } else if (/[0-9.]/.test(c)) {
      let j = i
      while (j < src.length && /[0-9._]/.test(src[j])) j++
      out.push({ t: "num", v: Number(src.slice(i, j).replace(/_/g, "")) })
      i = j
    } else if (c === '"' || c === "'") {
      const j = src.indexOf(c, i + 1)
      if (j === -1) throw new Error("string")
      out.push({ t: "str", v: src.slice(i + 1, j) })
      i = j + 1
    } else if (/[a-zA-Z_]/.test(c)) {
      let j = i
      while (j < src.length && /[a-zA-Z_0-9]/.test(src[j])) j++
      out.push({ t: "id", v: src.slice(i, j).toLowerCase() })
      i = j
    } else if ("+-*/%(),".includes(c)) {
      out.push({ t: "op", v: c })
      i++
    } else throw new Error(`char ${c}`)
  }
  return out
}

const FUNCTIONS: Record<string, (args: number[]) => number> = {
  round: ([x, n = 0]) => {
    const f = 10 ** n
    return Math.round(x * f) / f
  },
  min: (args) => Math.min(...args),
  max: (args) => Math.max(...args),
  abs: ([x]) => Math.abs(x),
  sum: (args) => args.reduce((a, b) => a + b, 0),
}

/** Evaluates `src` with `lookup` giving a column's value by name. */
export function evaluateFormula(
  src: string,
  lookup: (name: string) => unknown,
): number | null {
  if (!src.trim()) return null
  let tokens: Token[]
  try {
    tokens = lex(src)
  } catch {
    return null
  }
  let pos = 0
  const peek = () => tokens[pos]
  const take = (op: string) => {
    const tok = tokens[pos]
    if (tok?.t === "op" && tok.v === op) {
      pos++
      return true
    }
    return false
  }
  const asNumber = (v: unknown): number => {
    if (typeof v === "number") return v
    if (typeof v === "boolean") return v ? 1 : 0
    if (typeof v === "string") {
      const raw = v.replace(/[^\d.,-]/g, "")
      // "100,000" / "100.000": thousands; else a decimal comma or point.
      const n = /^-?\d{1,3}([.,]\d{3})+$/.test(raw)
        ? Number(raw.replace(/[.,]/g, ""))
        : Number(raw.replace(",", "."))
      return Number.isFinite(n) ? n : 0
    }
    return 0
  }

  const expr = (): number => {
    let v = term()
    for (;;) {
      if (take("+")) v += term()
      else if (take("-")) v -= term()
      else return v
    }
  }
  const term = (): number => {
    let v = unary()
    for (;;) {
      if (take("*")) v *= unary()
      else if (take("/")) v /= unary()
      else if (take("%")) v %= unary()
      else return v
    }
  }
  const unary = (): number => {
    if (take("-")) return -unary()
    if (take("+")) return unary()
    return atom()
  }
  const atom = (): number => {
    const tok = peek()
    if (!tok) throw new Error("end")
    if (tok.t === "num") {
      pos++
      return tok.v
    }
    if (take("(")) {
      const v = expr()
      if (!take(")")) throw new Error(")")
      return v
    }
    if (tok.t === "id") {
      pos++
      if (!take("(")) throw new Error("(")
      if (tok.v === "prop") {
        const name = tokens[pos]
        if (name?.t !== "str") throw new Error("prop name")
        pos++
        if (!take(")")) throw new Error(")")
        return asNumber(lookup(name.v))
      }
      const fn = FUNCTIONS[tok.v]
      if (!fn) throw new Error(`fn ${tok.v}`)
      const args: number[] = []
      if (!take(")")) {
        do args.push(expr())
        while (take(","))
        if (!take(")")) throw new Error(")")
      }
      return fn(args)
    }
    throw new Error("token")
  }

  try {
    const v = expr()
    if (pos !== tokens.length) return null
    return Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}
