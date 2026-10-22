"use client"

import { orEmpty } from "@/components/empty-value"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import {
  LeaveFormData,
  LeaveRequestForm,
} from "@/features/leave-request/ui/LeaveRequestForm"
import { createClient } from "@/shared/api/supabase/client"
import { calculateBusinessDays } from "@/shared/lib/date"
import {
  ANNUAL_LEAVE_MAX_DAYS,
  ANNUAL_LEAVE_MIN_NOTICE_DAYS,
  ANNUAL_LEAVE_QUOTA,
  LEAVE_TYPE_LABELS,
  annualLeaveSummary,
} from "@/shared/lib/leave"
import { Database } from "@/shared/types/database.types"
import { differenceInCalendarDays, format, startOfDay } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"
import { LeaveRules } from "./LeaveRules"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]
type LeaveRequestUserProfile = Pick<Profile, "id" | "full_name">

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: LeaveRequest | null
  userProfile: LeaveRequestUserProfile
}

const EMPTY_FORM: LeaveFormData = {
  leave_type: "Annual Leave",
  reason: "",
  start_date: undefined,
  end_date: undefined,
  proof_file: null,
  proof_url: "",
}

/** Two steps: fill in, then check & send (rules agreed once, on new requests). */
export function LeaveRequestModal({
  isOpen,
  onClose,
  initialData,
  userProfile,
}: ModalProps) {
  const supabase = createClient()
  const router = useRouter()
  const isEdit = Boolean(initialData)

  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [formData, setFormData] = useState<LeaveFormData>(EMPTY_FORM)

  useEffect(() => {
    if (!isOpen) return
    setStep(1)
    setAgreed(false)
    setShowRules(false)
    setFormData(
      initialData
        ? {
            id: initialData.id,
            leave_type: initialData.leave_type,
            reason: initialData.reason || "",
            start_date: startOfDay(new Date(initialData.start_date)),
            end_date: startOfDay(new Date(initialData.end_date)),
            proof_url: initialData.proof_url || "",
            proof_file: null,
          }
        : EMPTY_FORM,
    )
  }, [isOpen, initialData])

  const today = startOfDay(new Date())
  const start = formData.start_date ? startOfDay(formData.start_date) : null
  const end = formData.end_date ? startOfDay(formData.end_date) : start
  const daysUntilStart =
    start !== null ? differenceInCalendarDays(start, today) : null
  const isAnnual = formData.leave_type === "Annual Leave"
  const tooLate =
    isAnnual &&
    daysUntilStart !== null &&
    daysUntilStart < ANNUAL_LEAVE_MIN_NOTICE_DAYS
  const noticeMessage =
    !isAnnual || daysUntilStart === null
      ? undefined
      : tooLate
        ? `Cuti tahunan diajukan paling lambat H-${ANNUAL_LEAVE_MIN_NOTICE_DAYS}. Tanggal ini masih H-${Math.max(daysUntilStart, 0)}.`
        : `Memenuhi ketentuan: diajukan H-${daysUntilStart}.`
  const requestedDays =
    start && end ? Math.max(0, calculateBusinessDays(start, end)) : 0

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setCompressing(true)
      const { default: imageCompression } = await import(
        "browser-image-compression"
      )
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })
      setFormData((prev) => ({ ...prev, proof_file: compressed }))
    } catch (error) {
      console.error("Compression failed:", error)
      toast.error("Gagal memproses gambar")
    } finally {
      setCompressing(false)
    }
  }

  /** Same checks before showing step 2 and before sending. */
  const validate = async (): Promise<string | null> => {
    if (!start || !end) return "Pilih tanggal cuti"
    if (start > end) return "Tanggal selesai harus setelah tanggal mulai"
    if (requestedDays <= 0) return "Rentang tanggal tidak berisi hari kerja"
    if (!formData.reason?.trim()) return "Isi alasan pengajuan"
    if (!isAnnual) return null
    if (tooLate)
      return `Cuti tahunan diajukan paling lambat H-${ANNUAL_LEAVE_MIN_NOTICE_DAYS}`
    if (requestedDays > ANNUAL_LEAVE_MAX_DAYS)
      return `Maksimal ${ANNUAL_LEAVE_MAX_DAYS} hari kerja per pengajuan`

    const year = new Date().getFullYear()
    const [{ data, error }, { data: employment }] = await Promise.all([
      supabase
        .from("leave_requests")
        .select("start_date,end_date")
        .eq("user_id", userProfile.id)
        .eq("status", "approved")
        .eq("leave_type", "Annual Leave")
        .lte("start_date", `${year}-12-31`)
        .gte("end_date", `${year}-01-01`),
      supabase
        .from("profiles")
        .select("join_date, employment_type")
        .eq("id", userProfile.id)
        .maybeSingle(),
    ])
    if (error) return "Gagal memeriksa sisa cuti"
    const summary = annualLeaveSummary(data ?? [], year, employment ?? {})
    if (!summary.eligible) {
      return summary.eligibleFrom
        ? `Cuti tahunan bisa diajukan mulai ${format(summary.eligibleFrom, "d MMMM yyyy", { locale: idLocale })}`
        : (summary.note ?? "Belum berhak cuti tahunan")
    }
    if (requestedDays > summary.remaining)
      return `Sisa cuti tahunan tinggal ${summary.remaining} dari ${summary.quota} hari`
    return null
  }

  const goToReview = async () => {
    if (formData.start_date && !formData.end_date) {
      setFormData((prev) => ({ ...prev, end_date: prev.start_date }))
    }
    setLoading(true)
    const problem = await validate()
    setLoading(false)
    if (problem) {
      toast.error(problem)
      return
    }
    setStep(2)
  }

  const submit = async () => {
    if (!start || !end) return
    setLoading(true)
    try {
      const problem = await validate()
      if (problem) throw new Error(problem)

      let proofUrl = formData.proof_url
      if (formData.proof_file) {
        const ext = formData.proof_file.name.split(".").pop() || "jpg"
        const path = `${userProfile.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from("leave-proofs")
          .upload(path, formData.proof_file)
        if (uploadError) throw new Error("Gagal mengunggah bukti")
        proofUrl = supabase.storage.from("leave-proofs").getPublicUrl(path)
          .data.publicUrl
      }

      const payload = {
        start_date: format(start, "yyyy-MM-dd"),
        end_date: format(end, "yyyy-MM-dd"),
        leave_type: formData.leave_type || "Annual Leave",
        reason: formData.reason || null,
        proof_url: proofUrl || null,
      }
      const response = await fetch("/api/leave/requests", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit ? { ...payload, id: formData.id } : payload,
        ),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result?.error || "Gagal mengirim")

      toast.success(isEdit ? "Pengajuan diperbarui" : "Pengajuan dikirim")
      router.refresh()
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengirim pengajuan",
      )
    } finally {
      setLoading(false)
    }
  }

  const summary: [string, React.ReactNode][] = [
    ["Jenis", LEAVE_TYPE_LABELS[formData.leave_type] ?? formData.leave_type],
    [
      "Tanggal",
      start && end
        ? `${format(start, "d MMM", { locale: idLocale })} – ${format(end, "d MMM yyyy", { locale: idLocale })}`
        : "—",
    ],
    ["Durasi", `${requestedDays} hari kerja`],
    ["Alasan", formData.reason || "—"],
  ]
  if (formData.leave_type === "Sick Leave") {
    summary.push([
      "Surat dokter",
      formData.proof_file || formData.proof_url ? "Terlampir" : "Tidak ada",
    ])
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[35rem]">
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? isEdit
                ? initialData?.status === "rejected"
                  ? "Ajukan ulang"
                  : "Ubah pengajuan"
                : "Ajukan cuti"
              : "Periksa pengajuan"}
          </DialogTitle>
        </DialogHeader>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 py-1">
          {step === 1 ? (
            <LeaveRequestForm
              formData={formData}
              userProfile={userProfile}
              compressing={compressing}
              noticeMessage={noticeMessage}
              noticeInvalid={tooLate}
              onFormDataChange={setFormData}
              onFileChange={handleFileChange}
            />
          ) : (
            <div className="flex flex-col gap-5">
              <dl className="flex flex-col">
                {summary.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-6 border-b py-2.5 text-sm last:border-b-0"
                  >
                    <dt className="text-muted-foreground shrink-0">{label}</dt>
                    <dd className="text-right">{orEmpty(value)}</dd>
                  </div>
                ))}
              </dl>

              {isAnnual && (
                <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                  <li>
                    Diajukan paling lambat H-{ANNUAL_LEAVE_MIN_NOTICE_DAYS}.
                  </li>
                  <li>
                    Maksimal {ANNUAL_LEAVE_MAX_DAYS} hari kerja per pengajuan.
                  </li>
                  <li>
                    Jatah {ANNUAL_LEAVE_QUOTA} hari per tahun, tidak
                    diakumulasi.
                  </li>
                </ul>
              )}

              {!isEdit && (
                <div className="flex flex-col gap-2">
                  <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                    <Checkbox
                      checked={agreed}
                      onCheckedChange={(checked) => setAgreed(checked === true)}
                      className="mt-0.5"
                    />
                    <span>Saya sudah membaca dan menyetujui aturan cuti.</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRules((v) => !v)}
                    className="text-primary w-fit cursor-pointer pl-6 text-sm hover:underline"
                  >
                    {showRules ? "Sembunyikan aturan" : "Lihat aturan lengkap"}
                  </button>
                  {showRules && (
                    <div className="max-h-64 overflow-y-auto rounded-lg border p-3">
                      <LeaveRules />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 1 ? (
            <>
              <DialogClose render={<Button variant="outline" />}>
                Batal
              </DialogClose>
              <Button
                type="button"
                onClick={goToReview}
                disabled={
                  !formData.start_date ||
                  !formData.reason ||
                  compressing ||
                  tooLate ||
                  loading
                }
              >
                {(compressing || loading) && (
                  <Spinner data-icon="inline-start" />
                )}
                Lanjut
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" type="button" onClick={() => setStep(1)}>
                Kembali
              </Button>
              <Button
                type="button"
                onClick={submit}
                disabled={loading || (!isEdit && !agreed)}
              >
                {loading && <Spinner data-icon="inline-start" />}
                {isEdit ? "Simpan & kirim ulang" : "Kirim pengajuan"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
