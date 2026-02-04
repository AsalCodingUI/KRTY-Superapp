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
import { Database } from "@/shared/types/database.types"
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react"
import { useMemo, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { FinancialHUD } from "./components/FinancialHUD"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

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

export default function CalculatorClientPage({
  teamMembers,
}: {
  teamMembers: Profile[]
}) {
  const [revenueUSD, setRevenueUSD] = useState<string>("1,000")
  const [exchangeRate, setExchangeRate] = useState<string>("15,000")
  const [hoursPerDay, setHoursPerDay] = useState<string>("8")
  const [platformFeePercent, setPlatformFeePercent] = useState<string>("2")

  const [phases, setPhases] = useState<Phase[]>([
    { id: "1", name: "Discovery & Design", days: 5, buffer: 1 },
    { id: "2", name: "Development", days: 10, buffer: 2 },
  ])

  const [squad, setSquad] = useState<SquadMember[]>([])

  // Helper to parse number from string (allow empty)
  const parseNumber = (val: string): number => {
    const num = parseFloat(val.replace(/,/g, ""))
    return isNaN(num) ? 0 : num
  }

  // Helper to format number with thousand separator
  const formatNumber = (val: string): string => {
    const num = val.replace(/,/g, "")
    if (num === "") return ""
    const parts = num.split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return parts.join(".")
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
      const profile = teamMembers.find((p) => p.id === member.profileId)
      if (!profile) return total
      const hours = parseNumber(hoursPerDay) * totalDuration
      const cost =
        (profile.hourly_rate || 0) * hours * (member.allocation / 100)
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
    setPhases([
      ...phases,
      { id: uuidv4(), name: "New Phase", days: 1, buffer: 0 },
    ])
  }

  const removePhase = (id: string) => {
    setPhases(phases.filter((p) => p.id !== id))
  }

  const updatePhase = (
    id: string,
    field: keyof Phase,
    value: string | number,
  ) => {
    setPhases(phases.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const addSquadMember = (profileId: string) => {
    if (!profileId) return
    if (squad.some((s) => s.profileId === profileId)) {
      alert("Member already added!")
      return
    }
    setSquad([...squad, { id: uuidv4(), profileId, allocation: 100 }])
  }

  const removeSquadMember = (id: string) => {
    setSquad(squad.filter((s) => s.id !== id))
  }

  const updateAllocation = (id: string, value: number[]) => {
    setSquad(
      squad.map((s) => (s.id === id ? { ...s, allocation: value[0] } : s)),
    )
  }

  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState<string>("")

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
      {/* LEFT COLUMN: INPUTS (Col Span 7) */}
      <div className="space-y-10 lg:col-span-7">
        {/* SECTION 1: CONTEXT */}
        <div>
          <h3 className="text-md text-content dark:text-content font-semibold">
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-md text-content dark:text-content font-semibold">
                Timeline Engine
              </h3>
            </div>
            <Badge variant="zinc">Total: {totalDuration} Days</Badge>
          </div>

          <div className="space-y-4">
            <div className="text-label-md text-content dark:text-content flex gap-4 px-1">
              <div className="flex-1">Phase Name</div>
              <div className="w-24 text-center">Days</div>
              <div className="w-24 text-center">Buffer</div>
              <div className="w-8"></div>
            </div>

            {phases.map((phase) => (
              <div key={phase.id} className="flex items-center gap-4">
                <Input
                  value={phase.name}
                  onChange={(e) =>
                    updatePhase(phase.id, "name", e.target.value)
                  }
                  placeholder="Phase Name"
                  className="flex-1"
                />
                <Input
                  type="number"
                  className="w-24 text-center"
                  value={phase.days}
                  onChange={(e) =>
                    updatePhase(phase.id, "days", Number(e.target.value))
                  }
                />
                <Input
                  type="number"
                  className="w-24 text-center"
                  value={phase.buffer}
                  onChange={(e) =>
                    updatePhase(phase.id, "buffer", Number(e.target.value))
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-content-placeholder size-8 shrink-0 p-0"
                  onClick={() => removePhase(phase.id)}
                >
                  <RiDeleteBinLine className="size-4" />
                </Button>
              </div>
            ))}

            <Button
              variant="secondary"
              className="mt-4 w-full"
              onClick={addPhase}
            >
              <RiAddLine className="mr-2 size-4" /> Add Project Phase
            </Button>
          </div>
        </div>

        <Divider />

        {/* SECTION 3: SQUAD ALLOCATION */}
        <div>
          <h3 className="text-md text-content dark:text-content mb-6 font-semibold">
            Squad Allocation
          </h3>

          <div className="mb-6 flex gap-3">
            <Select
              onValueChange={setSelectedMemberToAdd}
              value={selectedMemberToAdd}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Team Member..." />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                addSquadMember(selectedMemberToAdd)
                setSelectedMemberToAdd("")
              }}
            >
              <RiAddLine className="mr-2 size-4" /> Add
            </Button>
          </div>

          <div className="space-y-6">
            {squad.map((member) => {
              const profile = teamMembers.find((p) => p.id === member.profileId)
              return (
                <div
                  key={member.id}
                  className="border-border bg-surface dark:bg-surface rounded-lg border p-4"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-content dark:text-content font-medium">
                        {profile?.full_name}
                      </p>
                      <p className="text-label-xs text-content-subtle dark:text-content-subtle">
                        {profile?.job_title}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-content-placeholder size-6 p-0"
                      onClick={() => removeSquadMember(member.id)}
                    >
                      <RiDeleteBinLine className="size-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-label-xs text-content-subtle dark:text-content-subtle w-16">
                      Allocation
                    </span>
                    <Slider
                      value={[member.allocation]}
                      max={100}
                      step={5}
                      onValueChange={(val) => updateAllocation(member.id, val)}
                      className="flex-1"
                    />
                    <span className="text-label-md text-content dark:text-content w-10 text-right">
                      {member.allocation}%
                    </span>
                  </div>
                </div>
              )
            })}

            {squad.length === 0 && (
              <div className="rounded-md border border-dashed p-6 text-center dark:border">
                <p className="text-body-sm text-content-subtle dark:text-content-subtle">
                  No team members allocated yet.
                </p>
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
