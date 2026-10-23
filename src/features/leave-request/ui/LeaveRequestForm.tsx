"use client"

import { FileField } from "@/components/file-field"
import { useT } from "@/shared/i18n/client"
import { calculateBusinessDays } from "@/shared/lib/date"
import { Database } from "@/shared/types/database.types"
import { DateRangePicker } from "@/components/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RiLoader2Line } from "@/shared/ui/lucide-icons"
import React from "react"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type LeaveRequestUserProfile = Pick<Profile, "full_name">

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
  userProfile: LeaveRequestUserProfile
  compressing: boolean
  noticeMessage?: string
  noticeInvalid?: boolean
  onFormDataChange: (data: LeaveFormData) => void
  onFileChange: (files: FileList | null) => void
}

export function LeaveRequestForm({
  formData,
  userProfile,
  compressing,
  noticeMessage,
  noticeInvalid = false,
  onFormDataChange,
  onFileChange,
}: LeaveRequestFormProps) {
  const t = useT("leave")
  const businessDays =
    formData.start_date && formData.end_date
      ? calculateBusinessDays(formData.start_date, formData.end_date)
      : 0
  return (
    <div className="grid gap-4">
      <div>
        <Label htmlFor="name" className="font-medium">
          {t("formName")}
        </Label>
        <Input
          id="name"
          value={userProfile.full_name || ""}
          disabled
          className="bg-muted mt-2"
        />
      </div>
      <div>
        <Label htmlFor="type" className="font-medium">
          {t("formRequestFor")}
        </Label>
        <Select
          value={formData.leave_type}
          onValueChange={(val) =>
            val !== null && onFormDataChange({ ...formData, leave_type: val })
          }
        >
          <SelectTrigger id="type" className="mt-2 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Annual Leave">{t("typeAnnual")}</SelectItem>
            <SelectItem value="Sick Leave">{t("typeSick")}</SelectItem>
            <SelectItem value="WFH">{t("typeWfhRemote")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="font-medium">{t("colDate")}</Label>
        <DateRangePicker
          className="mt-2 w-full"
          value={{ from: formData.start_date, to: formData.end_date }}
          onValueChange={(range) =>
            onFormDataChange({
              ...formData,
              start_date: range?.from,
              end_date: range?.to,
            })
          }
        />

        {formData.start_date && formData.end_date && (
          <p className="text-muted-foreground mt-2 text-xs">
            {t("formDuration", {
              days: t(
                businessDays === 1 ? "workingDaysOne" : "workingDaysOther",
                { n: businessDays },
              ),
            })}
          </p>
        )}
        {noticeMessage && (
          <p
            className={
              noticeInvalid
                ? "text-destructive mt-1 text-xs"
                : "text-muted-foreground mt-1 text-xs"
            }
          >
            {noticeMessage}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="reason" className="font-medium">
          {t("colReason")}
        </Label>
        <Textarea
          id="reason"
          className="mt-2"
          placeholder={t("formReasonPlaceholder")}
          value={formData.reason}
          onChange={(e) =>
            onFormDataChange({ ...formData, reason: e.target.value })
          }
        />
      </div>
      {formData.leave_type === "Sick Leave" && (
        <div>
          <Label className="font-medium">{t("formDoctorNote")}</Label>
          <div className="mt-2 flex items-center gap-2">
            <FileField
              accept="image/*,application/pdf"
              className="w-full"
              fileName={formData.proof_file?.name}
              onChange={(files) => onFileChange(files)}
              disabled={compressing}
            />
            {compressing && (
              <span className="text-primary flex animate-pulse items-center gap-1 text-xs whitespace-nowrap">
                <RiLoader2Line className="size-3 animate-spin" />
                {t("processing")}
              </span>
            )}
          </div>
          <p className="text-muted-foreground/60 mt-1 text-xs">
            {t("formFileHint")}
          </p>
        </div>
      )}
    </div>
  )
}
