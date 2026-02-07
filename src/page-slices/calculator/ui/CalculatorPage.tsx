"use client"

import { Database } from "@/shared/types/database.types"
import {
  Badge, Button, Divider, Input, Label, Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, Slider, TabNavigation, TabNavigationLink
} from "@/shared/ui"
import { RiAddLine, RiCalculatorLine, RiDeleteBinLine } from "@/shared/ui/lucide-icons"
import { useMemo, useState } from "react"
import { FinancialHUD } from "./components/FinancialHUD"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type TeamMember = Pick<Profile, "id" | "full_name" | "job_title" | "hourly_rate">

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

interface FreelanceMember {
  id: string
  name: string
  role: string
  expectedSalary: string
  allocation: number // 0-100
}

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

export default function CalculatorClientPage({
  teamMembers,
}: {
  teamMembers: TeamMember[]
}) {
  const WORK_DAYS_PER_MONTH = 22
  const [activeTab, setActiveTab] = useState<"team" | "freelance">("team")
  const [revenueUSD, setRevenueUSD] = useState<string>("1,000")
  const [exchangeRate, setExchangeRate] = useState<string>("15,000")
  const [hoursPerDay, setHoursPerDay] = useState<string>("8")
  const [platformFeePercent, setPlatformFeePercent] = useState<string>("2")

  const [phases, setPhases] = useState<Phase[]>([
    { id: "1", name: "Discovery & Design", days: 5, buffer: 1 },
    { id: "2", name: "Development", days: 10, buffer: 2 },
  ])

  const [squad, setSquad] = useState<SquadMember[]>([])
  const [freelanceSquad, setFreelanceSquad] = useState<FreelanceMember[]>([])

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
    const hours = parseNumber(hoursPerDay) * totalDuration
    if (activeTab === "freelance") {
      return freelanceSquad.reduce((total, member) => {
        const expectedSalary = parseNumber(member.expectedSalary)
        const hourlyRate =
          hours > 0 ? expectedSalary / (WORK_DAYS_PER_MONTH * hours) : 0
        const cost = hourlyRate * hours * (member.allocation / 100)
        return total + cost
      }, 0)
    }

    return squad.reduce((total, member) => {
      const profile = teamMembers.find((p) => p.id === member.profileId)
      if (!profile) return total
      const cost =
        (profile.hourly_rate || 0) * hours * (member.allocation / 100)
      return total + cost
    }, 0)
  }, [activeTab, freelanceSquad, squad, teamMembers, totalDuration, hoursPerDay])

  const platformFee = useMemo(() => {
    return grossRevenue * (parseNumber(platformFeePercent) / 100)
  }, [grossRevenue, platformFeePercent])

  const netProfit = grossRevenue - totalLaborCost - platformFee
  const marginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0

  // --- HANDLERS ---
  const addPhase = () => {
    setPhases([
      ...phases,
      { id: createId(), name: "New Phase", days: 1, buffer: 0 },
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
    setSquad([...squad, { id: createId(), profileId, allocation: 100 }])
  }

  const removeSquadMember = (id: string) => {
    setSquad(squad.filter((s) => s.id !== id))
  }

  const updateAllocation = (id: string, value: number[]) => {
    setSquad(
      squad.map((s) => (s.id === id ? { ...s, allocation: value[0] } : s)),
    )
  }

  const addFreelanceMember = () => {
    setFreelanceSquad([
      ...freelanceSquad,
      {
        id: createId(),
        name: "",
        role: "",
        expectedSalary: "",
        allocation: 100,
      },
    ])
  }

  const removeFreelanceMember = (id: string) => {
    setFreelanceSquad(freelanceSquad.filter((s) => s.id !== id))
  }

  const updateFreelanceMember = (
    id: string,
    field: keyof FreelanceMember,
    value: string | number,
  ) => {
    setFreelanceSquad(
      freelanceSquad.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    )
  }

  const updateFreelanceAllocation = (id: string, value: number[]) => {
    setFreelanceSquad(
      freelanceSquad.map((s) =>
        s.id === id ? { ...s, allocation: value[0] } : s,
      ),
    )
  }

  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState<string>("")

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-[14px] px-5 pt-4 pb-3">
        <RiCalculatorLine className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">
          Project Calculator
        </p>
      </div>

      <div className="bg-surface-neutral-primary flex flex-col rounded-[14px]">
        <div className="px-5 pt-2 border-b border-neutral-primary">
          <TabNavigation className="border-b-0">
            <TabNavigationLink
              active={activeTab === "team"}
              onClick={() => setActiveTab("team")}
              showLeadingIcon={false}
            >
              Team Allocation
            </TabNavigationLink>
            <TabNavigationLink
              active={activeTab === "freelance"}
              onClick={() => setActiveTab("freelance")}
              showLeadingIcon={false}
            >
              Freelance Allocation
            </TabNavigationLink>
          </TabNavigation>
        </div>

        <div className="p-5">
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
                      onChange={(e) =>
                        setRevenueUSD(formatNumber(e.target.value))
                      }
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
                      onChange={(e) =>
                        setExchangeRate(formatNumber(e.target.value))
                      }
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
                      onChange={(e) =>
                        setPlatformFeePercent(e.target.value)
                      }
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

                {activeTab === "team" ? (
                  <>
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
                        const profile = teamMembers.find(
                          (p) => p.id === member.profileId,
                        )
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
                                onValueChange={(val) =>
                                  updateAllocation(member.id, val)
                                }
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
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={addFreelanceMember}
                      >
                        <RiAddLine className="mr-2 size-4" /> Add Freelance
                        Member
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {freelanceSquad.map((member) => (
                        <div
                          key={member.id}
                          className="border-border bg-surface dark:bg-surface rounded-lg border p-4"
                        >
                          <div className="mb-4 flex items-start justify-between gap-4">
                            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <div>
                                <Label htmlFor={`freelance-name-${member.id}`}>
                                  Full Name
                                </Label>
                                <Input
                                  id={`freelance-name-${member.id}`}
                                  value={member.name}
                                  onChange={(e) =>
                                    updateFreelanceMember(
                                      member.id,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="e.g. Jane Doe"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`freelance-role-${member.id}`}>
                                  Role
                                </Label>
                                <Input
                                  id={`freelance-role-${member.id}`}
                                  value={member.role}
                                  onChange={(e) =>
                                    updateFreelanceMember(
                                      member.id,
                                      "role",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="e.g. UI Designer"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`freelance-salary-${member.id}`}>
                                  Expected Salary
                                </Label>
                                <Input
                                  id={`freelance-salary-${member.id}`}
                                  type="text"
                                  value={member.expectedSalary}
                                  onChange={(e) =>
                                    updateFreelanceMember(
                                      member.id,
                                      "expectedSalary",
                                      formatNumber(e.target.value),
                                    )
                                  }
                                  placeholder="e.g. 15,000,000"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-content-placeholder size-6 p-0"
                              onClick={() => removeFreelanceMember(member.id)}
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
                              onValueChange={(val) =>
                                updateFreelanceAllocation(member.id, val)
                              }
                              className="flex-1"
                            />
                            <span className="text-label-md text-content dark:text-content w-10 text-right">
                              {member.allocation}%
                            </span>
                          </div>
                        </div>
                      ))}

                      {freelanceSquad.length === 0 && (
                        <div className="rounded-md border border-dashed p-6 text-center dark:border">
                          <p className="text-body-sm text-content-subtle dark:text-content-subtle">
                            No freelance members added yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
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
        </div>
      </div>
    </div>
  )
}
