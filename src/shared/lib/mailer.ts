import { readFile } from "fs/promises"
import nodemailer, { type Transporter } from "nodemailer"
import path from "path"
import { EMAIL_LOGO_PATH, EMAIL_LOGO_PNG } from "./email-logo"

/**
 * Outgoing mail over SMTP (Hostinger: smtp.hostinger.com, 465). Set
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and NOTIFY_EMAIL_FROM; until
 * then nothing is sent.
 */
export function mailConfigured() {
  const e = process.env
  return Boolean(
    e.SMTP_HOST && e.SMTP_USER && e.SMTP_PASS && e.NOTIFY_EMAIL_FROM,
  )
}

let transport: Transporter | null = null

function transporter() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 465
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 465 is TLS from the start; 587 upgrades with STARTTLS.
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      pool: true,
      maxConnections: 2,
    })
  }
  return transport
}

/** The bare address in NOTIFY_EMAIL_FROM ("Name <a@b>" or "a@b"). */
function fromAddress() {
  const from = process.env.NOTIFY_EMAIL_FROM ?? ""
  return from.match(/<([^>]+)>/)?.[1] ?? from.trim()
}

type Inline = { cid: string; content: Buffer; contentType: string }

/** One picture's bytes: our own icons straight from /public, anything else
 *  (avatars in storage) over the network. Null when it can't be had. */
async function loadImage(url: string) {
  const { pathname } = new URL(url)
  if (pathname === EMAIL_LOGO_PATH)
    return { content: EMAIL_LOGO_PNG, contentType: "image/png" }
  if (pathname.startsWith("/icons/")) {
    try {
      const file = path.join(process.cwd(), "public", pathname)
      return { content: await readFile(file), contentType: "image/png" }
    } catch {
      // Not on disk here: fall through to fetching it.
    }
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") ?? "image/png"
    if (!contentType.startsWith("image/")) return null
    return { content: Buffer.from(await res.arrayBuffer()), contentType }
  } catch {
    return null
  }
}

/**
 * Carries the email's pictures inside it (cid: attachments) instead of
 * linking them: the app and storage sit on the private network, which
 * Gmail's image proxy can't reach. A picture that can't be loaded keeps
 * its link.
 */
export async function inlineImages(html: string) {
  const urls = [
    ...new Set(
      [...html.matchAll(/<img[^>]+src="(https:\/\/[^"]+)"/g)].map((m) => m[1]),
    ),
  ]
  const attachments: Inline[] = []
  let out = html
  for (const [i, raw] of urls.entries()) {
    // The template escapes &, so undo that to fetch the real URL.
    const url = raw.replace(/&amp;/g, "&")
    const image = await loadImage(url)
    if (!image) continue
    const cid = `img${i}@kretya-flow`
    attachments.push({ cid, ...image })
    out = out.split(`src="${raw}"`).join(`src="cid:${cid}"`)
  }
  return { html: out, attachments }
}

/** True when the server accepted it. `fromName` replaces the sender's
 *  display name ("Habibi via Kretya Flow"); the address stays ours. */
export async function sendMail(
  to: string,
  subject: string,
  html: string,
  fromName?: string,
  /** A stable id for the conversation (one task's comments), so mail
   *  apps thread the emails together. */
  thread?: string,
) {
  const ref = thread
    ? `<${thread}@${fromAddress().split("@")[1] ?? "kretyastudio.com"}>`
    : undefined
  try {
    const inline = await inlineImages(html)
    await transporter().sendMail({
      from: fromName
        ? { name: fromName, address: fromAddress() }
        : process.env.NOTIFY_EMAIL_FROM,
      to,
      subject,
      html: inline.html,
      attachments: inline.attachments.map((a, i) => ({
        cid: a.cid,
        content: a.content,
        contentType: a.contentType,
        filename: `image-${i}.${a.contentType.split("/")[1]?.split(";")[0] || "png"}`,
        contentDisposition: "inline" as const,
      })),
      ...(ref ? { inReplyTo: ref, references: [ref] } : {}),
    })
    return true
  } catch (error) {
    console.error("[mailer] send failed", (error as Error).message)
    return false
  }
}

/** Signs in to the SMTP server without sending anything: null when it
 *  works, else why not. */
export async function verifyMail() {
  try {
    await transporter().verify()
    return null
  } catch (error) {
    return (error as Error).message
  }
}
