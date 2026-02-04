"use client"

import { calculateBusinessDays } from '@/shared/lib/date'
import { Database } from '@/shared/types/database.types'
import { DateRangePicker, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@/shared/ui"
import { RiLoader2Line } from "@remixicon/react"
import React from "react"

type Profile = Database['public']['Tables']['profiles']['Row']

export interface LeaveFormData {
    id?: number
    leave_type: string
    reason: string
    start_date: Date | undefined
    end_date: Date | undefined
    proof_file?: File | null
    proof_url?: string
}

interface LeaveRequestFormProps {
    formData: LeaveFormData
    userProfile: Profile
    compressing: boolean
    onFormDataChange: (data: LeaveFormData) => void
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function LeaveRequestForm({
    formData,
    userProfile,
    compressing,
    onFormDataChange,
    onFileChange
}: LeaveRequestFormProps) {
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
                    onValueChange={(val) => onFormDataChange({ ...formData, leave_type: val })}
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
                    onChange={(range) => onFormDataChange({
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
                    onChange={(e) => onFormDataChange({ ...formData, reason: e.target.value })}
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
                            onChange={onFileChange}
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
