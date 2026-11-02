/**
 * Every picture uploaded in the app goes through here first: scaled down to
 * at most 2560px on its longest side and re-encoded at ~85% quality. By
 * default it keeps its own format (a PNG stays a PNG: library files and
 * documents are deliverables). Pictures embedded in writing (reports,
 * notes, tasks, leave proof) pass `{ webp: true }`: WebP keeps transparency
 * and makes screenshots several times smaller than PNG. SVG and GIF
 * (vector / animated) are left alone, and so is anything the result
 * wouldn't make smaller. Callers that offer "keep original resolution" just
 * skip this.
 */

const SKIP = /^image\/(svg\+xml|gif)$/
const MAX_SIDE = 2560

export function isCompressible(file: File) {
  return file.type.startsWith("image/") && !SKIP.test(file.type)
}

export async function compressImage(
  file: File,
  { webp = false }: { webp?: boolean } = {},
): Promise<File> {
  if (!isCompressible(file)) return file
  try {
    const { default: imageCompression } =
      await import("browser-image-compression")
    const type = webp ? "image/webp" : file.type
    const out = await imageCompression(file, {
      maxWidthOrHeight: MAX_SIDE,
      maxSizeMB: 2,
      initialQuality: webp ? 0.82 : 0.85,
      useWebWorker: true,
      fileType: type,
    })
    if (out.size >= file.size) return file
    // The name follows the format, so storage serves the right type.
    const name =
      out.type === "image/webp" && file.type !== "image/webp"
        ? file.name.replace(/\.[^./]+$/, "") + ".webp"
        : file.name
    return new File([out], name, {
      type: out.type || type,
      lastModified: file.lastModified,
    })
  } catch {
    // A picture the browser can't decode still uploads as it is.
    return file
  }
}
