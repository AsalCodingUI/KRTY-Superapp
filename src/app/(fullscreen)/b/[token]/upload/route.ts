import { createAdminClient } from "@/shared/api/supabase/admin"
import {
  attachBriefFiles,
  BRIEF_BUCKET,
  briefByToken,
  briefFileDir,
  freePath,
} from "@/shared/lib/briefs/server"
import { BRIEF_FILE_MAX, BRIEF_TOTAL_MAX } from "@/shared/lib/briefs/types"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 600

const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status })

/**
 * POST /b/<token>/upload: one file from the client, the raw body (name in
 * `x-file-name`, the question in `x-question-id`). Streamed to storage as
 * it is (never recompressed): storage isn't reachable from the client
 * site, so it goes through the app. Up to 200 MB a file, 1 GB a brief.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const brief = await briefByToken(token)
  if (!brief) return fail("This link is no longer active.", 404)
  const name = decodeURIComponent(request.headers.get("x-file-name") ?? "")
    .replace(/[/\\]/g, "_")
    .slice(0, 200)
  const questionId = (request.headers.get("x-question-id") ?? "files").slice(
    0,
    80,
  )
  const size = Number(request.headers.get("content-length") ?? 0)
  if (!name || !request.body) return fail("No file.")
  if (!size || size > BRIEF_FILE_MAX)
    return fail("Files can be up to 200 MB each.", 413)

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from("brief_files")
    .select("file_size")
    .eq("brief_id", brief.id)
  const used = (existing ?? []).reduce((sum, f) => sum + Number(f.file_size), 0)
  if (used + size > BRIEF_TOTAL_MAX)
    return fail("This brief can hold up to 1 GB of files.", 413)

  const type = request.headers.get("content-type") || "application/octet-stream"
  const path = await freePath(await briefFileDir(brief), name)
  const { error } = await admin.storage
    .from(BRIEF_BUCKET)
    .upload(path, request.body, { contentType: type, duplex: "half" })
  if (error) return fail("The upload didn't go through. Please try again.", 502)

  const { data: row, error: rowError } = await admin
    .from("brief_files")
    .insert({
      brief_id: brief.id,
      question_id: questionId,
      name,
      file_path: path,
      file_size: size,
      mime_type: type,
    })
    .select("id, name, file_size, question_id")
    .single()
  if (rowError || !row) {
    await admin.storage.from(BRIEF_BUCKET).remove([path])
    return fail("The upload didn't go through. Please try again.", 500)
  }
  // A project brief: straight into its library (and the client portal).
  if (brief.project_id) await attachBriefFiles(brief.id)
  return NextResponse.json({ file: row })
}
