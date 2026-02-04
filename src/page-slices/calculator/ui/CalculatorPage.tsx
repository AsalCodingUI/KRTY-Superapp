"use client"

import { Badge } from "@/shared/ui"
import { Button } from "@/shared/ui"
import { Divider } from "@/shared/ui"
import { Input } from "@/shared/ui"
import { Label } from "@/shared/ui"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui"
import { Slider } from "@/shared/ui"
import { Database } from '@/shared/types/database.types'
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react"
import { useMemo, useState } from "react"
import { v4 as uuidv4 } from 'uuid'
import { FinancialHUD } from "./components/FinancialHUD"

type Profile = Database['public']['Tables']['profiles']['Row']

interface Phase {
    id: string
    name: string
    days: number
    buffer: number
}

interface SquadMember {
    id: string
    profileId: string
    allocation: number // 0-100
}

export default function CalculatorClientPage({ teamMembers }: { teamMembers: Profile[] }) {

    const [revenueUSD, setRevenueUSD] = useState<string>("1,000")
    const [exchangeRate, setExchangeRate] = useState<string>("15,000")
    const [hoursPerDay, setHoursPerDay] = useState<string>("8")
    const [platformFeePercent, setPlatformFeePercent] = useState<string>("2")

    const [phases, setPhases] = useState<Phase[]>([
        { id: '1', name: 'Discovery & Design', days: 5, buffer: 1 },
        { id: '2', name: 'Development', days: 10, buffer: 2 },
    ])

    const [squad, setSquad] = useState<SquadMember[]>([])

    // Helper to parse number from string (allow empty)
    const parseNumber = (val: string): number => {
        const num = parseFloat(val.replace(/,/g, ''))
        return isNaN(num) ? 0 : num
    }

    // Helper to format number with thousand separator
    const formatNumber = (val: string): string => {
        const num = val.replace(/,/g, '')
        if (num === '') return ''
        const parts = num.split('.')
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        return parts.join('.')
    }

    // --- CALCULATIONS ---
    const totalDuration = useMemo(() => {
        return phases.reduce((sum, p) => sum + p.days + p.buffer, 0)
    }, [phases])

    const grossRevenue = useMemo(() => {
        return parseNumber(revenueUSD) * parseNumber(exchangeRate)
    }, [revenueUSD, exchangeRate])

    const totalLaborCost = useMemo(() => {
        return squad.reduce((total, member) => {
            const profile = teamMembers.find(p => p.id === member.profileId)
            if (!profile) return total
            const hours = parseNumber(hoursPerDay) * totalDuration
            const cost = (profile.hourly_rate || 0) * hours * (member.allocation / 100)
            return total + cost
        }, 0)
    }, [squad, teamMembers, totalDuration, hoursPerDay])

    const platformFee = useMemo(() => {
        return grossRevenue * (parseNumber(platformFeePercent) / 100)
    }, [grossRevenue, platformFeePercent])

    const netProfit = grossRevenue - totalLaborCost - platformFee
    const marginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0

    // --- HANDLERS ---
    const addPhase = () => {
        setPhases([...phases, { id: uuidv4(), name: 'New Phase', days: 1, buffer: 0 }])
    }

    const removePhase = (id: string) => {
        setPhases(phases.filter(p => p.id !== id))
    }

    const updatePhase = (id: string, field: keyof Phase, value: string | number) => {
        setPhases(phases.map(p => p.id === id ? { ...p, [field]: value } : p))
    }

    const addSquadMember = (profileId: string) => {
        if (!profileId) return
        if (squad.some(s => s.profileId === profileId)) {
            alert("Member already added!")
            return
        }
        setSquad([...squad, { id: uuidv4(), profileId, allocation: 100 }])
    }

    const removeSquadMember = (id: string) => {
        setSquad(squad.filter(s => s.id !== id))
    }

    const updateAllocation = (id: string, value: number[]) => {
        setSquad(squad.map(s => s.id === id ? { ...s, allocation: value[0] } : s))
    }

    const [selectedMemberToAdd, setSelectedMemberToAdd] = useState<string>("")

    return (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">

            {/* LEFT COLUMN: INPUTS (Col Span 7) */}
            <div className="lg:col-span-7 space-y-10">

                {/* SECTION 1: CONTEXT */}
                <div>
                    <h3 className="text-md font-semibold text-content dark:text-content">
                        Project Context
                    </h3>
                    <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="revenue">Revenue (USD)</Label>
                            <Input
                                id="revenue"
                                type="text"
                                value={revenueUSD}
                                onChange={(e) => setRevenueUSD(formatNumber(e.target.value))}
                                placeholder="e.g. 1,000"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="exchangeRate">Exchange Rate (IDR)</Label>
                            <Input
                                id="exchangeRate"
                                type="text"
                                value={exchangeRate}
                                onChange={(e) => setExchangeRate(formatNumber(e.target.value))}
                                placeholder="e.g. 15,000"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="hours">Daily Workload (Hours)</Label>
                            <Input
                                id="hours"
                                type="number"
                                value={hoursPerDay}
                                onChange={(e) => setHoursPerDay(e.target.value)}
                                placeholder="e.g. 8"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="platformFee">Platform Fee (%)</Label>
                            <Input
                                id="platformFee"
                                type="number"
                                value={platformFeePercent}
                                onChange={(e) => setPlatformFeePercent(e.target.value)}
                                placeholder="e.g. 2"
                                className="mt-1"
                            />
                        </div>
                    </div>
                </div>

                <Divider />

                {/* SECTION 2: TIMELINE */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-md font-semibold text-content dark:text-content">
                                Timeline Engine
                            </h3>
                        </div>
                        <Badge variant="zinc">Total: {totalDuration} Days</Badge>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4 text-sm font-medium text-content dark:text-content px-1">
                            <div className="flex-1">Phase Name</div>
                            <div className="w-24 text-center">Days</div>
                            <div className="w-24 text-center">Buffer</div>
                            <div className="w-8"></div>
                        </div>

                        {phases.map((phase) => (
                            <div key={phase.id} className="flex gap-4 items-center">
                                <Input
                                    value={phase.name}
                                    onChange={(e) => updatePhase(phase.id, 'name', e.target.value)}
                                    placeholder="Phase Name"
                                    className="flex-1"
                                />
                                <Input
                                    type="number"
                                    className="text-center w-24"
                                    value={phase.days}
                                    onChange={(e) => updatePhase(phase.id, 'days', Number(e.target.value))}
                                />
                                <Input
                                    type="number"
                                    className="text-center w-24"
                                    value={phase.buffer}
                                    onChange={(e) => updatePhase(phase.id, 'buffer', Number(e.target.value))}
                                />
                                <Button variant="ghost" size="sm" className="text-content-placeholder size-8 p-0 shrink-0" onClick={() => removePhase(phase.id)}>
                                    <RiDeleteBinLine className="size-4" />
                                </Button>
                            </div>
                        ))}

                        <Button variant="secondary" className="w-full mt-4" onClick={addPhase}>
                            <RiAddLine className="size-4 mr-2" /> Add Project Phase
                        </Button>
                    </div>
                </div>

                <Divider />

                {/* SECTION 3: SQUAD ALLOCATION */}
                <div>
                    <h3 className="text-md font-semibold text-content dark:text-content mb-6">
                        Squad Allocation
                    </h3>

                    <div className="flex gap-3 mb-6">
                        <Select onValueChange={setSelectedMemberToAdd} value={selectedMemberToAdd}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Team Member..." />
                            </SelectTrigger>
                            <SelectContent>
                                {teamMembers.map(m => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.full_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={() => {
                            addSquadMember(selectedMemberToAdd)
                            setSelectedMemberToAdd("")
                        }}>
                            <RiAddLine className="size-4 mr-2" /> Add
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {squad.map((member) => {
                            const profile = teamMembers.find(p => p.id === member.profileId)
                            return (
                                <div key={member.id} className="rounded-lg border border-border p-4 bg-surface dark:bg-surface">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-medium text-content dark:text-content">{profile?.full_name}</p>
                                            <p className="text-xs text-content-subtle dark:text-content-subtle">{profile?.job_title}</p>
                                        </div>
                                        <Button variant="ghost" size="xs" className="text-content-placeholder size-6 p-0" onClick={() => removeSquadMember(member.id)}>
                                            <RiDeleteBinLine className="size-4" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-content-subtle dark:text-content-subtle font-medium w-16">Allocation</span>
                                        <Slider
                                            value={[member.allocation]}
                                            max={100}
                                            step={5}
                                            onValueChange={(val) => updateAllocation(member.id, val)}
                                            className="flex-1"
                                        />
                                        <span className="text-sm font-medium text-content dark:text-content w-10 text-right">{member.allocation}%</span>
                                    </div>
                                </div>
                            )
                        })}

                        {squad.length === 0 && (
                            <div className="text-center rounded-md border border-dashed border p-6 dark:border">
                                <p className="text-sm text-content-subtle dark:text-content-subtle">No team members allocated yet.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN: FINANCIAL HUD (Col Span 5) */}
            <div className="lg:col-span-5">
                <FinancialHUD
                    grossRevenue={grossRevenue}
                    totalLaborCost={totalLaborCost}
                    platformFee={platformFee}
                    platformFeePercent={parseNumber(platformFeePercent)}
                    netProfit={netProfit}
                    marginPercent={marginPercent}
                />
            </div>

        </div>
    )
}