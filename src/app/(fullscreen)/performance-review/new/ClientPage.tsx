"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  ReviewFormFields,
  useReviewForm,
} from "@/page-slices/performance/ui/review/ReviewForm"
import { useT } from "@/shared/i18n/client"
import { RiArrowLeftLine } from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Colleague = {
  id: string
  full_name: string | null
  job_title: string | null
}

/** 360 review form: one teammate, five criteria, three short notes. */
export default function ReviewFormClientPage({
  cycleId,
  colleagues,
  initialRevieweeId,
}: {
  cycleId: string
  colleagues: Colleague[]
  initialRevieweeId?: string
}) {
  const t = useT("performance")
  const tc = useT("common")
  const router = useRouter()
  const [revieweeId, setRevieweeId] = useState(initialRevieweeId ?? "")
  const form = useReviewForm(cycleId, revieweeId)
  const { touched, canSubmit, loading } = form
  const [confirmLeave, setConfirmLeave] = useState(false)

  const leave = () =>
    touched ? setConfirmLeave(true) : router.push("/performance")

  const submit = async () => {
    if (!(await form.submit())) return
    router.push("/performance")
    router.refresh()
  }

  const selected = colleagues.find((c) => c.id === revieweeId)

  return (
    <div className="min-h-screen">
      <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={leave}
            aria-label={tc("back")}
          >
            <RiArrowLeftLine className="size-4" />
          </Button>
          <span className="text-sm font-medium">{t("tab360")}</span>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">{t("reviewTeammates")}</h1>
          <p className="text-muted-foreground text-sm">{t("formIntro")}</p>
        </div>

        <section className="flex flex-col gap-2">
          <Label htmlFor="colleague">{t("peer")}</Label>
          <Select
            value={revieweeId || null}
            onValueChange={(v) => setRevieweeId(v ?? "")}
          >
            <SelectTrigger id="colleague" className="w-full">
              <SelectValue placeholder={t("pickPeer")}>
                {() =>
                  selected
                    ? `${selected.full_name}${selected.job_title ? ` · ${selected.job_title}` : ""}`
                    : t("pickPeer")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {colleagues.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.full_name}
                  {c.job_title ? ` · ${c.job_title}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {revieweeId && (
          <>
            <ReviewFormFields form={form} />

            <div className="flex items-center justify-end gap-3 pb-8">
              {!canSubmit && (
                <span className="text-muted-foreground text-xs">
                  {t("completeAllFields")}
                </span>
              )}
              <Button onClick={submit} disabled={loading || !canSubmit}>
                {loading && <Spinner data-icon="inline-start" />}
                {t("submitReview")}
              </Button>
            </div>
          </>
        )}
      </main>

      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("leaveReviewTitle")}</DialogTitle>
            <DialogDescription>{t("unsavedEntries")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLeave(false)}>
              {t("keepFilling")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => router.push("/performance")}
            >
              {t("leave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
