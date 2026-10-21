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
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { RiArrowLeftLine, RiStarFill } from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

type Colleague = {
  id: string
  full_name: string | null
  job_title: string | null
}

const CRITERIA = [
  {
    key: "quality",
    label: "Kualitas kerja",
    hint: "Hasil kerja rapi, teliti, sesuai standar",
  },
  {
    key: "reliability",
    label: "Keandalan & deadline",
    hint: "Bisa diandalkan dan tepat waktu",
  },
  {
    key: "communication",
    label: "Komunikasi",
    hint: "Jelas, responsif, terbuka",
  },
  {
    key: "initiative",
    label: "Inisiatif & berkembang",
    hint: "Proaktif dan mau belajar",
  },
  {
    key: "leadership",
    label: "Kepemimpinan & kerja tim",
    hint: "Membantu dan menggerakkan tim",
  },
] as const

type CriterionKey = (typeof CRITERIA)[number]["key"]

const FEEDBACK = [
  {
    key: "feedback_continue",
    label: "Pertahankan",
    hint: "Hal baik yang perlu terus dilakukan",
    placeholder: "Contoh: sangat teliti di detail desain…",
  },
  {
    key: "feedback_start",
    label: "Mulai lakukan",
    hint: "Hal baru yang sebaiknya mulai dilakukan",
    placeholder: "Contoh: mulai belajar Framer untuk prototyping…",
  },
  {
    key: "feedback_stop",
    label: "Kurangi",
    hint: "Kebiasaan yang sebaiknya dikurangi",
    placeholder: "Contoh: menunda update status di Trello…",
  },
] as const

type FeedbackKey = (typeof FEEDBACK)[number]["key"]

const MIN_REASON = 10
/** Very low or perfect scores need a short reason. */
const needsReason = (score: number) => score > 0 && (score <= 2 || score === 5)

function Stars({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  return (
    <div className="flex gap-0.5" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} dari 5`}
          onClick={() => onChange(star)}
          className={cn(
            "focus-visible:ring-primary/40 rounded p-1 transition-colors outline-none focus-visible:ring-2",
            star <= value
              ? "text-warning"
              : "text-muted-foreground/40 hover:text-muted-foreground",
          )}
        >
          <RiStarFill className="size-5" />
        </button>
      ))}
    </div>
  )
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
  const router = useRouter()
  const [revieweeId, setRevieweeId] = useState(initialRevieweeId ?? "")
  const [scores, setScores] = useState<Record<CriterionKey, number>>({
    quality: 0,
    reliability: 0,
    communication: 0,
    initiative: 0,
    leadership: 0,
  })
  const [reasons, setReasons] = useState<Record<CriterionKey, string>>({
    quality: "",
    reliability: "",
    communication: "",
    initiative: "",
    leadership: "",
  })
  const [feedback, setFeedback] = useState<Record<FeedbackKey, string>>({
    feedback_continue: "",
    feedback_start: "",
    feedback_stop: "",
  })
  const [loading, setLoading] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  const touched =
    Object.values(scores).some(Boolean) ||
    Object.values(feedback).some((v) => v.trim())
  const allRated = Object.values(scores).every((s) => s > 0)
  const reasonsOk = CRITERIA.every(
    ({ key }) =>
      !needsReason(scores[key]) || reasons[key].trim().length >= MIN_REASON,
  )
  const feedbackOk = Object.values(feedback).every((v) => v.trim())
  const canSubmit = Boolean(revieweeId) && allRated && reasonsOk && feedbackOk

  const leave = () =>
    touched ? setConfirmLeave(true) : router.push("/performance/360-review")

  const submit = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/performance/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycle_id: cycleId,
          reviewee_id: revieweeId,
          ...Object.fromEntries(
            CRITERIA.map(({ key }) => [`score_${key}`, scores[key]]),
          ),
          ...Object.fromEntries(
            CRITERIA.map(({ key }) => [
              `justification_${key}`,
              needsReason(scores[key]) ? reasons[key].trim() : "",
            ]),
          ),
          ...feedback,
        }),
      })
      const result = (await response.json().catch(() => null)) as {
        success?: boolean
        error?: string
      } | null
      if (!response.ok || !result?.success) {
        toast.error(result?.error || "Gagal mengirim penilaian.")
        return
      }
      toast.success("Penilaian terkirim")
      router.push("/performance/360-review")
      router.refresh()
    } catch {
      toast.error("Gagal mengirim penilaian.")
    } finally {
      setLoading(false)
    }
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
            aria-label="Kembali"
          >
            <RiArrowLeftLine className="size-4" />
          </Button>
          <span className="text-sm font-medium">360 review</span>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">Nilai rekan satu project</h1>
          <p className="text-muted-foreground text-sm">
            Nama kamu tidak ditampilkan ke rekan yang kamu nilai. Admin bisa
            melihatnya, dan penilaian dirangkum oleh AI.
          </p>
        </div>

        <section className="flex flex-col gap-2">
          <Label htmlFor="colleague">Rekan</Label>
          <Select
            value={revieweeId || null}
            onValueChange={(v) => setRevieweeId(v ?? "")}
          >
            <SelectTrigger id="colleague" className="w-full">
              <SelectValue placeholder="Pilih rekan">
                {() =>
                  selected
                    ? `${selected.full_name}${selected.job_title ? ` · ${selected.job_title}` : ""}`
                    : "Pilih rekan"
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
            <section className="flex flex-col">
              <div className="flex items-baseline justify-between pb-2">
                <h2 className="text-sm font-medium">Penilaian</h2>
                <p className="text-muted-foreground text-xs">
                  Nilai 1–2 atau 5 perlu alasan singkat
                </p>
              </div>
              {CRITERIA.map(({ key, label, hint }) => (
                <div key={key} className="flex flex-col gap-2 border-t py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm">{label}</p>
                      <p className="text-muted-foreground text-xs">{hint}</p>
                    </div>
                    <Stars
                      label={label}
                      value={scores[key]}
                      onChange={(v) => setScores((s) => ({ ...s, [key]: v }))}
                    />
                  </div>
                  {needsReason(scores[key]) && (
                    <div className="flex flex-col gap-1">
                      <Textarea
                        aria-label={`Alasan nilai ${label}`}
                        placeholder={`Kenapa nilai ${scores[key]} untuk ${label.toLowerCase()}?`}
                        value={reasons[key]}
                        onChange={(e) =>
                          setReasons((r) => ({ ...r, [key]: e.target.value }))
                        }
                        className="min-h-16"
                      />
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          reasons[key].trim().length >= MIN_REASON
                            ? "text-muted-foreground"
                            : "text-warning",
                        )}
                      >
                        {reasons[key].trim().length}/{MIN_REASON} karakter
                        minimal
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </section>

            <section className="flex flex-col gap-5">
              <h2 className="text-sm font-medium">Masukan</h2>
              {FEEDBACK.map(({ key, label, hint, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <Label htmlFor={key}>{label}</Label>
                  <p className="text-muted-foreground -mt-1 text-xs">{hint}</p>
                  <Textarea
                    id={key}
                    placeholder={placeholder}
                    value={feedback[key]}
                    onChange={(e) =>
                      setFeedback((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="min-h-20"
                  />
                </div>
              ))}
            </section>

            <div className="flex items-center justify-end gap-3 pb-8">
              {!canSubmit && (
                <span className="text-muted-foreground text-xs">
                  Lengkapi semua nilai dan masukan
                </span>
              )}
              <Button onClick={submit} disabled={loading || !canSubmit}>
                {loading && <Spinner data-icon="inline-start" />}
                Kirim penilaian
              </Button>
            </div>
          </>
        )}
      </main>

      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tinggalkan penilaian?</DialogTitle>
            <DialogDescription>Isian kamu belum tersimpan.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLeave(false)}>
              Lanjut mengisi
            </Button>
            <Button
              variant="destructive"
              onClick={() => router.push("/performance/360-review")}
            >
              Tinggalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
