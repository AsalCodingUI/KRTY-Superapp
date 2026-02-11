"use client"

import { createClient } from "@/shared/api/supabase/client"
import { calculateBusinessDays } from "@/shared/lib/date"
import { Database } from "@/shared/types/database.types"
import {
  Button, Checkbox, DateRangePicker, Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle, Label, Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, Textarea, TextInput
} from "@/shared/ui"
import { RiLoader2Line } from "@/shared/ui/lucide-icons"
import imageCompression from "browser-image-compression"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"
import { LeaveRules } from "./LeaveRules"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

interface LeaveFormData {
  id?: number
  leave_type: string
  reason: string
  start_date: Date | undefined
  end_date: Date | undefined
  proof_file?: File | null
  proof_url?: string
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: LeaveRequest | null
  userProfile: Profile
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

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setIsTermsAccepted(false)
      if (initialData) {
        setFormData({
          id: initialData.id,
          leave_type: initialData.leave_type,
          reason: initialData.reason || "",
          start_date: new Date(initialData.start_date),
          end_date: new Date(initialData.end_date),
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
        alert("Gagal memproses gambar.")
      } finally {
        setCompressing(false)
      }
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!formData.start_date || !formData.end_date) return
    setLoading(true)

    try {
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
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date.toISOString(),
        leave_type: formData.leave_type,
        reason: formData.reason,
        proof_url: finalProofUrl,
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
        error instanceof Error ? error.message : "Failed to submit request"
      alert("Error: " + message)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    if (step === 1) {
      return (
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="name" className="font-medium">
              Nama
            </Label>
            <TextInput
              id="name"
              value={userProfile.full_name || ""}
              disabled
              className="bg-surface-neutral-secondary mt-2"
            />
          </div>
          <div>
            <Label htmlFor="type" className="font-medium">
              Pengajuan Untuk
            </Label>
            <Select
              value={formData.leave_type}
              onValueChange={(val) =>
                setFormData({ ...formData, leave_type: val })
              }
            >
              <SelectTrigger id="type" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Annual Leave">
                  Annual Leave (Cuti Tahunan)
                </SelectItem>
                <SelectItem value="Sick Leave">Sick Leave (Sakit)</SelectItem>
                <SelectItem value="WFH">WFH (Remote)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-medium">Tanggal</Label>
            <DateRangePicker
              className="mt-2 w-full"
              value={{ from: formData.start_date, to: formData.end_date }}
              onChange={(range) =>
                setFormData({
                  ...formData,
                  start_date: range?.from,
                  end_date: range?.to,
                })
              }
            />
            {formData.start_date && formData.end_date && (
              <p className="text-body-xs text-foreground-secondary mt-2">
                Durasi:{" "}
                {calculateBusinessDays(formData.start_date, formData.end_date)}{" "}
                hari kerja.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="reason" className="font-medium">
              Alasan
            </Label>
            <Textarea
              id="reason"
              className="mt-2"
              placeholder="Jelaskan alasan cuti..."
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
            />
          </div>
          {formData.leave_type === "Sick Leave" && (
            <div>
              <Label className="font-medium">Surat Dokter (Optional)</Label>
              <div className="mt-2 flex items-center gap-2">
                <TextInput
                  type="file"
                  accept="image/*"
                  className="w-full"
                  onChange={handleFileChange}
                  disabled={compressing}
                />
                {compressing && (
                  <span className="text-body-xs flex animate-pulse items-center gap-1 whitespace-nowrap text-blue-600">
                    <RiLoader2Line className="size-3 animate-spin" />
                    Processing...
                  </span>
                )}
              </div>
              <p className="text-body-xs text-foreground-tertiary mt-1">
                Max 1MB (Auto Compressed).
              </p>
            </div>
          )}
        </div>
      )
    }

    if (step === 2) {
      return (
        // SCROLL DI PINDAH KE SINI (Parent Container)
        <div className="mt-6 max-h-[60vh] overflow-y-auto pr-2">
          <LeaveRules />
          <div className="bg-surface-neutral-secondary dark:bg-surface mt-6 flex items-start space-x-3 rounded-md border p-3 dark:border">
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
                className="text-label-md text-foreground-primary dark:text-foreground-primary cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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

    return <div className="py-2"></div>
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
            disabled={!formData.start_date || !formData.reason || compressing}
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
            disabled={!isTermsAccepted}
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
      <DialogContent className="sm:max-w-lg">
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
