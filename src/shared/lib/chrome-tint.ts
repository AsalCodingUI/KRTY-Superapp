/**
 * The viewer's chrome color (Arc style): a hue (0–360) and an intensity
 * (0–1, 0 = neutral gray), optionally a gradient through more hues. Stored
 * in this browser and applied as --tint-h / --tint-c (globals.css builds
 * --chrome from them) and --chrome-gradient (painted over the chrome).
 */
export type Tint = {
  h: number
  c: number
  /** Gradient: the hues for the top-right and bottom-left corners. */
  g?: [number, number]
}

export const TINT_KEY = "chrome-tint"
export const NEUTRAL: Tint = { h: 250, c: 0 }

/** Swatches, light to dark-ish hues like Arc's row. */
export const TINT_PRESETS: Tint[] = [
  { h: 250, c: 0 },
  { h: 350, c: 0.55 },
  { h: 325, c: 0.75 },
  { h: 10, c: 0.85 },
  { h: 45, c: 0.8 },
  { h: 95, c: 0.7 },
  { h: 160, c: 0.65 },
  { h: 220, c: 0.7 },
  { h: 280, c: 0.75 },
]

/**
 * Gradients: neighbouring hues (never opposite ones, which go muddy in the
 * middle), from the logo corner to the top-right, then down the sidebar.
 */
export const GRADIENT_PRESETS: { name: string; tint: Tint }[] = [
  { name: "Peach", tint: { h: 35, c: 0.8, g: [350, 60] } },
  { name: "Blossom", tint: { h: 340, c: 0.75, g: [295, 20] } },
  { name: "Dusk", tint: { h: 285, c: 0.75, g: [330, 250] } },
  { name: "Ocean", tint: { h: 225, c: 0.75, g: [190, 265] } },
  { name: "Lagoon", tint: { h: 175, c: 0.7, g: [215, 135] } },
  { name: "Meadow", tint: { h: 120, c: 0.7, g: [165, 85] } },
]

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

const hue = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? ((Math.round(n) % 360) + 360) % 360 : null
}

export function normalizeTint(t: Partial<Tint> | null | undefined): Tint {
  const c = Number(t?.c)
  const base: Tint = {
    h: hue(t?.h) ?? NEUTRAL.h,
    c: Number.isFinite(c) ? Math.round(clamp(c, 0, 1) * 100) / 100 : 0,
  }
  const g = Array.isArray(t?.g) ? t.g.map(hue) : []
  return base.c > 0 && g.length === 2 && g.every((x) => x !== null)
    ? { ...base, g: g as [number, number] }
    : base
}

/** oklch() for a hue at the gradient's lightness / chroma (set per theme). */
const stop = (h: number, c: number) =>
  `oklch(var(--grad-l) calc(var(--grad-c) * ${c}) ${h})`

/**
 * The gradient: the tint's own hue in the logo corner, `g[0]` glowing from
 * the top-right along the top bar, `g[1]` pooling at the foot of the
 * sidebar; soft ellipses over a diagonal blend so nothing bands.
 */
export function gradientCss(t: Tint) {
  if (!t.g || t.c === 0) return "none"
  const [a, b, c] = [t.h, t.g[0], t.g[1]]
  return [
    `radial-gradient(70% 55% at 100% 0%, ${stop(b, t.c)}, transparent 75%)`,
    `radial-gradient(55% 75% at 0% 100%, ${stop(c, t.c)}, transparent 75%)`,
    `linear-gradient(160deg in oklab, ${stop(a, t.c)} 0%, ${stop(c, t.c)} 100%)`,
  ].join(", ")
}

export function readTint(): Tint {
  try {
    return normalizeTint(JSON.parse(localStorage.getItem(TINT_KEY) ?? "null"))
  } catch {
    return NEUTRAL
  }
}

export function applyTint(t: Tint) {
  const root = document.documentElement
  root.style.setProperty("--tint-h", String(t.h))
  root.style.setProperty("--tint-c", String(t.c))
  root.style.setProperty("--chrome-gradient", gradientCss(t))
  root.toggleAttribute("data-chrome-gradient", Boolean(t.g && t.c > 0))
}

export function saveTint(t: Tint) {
  applyTint(t)
  try {
    if (t.c === 0) localStorage.removeItem(TINT_KEY)
    else localStorage.setItem(TINT_KEY, JSON.stringify(t))
  } catch {
    // Storage blocked: the color lasts for this visit only.
  }
}

const swatchStop = (h: number, c: number) =>
  `oklch(${0.86 - c * 0.12} ${0.04 + c * 0.11} ${h})`

/** Swatch / handle color for a tint (a stronger version of the chrome). */
export function tintSwatch(t: Tint) {
  if (t.c === 0) return "oklch(0.97 0 0)"
  if (t.g)
    return `linear-gradient(135deg in oklab, ${swatchStop(t.h, t.c)}, ${swatchStop(t.g[0], t.c)} 55%, ${swatchStop(t.g[1], t.c)})`
  return swatchStop(t.h, t.c)
}

/** Same tint (hue and intensity close, same gradient), for active swatches. */
export function sameTint(a: Tint, b: Tint) {
  if (a.c === 0 || b.c === 0) return a.c === b.c
  const close = (x: number, y: number) =>
    Math.min(Math.abs(x - y), 360 - Math.abs(x - y)) < 8
  return (
    close(a.h, b.h) &&
    Math.abs(a.c - b.c) < 0.08 &&
    Boolean(a.g) === Boolean(b.g) &&
    (!a.g || (close(a.g[0], b.g![0]) && close(a.g[1], b.g![1])))
  )
}

/**
 * Runs in <head> before paint so the chrome never flashes gray. Kept in
 * step with normalizeTint / gradientCss above (same math, plain ES5).
 */
export const TINT_SCRIPT = `try{var t=JSON.parse(localStorage.getItem("${TINT_KEY}")||"null");if(t&&isFinite(t.h)&&isFinite(t.c)){var r=document.documentElement,s=r.style,c=Math.min(1,Math.max(0,t.c));s.setProperty("--tint-h",String(t.h));s.setProperty("--tint-c",String(c));if(c>0&&t.g&&t.g.length===2&&isFinite(t.g[0])&&isFinite(t.g[1])){var p=function(h){return"oklch(var(--grad-l) calc(var(--grad-c) * "+c+") "+h+")"};s.setProperty("--chrome-gradient","radial-gradient(70% 55% at 100% 0%, "+p(t.g[0])+", transparent 75%), radial-gradient(55% 75% at 0% 100%, "+p(t.g[1])+", transparent 75%), linear-gradient(160deg in oklab, "+p(t.h)+" 0%, "+p(t.g[1])+" 100%)");r.setAttribute("data-chrome-gradient","")}}}catch(e){}`
