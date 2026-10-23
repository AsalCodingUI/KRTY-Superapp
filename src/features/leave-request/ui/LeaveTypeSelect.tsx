import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useT } from "@/shared/i18n/client"
;("use client")

interface LeaveTypeSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function LeaveTypeSelect({
  value,
  onChange,
  disabled,
}: LeaveTypeSelectProps) {
  const t = useT("leave")
  return (
    <div>
      <Label htmlFor="type" className="font-medium">
        {t("formRequestFor")}
      </Label>
      <Select
        value={value}
        onValueChange={(v) => v !== null && onChange(v)}
        disabled={disabled}
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
  )
}
