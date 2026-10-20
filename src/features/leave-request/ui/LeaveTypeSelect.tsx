import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  return (
    <div>
      <Label htmlFor="type" className="font-medium">
        Pengajuan Untuk
      </Label>
      <Select
        value={value}
        onValueChange={(v) => v !== null && onChange(v)}
        disabled={disabled}
      >
        <SelectTrigger id="type" size="sm" className="mt-2 w-full">
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
  )
}
