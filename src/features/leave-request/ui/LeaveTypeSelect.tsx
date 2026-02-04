import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui";
"use client"

interface LeaveTypeSelectProps {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}

export function LeaveTypeSelect({ value, onChange, disabled }: LeaveTypeSelectProps) {
    return (
        <div>
            <Label htmlFor="type" className="font-medium">Pengajuan Untuk</Label>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
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
    )
}
