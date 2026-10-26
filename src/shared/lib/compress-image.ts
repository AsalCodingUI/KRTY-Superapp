/**
 * Every picture uploaded in the app goes through here first: scaled down to
 * at most 2560px on its longest side and re-encoded at ~85% quality, in its
 * own format (a PNG stays a PNG). SVG and GIF (vector / animated) are left
 * alone, and so is anything the result wouldn't make smaller. Callers that
 * offer "keep original resolution" just skip this.
 */

const SKIP = /^image\/(svg\+xml|gif)$/
const MAX_SIDE = 2560

export function isCompressible(file: File) {
  return file.type.startsWith("image/") && !SKIP.test(file.type)
}

export async function compressImage(file: File): Promise<File> {
  if (!isCompressible(file)) return file
  try {
    const { default: imageCompression } =
      await import("browser-image-compression")
    const out = await imageCompression(file, {
      maxWidthOrHeight: MAX_SIDE,
      maxSizeMB: 2,
      initialQuality: 0.85,
      useWebWorker: true,
      fileType: file.type,
    })
    if (out.size >= file.size) return file
    return new File([out], file.name, {
      type: out.type || file.type,
      lastModified: file.lastModified,
    })
  } catch {
    // A picture the browser can't decode still uploads as it is.
    return file
  }
}
