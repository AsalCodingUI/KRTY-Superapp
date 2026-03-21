"use client"

import { LeaveFormData, LeaveRequestForm } from "@/features/leave-request/ui/LeaveRequestForm"
import { createClient } from "@/shared/api/supabase/client"
import { calculateBusinessDays } from "@/shared/lib/date"
import { Database } from "@/shared/types/database.types"
import {
  Button, Checkbox, Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui"
import imageCompression from "browser-image-compression"
import { useRouter } from "next/navigation"
import { differenceInCalendarDays, format, startOfDay } from "date-fns"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"
import { LeaveRules } from "./LeaveRules"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]
type LeaveRequestUserProfile = Pick<Profile, "id" | "full_name">
const MIN_LEAVE_NOTICE_DAYS = 7

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: LeaveRequest | null
  userProfile: LeaveRequestUserProfile
}

export function LeaveRequestModal({
  isOpen,
  onClose,
  initialData,
  userProfile,
}: ModalProps) {
  const supabase = createClient()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)

  const [isTermsAccepted, setIsTermsAccepted] = useState(false)

  const [formData, setFormData] = useState<LeaveFormData>({
    leave_type: "Annual Leave",
    reason: "",
    start_date: undefined,
    end_date: undefined,
    proof_file: null,
    proof_url: "",
  })

  const today = startOfDay(new Date())
  const startDate = formData.start_date ? startOfDay(formData.start_date) : null
  const daysUntilStart =
    startDate !== null ? differenceInCalendarDays(startDate, today) : null
  const isInsufficientNotice =
    daysUntilStart !== null && daysUntilStart <= MIN_LEAVE_NOTICE_DAYS
  const noticeMessage =
    daysUntilStart === null
      ? undefined
      : isInsufficientNotice
        ? `Pengajuan cuti minimal H-${MIN_LEAVE_NOTICE_DAYS + 1}. Saat ini masih H-${Math.max(daysUntilStart, 0)}, jadi belum bisa diajukan.`
        : `Pengajuan memenuhi ketentuan jeda (${daysUntilStart} hari sebelum tanggal mulai).`

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setIsTermsAccepted(false)
      if (initialData) {
        setFormData({
          id: initialData.id,
          leave_type: initialData.leave_type,
          reason: initialData.reason || "",
          start_date: startOfDay(new Date(initialData.start_date)),
          end_date: startOfDay(new Date(initialData.end_date)),
          proof_url: initialData.proof_url || "",
          proof_file: null,
        })
      } else {
        setFormData({
          leave_type: "Annual Leave",
          reason: "",
          start_date: undefined,
          end_date: undefined,
          proof_file: null,
          proof_url: "",
        })
      }
    }
  }, [isOpen, initialData])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      }
      try {
        setCompressing(true)
        const compressedFile = await imageCompression(file, options)
        setFormData({ ...formData, proof_file: compressedFile })
      } catch (error) {
        console.error("Compression failed:", error)
        toast.error("Failed to process image.")
      } finally {
        setCompressing(false)
      }
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!formData.start_date || !formData.end_date) return
    if (formData.start_date > formData.end_date) {
      toast.error("End date must be after start date")
      return
    }
    if (isInsufficientNotice) {
      toast.error(
        `Pengajuan cuti harus dilakukan minimal H-${MIN_LEAVE_NOTICE_DAYS + 1} sebelum tanggal mulai`,
      )
      return
    }
    setLoading(true)

    try {
      const requestedDays = calculateBusinessDays(
        formData.start_date,
        formData.end_date,
      )

      if (requestedDays <= 0) {
        toast.error("Invalid date range")
        setLoading(false)
        return
      }

      if (formData.leave_type === "Annual Leave") {
        const now = new Date()
        const yearStart = new Date(now.getFullYear(), 0, 1)
        const yearEnd = new Date(now.getFullYear(), 11, 31)
        const { data: approvedAnnual, error: annualError } = await supabase
          .from("leave_requests")
          .select("start_date,end_date")
          .eq("user_id", userProfile.id)
          .eq("status", "approved")
          .eq("leave_type", "Annual Leave")
          .lte("start_date", format(yearEnd, "yyyy-MM-dd"))
          .gte("end_date", format(yearStart, "yyyy-MM-dd"))

        if (annualError) throw annualError

        const usedDays = (approvedAnnual || []).reduce(
          (total: number, req: { start_date: string; end_date: string }) => {
            const start = startOfDay(new Date(req.start_date))
            const end = startOfDay(new Date(req.end_date))
            const clampedStart = start < yearStart ? yearStart : start
            const clampedEnd = end > yearEnd ? yearEnd : end
            if (clampedEnd < clampedStart) return total
            const days = calculateBusinessDays(clampedStart, clampedEnd)
            return total + days
          },
          0,
        )

        const MAX_LEAVE = 12
        const { data: balanceRow } = await supabase
          .from("leave_balances")
          .select("remaining")
          .eq("user_id", userProfile.id)
          .maybeSingle()
        const remainingBalance =
          typeof balanceRow?.remaining === "number"
            ? balanceRow.remaining
            : Math.max(0, MAX_LEAVE - usedDays)

        if (requestedDays > remainingBalance) {
          toast.error("Annual leave quota exceeded")
          setLoading(false)
          return
        }

        if (requestedDays > 5) {
          toast.error("Maximum 5 business days per request")
          setLoading(false)
          return
        }

        if (usedDays + requestedDays > MAX_LEAVE) {
          toast.error("Annual leave quota exceeded")
          setLoading(false)
          return
        }
      }

      let finalProofUrl = formData.proof_url
      if (formData.proof_file) {
        const fileExt = formData.proof_file.name.split(".").pop() || "jpg"
        const fileName = `${userProfile.id}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from("leave-proofs")
          .upload(fileName, formData.proof_file)
        if (uploadError) throw uploadError
        const { data: publicUrl } = supabase.storage
          .from("leave-proofs")
          .getPublicUrl(fileName)
        finalProofUrl = publicUrl.publicUrl
      }

      const payload = {
        user_id: userProfile.id,
        start_date: format(startOfDay(formData.start_date), "yyyy-MM-dd"),
        end_date: format(startOfDay(formData.end_date), "yyyy-MM-dd"),
        leave_type: formData.leave_type || "Annual Leave",
        reason: formData.reason || null,
        proof_url: finalProofUrl || null,
        status: "pending",
      }

      if (formData.id) {
        const { error } = await supabase
          .from("leave_requests")
          .update(payload)
          .eq("id", formData.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("leave_requests").insert(payload)
        if (error) throw error
      }
      router.refresh()
      onClose()
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" &&
              error !== null &&
              "message" in error &&
              typeof (error as { message?: unknown }).message === "string"
            ? (error as { message: string }).message
          : "Failed to submit request"
      console.error("Leave request submit error:", error)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    if (step === 1) {
      return (
        <LeaveRequestForm
          formData={formData}
          userProfile={userProfile}
          compressing={compressing}
          noticeMessage={noticeMessage}
          noticeInvalid={isInsufficientNotice}
          onFormDataChange={setFormData}
          onFileChange={handleFileChange}
        />
      )
    }

    if (step === 2) {
      return (
        // SCROLL DI PINDAH KE SINI (Parent Container)
        <div className="mt-6 max-h-[70vh] overflow-y-auto pr-2 sm:max-h-[60vh]">
          <LeaveRules />
          <div className="bg-surface-neutral-secondary mt-6 flex items-start space-x-3 rounded-md border p-3">
            <Checkbox
              id="terms"
              checked={isTermsAccepted}
              onCheckedChange={(checked) =>
                setIsTermsAccepted(checked === true)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-label-md text-foreground-primary cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the terms and conditions
              </label>
              <p className="text-body-xs text-foreground-secondary">
                By checking this box, I confirm that I have read and understood
                the leave policy above.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-neutral-primary bg-surface-neutral-primary p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-label-sm text-foreground-secondary">
                Name
              </span>
              <span className="text-body-sm text-foreground-primary text-right">
                {userProfile.full_name || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-label-sm text-foreground-secondary">
                Leave Type
              </span>
              <span className="text-body-sm text-foreground-primary text-right">
                {formData.leave_type || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-label-sm text-foreground-secondary">
                Date Range
              </span>
              <span className="text-body-sm text-foreground-primary text-right">
                {formData.start_date && formData.end_date
                  ? `${format(formData.start_date, "dd MMM yyyy")} - ${format(
                      formData.end_date,
                      "dd MMM yyyy",
                    )}`
                  : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-label-sm text-foreground-secondary">
                Duration
              </span>
              <span className="text-body-sm text-foreground-primary text-right">
                {formData.start_date && formData.end_date
                  ? `${calculateBusinessDays(
                      formData.start_date,
                      formData.end_date,
                    )} business days`
                  : "-"}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-label-sm text-foreground-secondary">
                Reason
              </span>
              <p className="text-body-sm text-foreground-primary">
                {formData.reason || "-"}
              </p>
            </div>
            {formData.leave_type === "Sick Leave" && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-label-sm text-foreground-secondary">
                  Medical Proof
                </span>
                <span className="text-body-sm text-foreground-primary text-right">
                  {formData.proof_file || formData.proof_url
                    ? "Attached"
                    : "Not attached"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderFooter = () => {
    if (step === 1) {
      return (
        <>
          <DialogClose asChild>
            <Button variant="ghost" className="mt-2 w-full sm:mt-0 sm:w-fit">
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="w-full sm:w-fit"
            type="button"
            onClick={() => {
              if (formData.start_date && !formData.end_date) {
                setFormData((prev) => ({ ...prev, end_date: prev.start_date }))
              }
              setStep(2)
            }}
            disabled={
              !formData.start_date ||
              !formData.reason ||
              compressing ||
              isInsufficientNotice
            }
          >
            {compressing ? "Processing Image..." : "Next"}
          </Button>
        </>
      )
    }

    if (step === 2) {
      return (
        <>
          <Button
            variant="ghost"
            type="button"
            className="mt-2 w-full sm:mt-0 sm:w-fit"
            onClick={() => setStep(1)}
          >
            Back
          </Button>
          <Button
            className="w-full sm:w-fit"
            type="button"
            onClick={() => setStep(3)}
            disabled={!isTermsAccepted || isInsufficientNotice}
          >
            I Agree
          </Button>
        </>
      )
    }

    return (
      <>
        <Button
          variant="ghost"
          type="button"
          className="mt-2 w-full sm:mt-0 sm:w-fit"
          onClick={() => setStep(1)}
        >
          Check Again
        </Button>
        <Button
          className="w-full sm:w-fit"
          type="button"
          onClick={() => handleSubmit()}
          isLoading={loading}
          disabled={isInsufficientNotice}
        >
          Confirm & Submit
        </Button>
      </>
    )
  }

  const getTitle = () => {
    if (step === 1) {
      if (initialData?.status === "rejected") return "Resubmit Request"
      return initialData ? "Edit Request" : "New Leave Request"
    }
    if (step === 2) return "Terms & Conditions"
    return "Final Confirmation"
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <form onSubmit={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>

          <DialogBody>
            {renderContent()}
          </DialogBody>

          <DialogFooter>{renderFooter()}</DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
