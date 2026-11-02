"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

/** Public bucket, one folder per person: avatars/<profile id>/<file>. */
export const AVATAR_BUCKET = "avatars"
/** Pictures are stored square at this size. */
export const AVATAR_SIZE = 512
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024
export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"]

/** Why a picked file can't be used, or null when it can. */
export function avatarFileProblem(file: File): "type" | "size" | null {
  if (!AVATAR_TYPES.includes(file.type)) return "type"
  if (file.size > AVATAR_MAX_BYTES) return "size"
  return null
}

/** Every file in the person's folder except `keep`, removed. */
async function clearFolder(profileId: string, keep?: string) {
  const supabase = createClient()
  const { data } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(profileId, { limit: 100 })
  const stale = ((data ?? []) as { name: string }[])
    .map((f) => `${profileId}/${f.name}`)
    .filter((path) => path !== keep)
  if (stale.length) await supabase.storage.from(AVATAR_BUCKET).remove(stale)
}

/**
 * Stores a cropped picture as the person's avatar: a fresh file name each
 * time (no stale cached image), then profiles.avatar_url, then the old
 * files in their folder go.
 */
export async function uploadAvatar(profileId: string, picture: Blob) {
  const supabase = createClient()
  const ext = picture.type === "image/webp" ? "webp" : "jpg"
  const path = `${profileId}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, picture, {
      contentType: picture.type,
      cacheControl: "31536000",
    })
  if (uploadError) throw uploadError
  const url = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
    .data.publicUrl
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", profileId)
  if (error) {
    await supabase.storage.from(AVATAR_BUCKET).remove([path])
    throw error
  }
  await clearFolder(profileId, path).catch(() => {})
  return url
}

/** Back to the initial: avatar_url cleared, the stored files removed. */
export async function removeAvatar(profileId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", profileId)
  if (error) throw error
  await clearFolder(profileId).catch(() => {})
}

/**
 * After a picture changes: every cached query and server-rendered page may
 * show it (header, team lists, projects, reports), so refetch them all.
 */
export function useAvatarChanged() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useCallback(() => {
    void queryClient.invalidateQueries()
    router.refresh()
  }, [queryClient, router])
}

/**
 * Crops `image` to the square at (`x`, `y`) of side `side` (image pixels)
 * and encodes it at AVATAR_SIZE: WebP where the browser can, JPEG on white
 * otherwise.
 */
export async function renderAvatar(
  image: CanvasImageSource,
  crop: { x: number; y: number; side: number },
): Promise<Blob> {
  const draw = (background?: string) => {
    const canvas = document.createElement("canvas")
    canvas.width = AVATAR_SIZE
    canvas.height = AVATAR_SIZE
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas unavailable")
    if (background) {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
    }
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.side,
      crop.side,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    )
    return canvas
  }
  const toBlob = (canvas: HTMLCanvasElement, type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9))

  const webp = await toBlob(draw(), "image/webp")
  if (webp && webp.type === "image/webp") return webp
  const jpeg = await toBlob(draw("#ffffff"), "image/jpeg")
  if (!jpeg) throw new Error("Could not encode the picture")
  return jpeg
}
