import { AppIcon } from "@/components/app-icon"
import { BrandBackdrop } from "@/components/brand-backdrop"
import {
  ScreenControls,
  screenBackgroundClass,
} from "@/components/minimal-screen"
import { PageTranslator } from "@/components/page-translator"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { cn } from "@/lib/utils"
import { BriefForm } from "@/page-slices/briefs/ui/BriefForm"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { briefByToken } from "@/shared/lib/briefs/server"
import { publicOrigin, SITE_NAME } from "@/shared/og/site"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { after } from "next/server"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const [brief, origin] = await Promise.all([
    briefByToken(token),
    publicOrigin(),
  ])
  const title = brief ? `${brief.title} · ${SITE_NAME}` : SITE_NAME
  return {
    metadataBase: new URL(origin),
    title,
    description: "A project brief from Kretya Studio.",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  }
}

/**
 * A brief the client fills (/b/<token>, the client site): the secret link
 * is the key, no account or PIN. English, with Google Translate.
 */
export default async function BriefPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const brief = await briefByToken(token)
  if (!brief) notFound()
  const admin = createAdminClient()
  const [{ data: files }, { data: seen }] = await Promise.all([
    admin
      .from("brief_files")
      .select("id, name, file_size, question_id")
      .eq("brief_id", brief.id)
      .order("created_at"),
    admin
      .from("briefs")
      .select("opened_at, saved_at")
      .eq("id", brief.id)
      .single(),
  ])
  // First visit: the team sees "Dibuka".
  if (!seen?.opened_at)
    after(async () => {
      await admin
        .from("briefs")
        .update({ opened_at: new Date().toISOString() })
        .eq("id", brief.id)
        .is("opened_at", null)
    })

  return (
    // The form as a card filling the screen on a darker backdrop (like the
    // app's shell); only the card's middle scrolls.
    <main
      className={cn(screenBackgroundClass, "flex h-dvh flex-col p-2 sm:p-4")}
    >
      <BrandBackdrop />
      {/* Translate and theme sit outside the card, top right. */}
      <ScreenControls>
        <PageTranslator source="en" className="h-9 rounded-full px-3 text-sm" />
        <ThemeToggleButton className="size-9 rounded-full" />
      </ScreenControls>
      <BriefForm
        logo={<AppIcon size={192} className="rounded-tile size-12" />}
        names={
          <div className="flex flex-col items-center" translate="no">
            <span className="text-title font-medium">Kretya Studio</span>
            {brief.client?.name && (
              <span className="text-muted-foreground text-meta">
                {brief.client.name}
              </span>
            )}
          </div>
        }
        data={{
          token: brief.token,
          title: brief.title,
          clientName:
            brief.client?.contact_name?.trim() || brief.client?.name || null,
          sections: brief.sections,
          sets: brief.sets,
          offers: brief.offers,
          declined: brief.declined,
          accepted: brief.accepted ?? [],
          answers: brief.answers,
          files: files ?? [],
          savedAt: seen?.saved_at ?? null,
          submitted: brief.status === "submitted",
        }}
      />
    </main>
  )
}
