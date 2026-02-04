"use client"

import { Button } from "@/shared/ui"
import { Checkbox } from "@/shared/ui"
import { DateRangePicker } from "@/shared/ui"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui"
import { Input } from "@/shared/ui"
import { Label } from "@/shared/ui"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui"
import { Textarea } from "@/shared/ui"
import { Database } from '@/shared/types/database.types'
import { calculateBusinessDays } from '@/shared/lib/date'
import { createClient } from '@/shared/api/supabase/client'
import { RiCloseLine, RiLoader2Line } from "@remixicon/react"
import imageCompression from 'browser-image-compression'
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"
import { LeaveRules } from "./LeaveRules"

type Profile = Database['public']['Tables']['profiles']['Row']
type LeaveRequest = Database['public']['Tables']['leave_requests']['Row']

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

export function LeaveRequestModal({ isOpen, onClose, initialData, userProfile }: ModalProps) {
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
        proof_url: ""
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
                    proof_file: null
                })
            } else {
                setFormData({
                    leave_type: "Annual Leave",
                    reason: "",
                    start_date: undefined,
                    end_date: undefined,
                    proof_file: null,
                    proof_url: ""
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
                const fileExt = formData.proof_file.name.split('.').pop() || 'jpg'
                const fileName = `${userProfile.id}/${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('leave-proofs')
                    .upload(fileName, formData.proof_file)
                if (uploadError) throw uploadError
                const { data: publicUrl } = supabase.storage
                    .from('leave-proofs')
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
                status: 'pending'
            }

            if (formData.id) {
                const { error } = await supabase.from('leave_requests').update(payload).eq('id', formData.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('leave_requests').insert(payload)
                if (error) throw error
            }
            router.refresh()
            onClose()
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to submit request"
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
                        <Label htmlFor="name" className="font-medium">Nama</Label>
                        <Input id="name" value={userProfile.full_name || ""} disabled className="mt-2 bg-muted" />
                    </div>
                    <div>
                        <Label htmlFor="type" className="font-medium">Pengajuan Untuk</Label>
                        <Select
                            value={formData.leave_type}
                            onValueChange={(val) => setFormData({ ...formData, leave_type: val })}
                        >
                            <SelectTrigger id="type" className="mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Annual Leave">Annual Leave (Cuti Tahunan)</SelectItem>
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
                            onChange={(range) => setFormData({
                                ...formData,
                                start_date: range?.from,
                                end_date: range?.to
                            })}
                        />
                        {formData.start_date && formData.end_date && (
                            <p className="text-xs text-content-subtle mt-2">
                                Durasi: {calculateBusinessDays(formData.start_date, formData.end_date)} hari kerja.
                            </p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="reason" className="font-medium">Alasan</Label>
                        <Textarea
                            id="reason"
                            className="mt-2"
                            placeholder="Jelaskan alasan cuti..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        />
                    </div>
                    {formData.leave_type === "Sick Leave" && (
                        <div>
                            <Label className="font-medium">Surat Dokter (Optional)</Label>
                            <div className="flex items-center gap-2 mt-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="w-full"
                                    onChange={handleFileChange}
                                    disabled={compressing}
                                />
                                {compressing && (
                                    <span className="flex items-center gap-1 text-xs text-blue-600 animate-pulse whitespace-nowrap">
                                        <RiLoader2Line className="animate-spin size-3" />
                                        Processing...
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-content-placeholder mt-1">Max 1MB (Auto Compressed).</p>
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
                    <div className="mt-6 flex items-start space-x-3 rounded-md bg-muted p-3 border border dark:bg-surface dark:border">
                        <Checkbox
                            id="terms"
                            checked={isTermsAccepted}
                            onCheckedChange={(checked) => setIsTermsAccepted(checked === true)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor="terms"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-content dark:text-content cursor-pointer"
                            >
                                I agree to the terms and conditions
                            </label>
                            <p className="text-xs text-content-subtle">
                                By checking this box, I confirm that I have read and understood the leave policy above.
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
                                setFormData(prev => ({ ...prev, end_date: prev.start_date }))
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
                    <Button variant="ghost" type="button" className="mt-2 w-full sm:mt-0 sm:w-fit" onClick={() => setStep(1)}>
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
                <Button variant="ghost" type="button" className="mt-2 w-full sm:mt-0 sm:w-fit" onClick={() => setStep(1)}>
                    Check Again
                </Button>
                <Button className="w-full sm:w-fit" type="button" onClick={() => handleSubmit()} isLoading={loading}>
                    Confirm & Submit
                </Button>
            </>
        )
    }

    const getTitle = () => {
        if (step === 1) {
            if (initialData?.status === 'rejected') return "Resubmit Request"
            return initialData ? "Edit Request" : "New Leave Request"
        }
        if (step === 2) return "Terms & Conditions"
        return "Final Confirmation"
    }

    const getDescription = () => {
        if (step === 1) return "Fill in the details below to submit your leave request."
        if (step === 2) return "Please review the leave policy before proceeding."
        return "Apakah Anda yakin ingin mengirim permohonan cuti ini? Pastikan tanggal dan alasan sudah sesuai."
    }

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogClose asChild>
                    <Button
                        className="absolute right-3 top-3 p-2 !text-content-placeholder hover:text-content-subtle dark:!text-content-subtle hover:dark:text-content-subtle"
                        variant="ghost"
                        aria-label="close"
                    >
                        <RiCloseLine className="size-5 shrink-0" />
                    </Button>
                </DialogClose>

                <form onSubmit={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>{getTitle()}</DialogTitle>
                        <DialogDescription className="mt-1 text-sm/6">
                            {getDescription()}
                        </DialogDescription>
                    </DialogHeader>

                    {renderContent()}

                    <DialogFooter className="mt-6">
                        {renderFooter()}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}