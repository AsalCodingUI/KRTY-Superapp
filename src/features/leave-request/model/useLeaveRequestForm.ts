import { Database } from "@/shared/types/database.types"
import imageCompression from "browser-image-compression"
import { useEffect, useState } from "react"

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

export interface LeaveFormData {
  id?: number
  leave_type: string
  reason: string
  start_date: Date | undefined
  end_date: Date | undefined
  proof_file?: File | null
  proof_url?: string
}

interface UseLeaveRequestFormProps {
  isOpen: boolean
  initialData?: LeaveRequest | null
}

export function useLeaveRequestForm({
  isOpen,
  initialData,
}: UseLeaveRequestFormProps) {
  const [step, setStep] = useState(1)
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
        setFormData((prev) => ({ ...prev, proof_file: compressedFile }))
      } catch (error) {
        console.error("Compression failed:", error)
        alert("Gagal memproses gambar.")
      } finally {
        setCompressing(false)
      }
    }
  }

  const isFormValid = () => {
    return formData.start_date && formData.reason && !compressing
  }

  return {
    step,
    setStep,
    formData,
    setFormData,
    compressing,
    isTermsAccepted,
    setIsTermsAccepted,
    handleFileChange,
    isFormValid,
  }
}
