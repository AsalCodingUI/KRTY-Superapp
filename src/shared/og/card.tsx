import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import type { ReactNode } from "react"
import { cardText, clampText } from "@/shared/lib/og-text"

/*
 * Kretya's link-preview card (1200×630, next/og): a near-black canvas and
 * one floating app panel, like the app's sidebar, that bleeds off the
 * bottom edge. The rows tell what the link is: a report (project, title,
 * its sections, maybe its first picture), a client portal (the project's
 * name and the portal's pages) or the studio itself. Sizes sit on an 8pt
 * grid and are large enough to read in a chat's small preview.
 */

export const CARD_SIZE = { width: 1200, height: 630 }
export const CARD_TYPE = "image/png"
/** Previews refresh within the hour; a report's card URL carries its
 *  last edit, so an edited report gets a new card right away. */
export const CARD_CACHE =
  "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"

/**
 * The canvas behind the panel:
 *  A  soft diagonal dry-brush strokes
 *  B  a soft spotlight with a vignette and fine grain
 *  C  a dot grid fading out from the panel
 *  D  dark gradient with a faint glow in the app icon's pink and orange
 */
export type CardBackground = "A" | "B" | "C" | "D"
export const CARD_BACKGROUND: CardBackground = "C"

const INK = "rgba(255,255,255,0.92)"
const SOFT = "rgba(255,255,255,0.72)"
const MUTED = "rgba(255,255,255,0.5)"
const FAINT = "rgba(255,255,255,0.38)"
const CANVAS = "#161616"
const PANEL = "#1f1f1f"
const ACTIVE = "#2a2a2a"

// 8pt grid.
const PANEL_WIDTH = 720
const PANEL_TOP = 48
const PAD = 32
const ROW = 56
const ROW_X = 16
const GAP = 16
const LEAD = 40
const TEXT = 32
const LABEL = 24
const ICON = 30

/** A report's first picture: full panel width under its sections. */
export const THUMB = { width: 624, height: 320 }

const COLUMN = { display: "flex", flexDirection: "column" } as const

/* ---------- assets (read once per server process) ---------- */

const PUBLIC = join(process.cwd(), "public")
let assets: Promise<{
  fonts: { name: string; data: Buffer; weight: 400 | 500 | 600 }[]
  mark: string
}> | null = null

function loadAssets() {
  assets ??= (async () => {
    const [regular, medium, semibold, mark] = await Promise.all([
      readFile(join(PUBLIC, "fonts/og/Geist-Regular.ttf")),
      readFile(join(PUBLIC, "fonts/og/Geist-Medium.ttf")),
      readFile(join(PUBLIC, "fonts/og/Geist-SemiBold.ttf")),
      // The white mark on a transparent background (the app's dark-mode
      // logo), no tile.
      readFile(join(PUBLIC, "icons/mark-dark-96.png")),
    ])
    return {
      fonts: [
        { name: "Geist", data: regular, weight: 400 as const },
        { name: "Geist", data: medium, weight: 500 as const },
        { name: "Geist", data: semibold, weight: 600 as const },
      ],
      mark: `data:image/png;base64,${mark.toString("base64")}`,
    }
  })().catch((error) => {
    assets = null
    throw error
  })
  return assets
}

/* ---------- icons (lucide paths, drawn in the card) ---------- */

const ICONS = {
  file: [
    <path key="0" d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />,
    <path key="1" d="M14 2v4a2 2 0 0 0 2 2h4" />,
    <path key="2" d="M16 13H8" />,
    <path key="3" d="M16 17H8" />,
    <path key="4" d="M10 9H8" />,
  ],
  hash: [
    <path key="0" d="M4 9h16" />,
    <path key="1" d="M4 15h16" />,
    <path key="2" d="M10 3 8 21" />,
    <path key="3" d="M16 3l-2 18" />,
  ],
  folder: [
    <path key="0" d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />,
  ],
  grid: [
    <rect key="0" width="7" height="7" x="3" y="3" rx="1.5" />,
    <rect key="1" width="7" height="7" x="14" y="3" rx="1.5" />,
    <rect key="2" width="7" height="7" x="3" y="14" rx="1.5" />,
    <rect key="3" width="7" height="7" x="14" y="14" rx="1.5" />,
  ],
  newspaper: [
    <path key="0" d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />,
    <path key="1" d="M18 14h-8" />,
    <path key="2" d="M15 18h-5" />,
    <path key="3" d="M10 6h8v4h-8V6Z" />,
  ],
  calendar: [
    <path key="0" d="M8 2v4" />,
    <path key="1" d="M16 2v4" />,
    <rect key="2" width="18" height="18" x="3" y="4" rx="2" />,
    <path key="3" d="M3 10h18" />,
  ],
  search: [
    <circle key="0" cx="11" cy="11" r="8" />,
    <path key="1" d="m21 21-4.3-4.3" />,
  ],
  bell: [
    <path key="0" d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />,
    <path key="1" d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />,
  ],
  check: [
    <rect key="0" width="18" height="18" x="3" y="3" rx="2" />,
    <path key="1" d="m9 12 2 2 4-4" />,
  ],
}
type IconName = keyof typeof ICONS

function Icon({
  name,
  size = ICON,
  color = MUTED,
}: {
  name: IconName
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  )
}

/* ---------- backgrounds ---------- */

/** Deterministic noise, so a card renders the same every time. */
function noise(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

/**
 * One wide diagonal dry-brush stroke: a faint body (a few broad, soft
 * passes) and fine bristle marks of uneven length and strength, thinning
 * out towards the stroke's edges.
 */
function brush(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  opacity: number,
  seed: number,
) {
  const rand = noise(seed)
  const len = Math.hypot(x2 - x1, y2 - y1)
  const nx = -(y2 - y1) / len
  const ny = (x2 - x1) / len
  const at = (t: number, off: number) =>
    [x1 + (x2 - x1) * t + nx * off, y1 + (y2 - y1) * t + ny * off] as const
  const marks: ReactNode[] = []
  for (let i = 0; i < 5; i++) {
    const off = (rand() - 0.5) * width * 0.5
    const [sx, sy] = at(0.02 + rand() * 0.08, off)
    const [ex, ey] = at(0.85 + rand() * 0.13, off)
    marks.push(
      <line
        key={`b${i}`}
        x1={sx}
        y1={sy}
        x2={ex}
        y2={ey}
        stroke="#ffffff"
        strokeOpacity={opacity * 0.22}
        strokeWidth={width * (0.25 + rand() * 0.3)}
        strokeLinecap="round"
      />,
    )
  }
  for (let i = 0; i < 34; i++) {
    const u = rand() - 0.5
    const off = u * width
    const edge = 1 - Math.abs(u) * 1.6
    const start = rand() * 0.3 + (1 - edge) * 0.15
    const end = 0.6 + rand() * 0.4 * Math.max(edge, 0.3)
    const drift = (rand() - 0.5) * 10
    const [sx, sy] = at(start, off)
    const [ex, ey] = at(end, off + drift)
    marks.push(
      <line
        key={i}
        x1={sx}
        y1={sy}
        x2={ex}
        y2={ey}
        stroke="#ffffff"
        strokeOpacity={opacity * (0.15 + rand() * 0.55) * Math.max(edge, 0.25)}
        strokeWidth={2 + rand() * rand() * 9}
        strokeLinecap="round"
      />,
    )
  }
  return <g key={seed}>{marks}</g>
}

const FULL = {
  position: "absolute",
  left: 0,
  top: 0,
  width: CARD_SIZE.width,
  height: CARD_SIZE.height,
  display: "flex",
} as const

function Backdrop({ kind }: { kind: CardBackground }) {
  const { width, height } = CARD_SIZE
  if (kind === "B") {
    // Spotlight from above the panel, vignette to the corners, and a fine
    // grain: sparse specks (cheap to compress, unlike per-pixel noise).
    const rand = noise(11)
    const specks: ReactNode[] = []
    for (let i = 0; i < 2400; i++) {
      specks.push(
        <rect
          key={i}
          x={Math.floor(rand() * width)}
          y={Math.floor(rand() * height)}
          width={1}
          height={1}
          fill="#ffffff"
          fillOpacity={0.08 + rand() * 0.1}
        />,
      )
    }
    return (
      <div style={FULL}>
        <div
          style={{
            ...FULL,
            backgroundImage:
              "radial-gradient(ellipse 55% 80% at 50% 0%, rgba(255,255,255,0.16), rgba(255,255,255,0) 100%)",
          }}
        />
        <div
          style={{
            ...FULL,
            backgroundImage:
              "radial-gradient(ellipse 85% 95% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
          {specks}
        </svg>
      </div>
    )
  }
  if (kind === "C") {
    // A dot grid every 24px, fading out away from the panel.
    // Strongest around the panel, gone towards the corners.
    const fade = (x: number, y: number) => {
      const d = Math.hypot((x - width / 2) / (width / 2), (y - height * 0.4) / height)
      return Math.max(0, Math.min(1, 1.25 - d))
    }
    const dots: ReactNode[] = []
    for (let y = 12; y < height; y += 24) {
      for (let x = 12; x < width; x += 24) {
        dots.push(
          <rect
            key={`${x}.${y}`}
            x={x - 1.5}
            y={y - 1.5}
            width={3}
            height={3}
            rx={1.5}
            fill="#ffffff"
            fillOpacity={0.22 * fade(x, y)}
          />,
        )
      }
    }
    return (
      <div style={FULL}>
        <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
          {dots}
        </svg>
      </div>
    )
  }
  if (kind === "D") {
    // The app icon's colors as a faint glow from two corners.
    return (
      <div style={FULL}>
        <div
          style={{
            ...FULL,
            backgroundImage: `linear-gradient(160deg, #1b1b1b 0%, ${CANVAS} 45%, #111111 100%)`,
          }}
        />
        <div
          style={{
            ...FULL,
            backgroundImage:
              "radial-gradient(circle 520px at 0% 0%, rgba(255,92,64,0.26), rgba(255,92,64,0) 100%)",
          }}
        />
        <div
          style={{
            ...FULL,
            backgroundImage:
              "radial-gradient(circle 560px at 100% 100%, rgba(214,64,190,0.22), rgba(214,64,190,0) 100%)",
          }}
        />
      </div>
    )
  }
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      {brush(-120, 600, 560, -60, 260, 0.1, 7)}
      {brush(640, 760, 1300, 80, 300, 0.08, 19)}
      {brush(820, -80, 1280, 330, 160, 0.06, 31)}
      {brush(-60, 120, 260, 740, 120, 0.05, 43)}
    </svg>
  )
}

/* ---------- panel parts ---------- */

const BADGE_COLORS = ["#f97316", "#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#eab308", "#ef4444"]

function Badge({ name }: { name: string }) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const initial = (name.trim()[0] ?? "K").toUpperCase()
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: LEAD,
        height: LEAD,
        borderRadius: 12,
        background: BADGE_COLORS[hash % BADGE_COLORS.length],
        color: "#ffffff",
        fontSize: 22,
        fontWeight: 600,
      }}
    >
      {initial}
    </div>
  )
}

function Header({ mark }: { mark: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 8,
        padding: 8,
        borderRadius: 999,
        background: "#181818",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: GAP,
          height: 48,
          padding: "0 24px 0 8px",
          borderRadius: 999,
          background: ACTIVE,
        }}
      >
        <div style={{ display: "flex", width: LEAD, justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={24} height={24} alt="" />
        </div>
        <span style={{ fontSize: 28, fontWeight: 600, color: INK }}>
          Kretya Studio
        </span>
      </div>
      {(["search", "bell"] as const).map((name) => (
        <div
          key={name}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
          }}
        >
          <Icon name={name} color={FAINT} />
        </div>
      ))}
    </div>
  )
}

function Label({ children, aside }: { children: string; aside?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 32,
        padding: `0 ${ROW_X}px`,
        marginTop: 32,
        marginBottom: 8,
        fontSize: LABEL,
        fontWeight: 500,
        color: MUTED,
      }}
    >
      <span>{children}</span>
      {aside && <span style={{ color: MUTED, fontWeight: 400 }}>{aside}</span>}
    </div>
  )
}

function Row({
  lead,
  children,
  active = false,
  color = INK,
  weight = 500,
  size = TEXT,
  lines = 1,
}: {
  lead: ReactNode
  children: string
  active?: boolean
  color?: string
  weight?: 400 | 500 | 600
  size?: number
  lines?: 1 | 2
}) {
  const lineHeight = 40
  return (
    <div
      style={{
        display: "flex",
        alignItems: lines > 1 ? "flex-start" : "center",
        gap: GAP,
        minHeight: ROW,
        padding: lines > 1 ? `8px ${ROW_X}px` : `0 ${ROW_X}px`,
        borderRadius: 12,
        background: active ? ACTIVE : "transparent",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: LEAD,
          height: lines > 1 ? lineHeight : ROW,
          flexShrink: 0,
        }}
      >
        {lead}
      </div>
      <div
        style={{
          display: "block",
          flex: 1,
          fontSize: size,
          fontWeight: weight,
          lineHeight: `${lineHeight}px`,
          color,
          overflow: "hidden",
          lineClamp: lines,
          ...(lines === 1 && { whiteSpace: "nowrap", textOverflow: "ellipsis" }),
        }}
      >
        {children}
      </div>
    </div>
  )
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        left: (CARD_SIZE.width - PANEL_WIDTH) / 2,
        top: PANEL_TOP,
        width: PANEL_WIDTH,
        // Taller than what's left of the canvas: it runs off the bottom.
        height: CARD_SIZE.height,
        display: "flex",
        flexDirection: "column",
        padding: PAD,
        borderRadius: 28,
        background: PANEL,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </div>
  )
}

/* ---------- cards ---------- */

export type ShareCard =
  | {
      kind: "report"
      project: string | null
      title: string
      date: string
      headings: string[]
      thumbnail: string | null
      /** The same picture fetched smaller (cheaper to encode). */
      thumbnailLow?: string | null
    }
  | { kind: "portal"; project: string }
  | { kind: "studio" }

function Body({ card }: { card: ShareCard }) {
  if (card.kind === "report") {
    const project = cardText(card.project ?? "")
    const title = clampText(cardText(card.title) || "Report", 80)
    const twoLines = title.length > 36
    const headings = card.headings
      .map((h) => cardText(h))
      .filter(Boolean)
      // With a picture, one section row keeps it in view.
      .slice(0, card.thumbnail ? 1 : twoLines ? 2 : 3)
    return (
      <div style={COLUMN}>
        {project && (
          <div style={COLUMN}>
            <Label>Project</Label>
            <Row lead={<Badge name={project} />}>{project}</Row>
          </div>
        )}
        <Label aside={card.date}>Report</Label>
        <Row
          active
          lead={<Icon name="file" color={INK} />}
          size={twoLines ? 30 : TEXT}
          weight={600}
          lines={twoLines ? 2 : 1}
        >
          {title}
        </Row>
        {headings.map((heading, i) => (
          <Row
            key={i}
            lead={<Icon name="hash" color={FAINT} />}
            weight={400}
            color={SOFT}
          >
            {heading}
          </Row>
        ))}
        {card.thumbnail && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: GAP,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.thumbnail}
              width={THUMB.width}
              height={THUMB.height}
              alt=""
              style={{
                objectFit: "cover",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>
        )}
      </div>
    )
  }
  if (card.kind === "portal") {
    const project = cardText(card.project) || "Project"
    // The portal sidebar's own pages (PortalShell), nothing of the project.
    const pages: [IconName, string][] = [
      ["grid", "Dashboard"],
      ["newspaper", "Reports"],
      ["file", "Documents"],
      ["folder", "Library & assets"],
    ]
    return (
      <div style={COLUMN}>
        <Label>Client portal</Label>
        <Row active lead={<Badge name={project} />} weight={600}>
          {project}
        </Row>
        {pages.map(([icon, label]) => (
          <Row key={label} lead={<Icon name={icon} />} weight={400} color={SOFT}>
            {label}
          </Row>
        ))}
      </div>
    )
  }
  const items: [IconName, string][] = [
    ["file", "Reports"],
    ["check", "Tasks"],
    ["calendar", "Calendar"],
  ]
  return (
    <div style={COLUMN}>
      <Label>Workspace</Label>
      <Row active lead={<Icon name="folder" color={INK} />} weight={600}>
        Projects
      </Row>
      {items.map(([icon, label]) => (
        <Row key={label} lead={<Icon name={icon} />} weight={400} color={SOFT}>
          {label}
        </Row>
      ))}
    </div>
  )
}

/** WhatsApp drops a preview image over 300 KB. */
const MAX_BYTES = 290_000

async function renderPng(card: ShareCard, background: CardBackground) {
  const { fonts, mark } = await loadAssets()
  const image = new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          background: CANVAS,
          fontFamily: "Geist",
          overflow: "hidden",
        }}
      >
        <Backdrop kind={background} />
        <Panel>
          <Header mark={mark} />
          <Body card={card} />
        </Panel>
      </div>
    ),
    { ...CARD_SIZE, fonts },
  )
  return image.arrayBuffer()
}

/**
 * The card as a PNG response (1200×630), cached for an hour. A busy
 * picture can push a report's card past WhatsApp's limit; it's drawn
 * again from a smaller copy of the picture then (smoother, so it packs
 * smaller), and only without it as a last resort.
 */
export async function renderShareCard(
  card: ShareCard,
  background: CardBackground = CARD_BACKGROUND,
) {
  let png = await renderPng(card, background)
  if (card.kind === "report" && card.thumbnail) {
    if (png.byteLength > MAX_BYTES && card.thumbnailLow) {
      png = await renderPng({ ...card, thumbnail: card.thumbnailLow }, background)
    }
    if (png.byteLength > MAX_BYTES) {
      png = await renderPng({ ...card, thumbnail: null }, background)
    }
  }
  return new Response(png, {
    headers: {
      "content-type": CARD_TYPE,
      "content-length": String(png.byteLength),
      "cache-control": CARD_CACHE,
    },
  })
}
