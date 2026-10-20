"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { createClient as createClientBrowser } from "@/shared/api/supabase/client"
import { logError } from "@/shared/lib/utils/logger"
import {
  RiArrowLeftLine,
  RiPrinterLine,
  RiSave3Line,
  RiSaveLine,
} from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { MilestonesForm } from "./MilestonesForm"
import { ScopeOfWorkForm } from "./ScopeOfWorkForm"
import SLADocumentPreview from "./SLADocumentPreview"

// --- INITIAL DATA ---
const DEFAULT_SCOPE = [
  {
    no: "1.",
    category: "Authentication",
    flow: "Login Screen",
    desc: "User login interface with email/password",
  },
  {
    no: "2.",
    category: "Authentication",
    flow: "Register Screen",
    desc: "New user registration flow",
  },
  {
    no: "3.",
    category: "Dashboard",
    flow: "Overview",
    desc: "Main dashboard view with stats",
  },
]

const DEFAULT_MILESTONES = {
  m1: [
    { no: "1.", category: "Design", desc: "Style Guide & UI Kit", time: "5" },
    { no: "2.", category: "Design", desc: "Wireframes (Low-fi)", time: "3" },
  ],
  m2: [
    {
      no: "1.",
      category: "Design",
      desc: "High Fidelity Screens (Desktop)",
      time: "7",
    },
    {
      no: "2.",
      category: "Design",
      desc: "Responsive Mobile Screens",
      time: "4",
    },
  ],
  m3: [
    {
      no: "1.",
      category: "Prototyping",
      desc: "Interactive Prototype",
      time: "3",
    },
    { no: "2.", category: "Handover", desc: "Final Asset Handover", time: "1" },
  ],
}

type ScopeOfWorkItem = {
  no: string
  category: string
  flow: string
  desc: string
}

type MilestoneItem = {
  no: string
  category: string
  desc: string
  time: string
}

type MilestonesData = {
  m1: MilestoneItem[]
  m2: MilestoneItem[]
  m3: MilestoneItem[]
}

type ClientInfo = {
  name: string
  company: string
  email: string
  address: string
  date: string
}

type AgencyInfo = {
  name: string
  email: string
  address: string
  repName: string
  repTitle: string
}

type SLAData = {
  client_info?: ClientInfo
  agency_info?: AgencyInfo
  scope_of_work?: ScopeOfWorkItem[]
  milestones?: MilestonesData
}

interface SLAContainerProps {
  slaId?: string
  initialData?: SLAData
  onBack?: () => void
  projectId?: string
}

export default function SLAContainer({
  slaId,
  initialData,
  onBack,
  projectId,
}: SLAContainerProps) {
  const router = useRouter()
  const supabase = createClientBrowser()
  const [saving, setSaving] = useState(false)

  // --- STATE ---
  const [clientInfo, setClientInfo] = useState(
    initialData?.client_info || {
      name: "",
      company: "",
      email: "",
      address: "",
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    },
  )

  const [agencyInfo, setAgencyInfo] = useState(
    initialData?.agency_info || {
      name: "",
      email: "",
      address: "",
      repName: "",
      repTitle: "",
    },
  )

  const [scopeOfWork, setScopeOfWork] = useState(
    initialData?.scope_of_work || DEFAULT_SCOPE,
  )
  const [milestones, setMilestones] = useState(
    initialData?.milestones || DEFAULT_MILESTONES,
  )

  // Project Name derived from Client Company by default, but editable?
  // For now we'll just capture it in the form or assume it's the client info company

  const [activeTab, setActiveTab] = useState("editor")

  // --- HANDLERS ---

  const handlePrint = () => {
    const titleBefore = document.title
    document.title = `SLA_${clientInfo.company.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`
    window.print()
    document.title = titleBefore
  }

  const handleSaveToDatabase = async () => {
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Login dulu")
      setSaving(false)
      return
    }

    const payload = {
      user_id: user.id,
      client_name: clientInfo.name,
      project_name: clientInfo.company,
      project_id: projectId || null,
      client_info: clientInfo,
      agency_info: agencyInfo,
      scope_of_work: scopeOfWork,
      milestones: milestones,
    }

    let result
    if (slaId) {
      // Update
      result = await supabase.from("slas").update(payload).eq("id", slaId)
    } else {
      // Insert
      result = await supabase.from("slas").insert(payload).select().single()
    }

    if (result.error) {
      toast.error("Gagal simpan")
      logError("Error", result.error)
    } else {
      toast.success(slaId ? "SLA diperbarui" : "SLA disimpan")
      if (!slaId && result.data) {
        const newId = Array.isArray(result.data)
          ? result.data[0]?.id
          : result.data.id

        if (newId) {
          router.push(`/sla-generator?mode=edit&id=${newId}`)
        }
      }
    }
    setSaving(false)
  }

  const handleExportJson = () => {
    const data = {
      clientInfo,
      agencyInfo,
      scopeOfWork,
      milestones,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sla-data-${new Date().getTime()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Data diekspor")
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 pb-4 print:hidden">
        <h1 className="text-foreground truncate text-xl font-semibold tracking-tight">
          {slaId ? "Edit SLA" : "Create SLA"}
        </h1>
      </div>

      <div className="flex h-full w-full flex-col overflow-hidden lg:flex-row print:bg-white">
        {/* --- LEFT PANEL: EDITOR (Scrollable) --- */}
        <div
          className={`border-border bg-card flex h-full w-full flex-col border-r lg:w-1/2 print:hidden ${activeTab === "preview" ? "hidden lg:flex" : "flex"}`}
        >
          {/* Header */}
          <div className="border-border bg-card sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onBack ?? (() => router.back())}
              >
                <RiArrowLeftLine className="text-muted-foreground/70 size-5" />
              </Button>
              <div className="min-w-0">
                <p className="text-label-md text-foreground truncate">
                  {slaId ? "Edit SLA" : "New SLA"}
                </p>
                <p className="text-body-sm text-muted-foreground truncate">
                  {clientInfo.company || "Untitled Project"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="lg:hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Button
                size="sm"
                onClick={handleSaveToDatabase}
                disabled={saving || !clientInfo.name}
                className="hidden lg:flex"
              >
                <RiSave3Line data-icon="inline-start" />
                {saving ? "Saving..." : "Save"}
              </Button>

              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleExportJson}
                className="hidden lg:flex"
                title="Export JSON"
              >
                <RiSaveLine />
              </Button>
              <Button
                onClick={handlePrint}
                size="icon-sm"
                variant="outline"
                className="hidden lg:flex"
                title="Print PDF"
              >
                <RiPrinterLine />
              </Button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <section className="space-y-4">
              <h3 className="text-label-md text-foreground">
                Client Information
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label>Client Name</Label>
                    <div className="mt-2">
                      <Input
                        className="h-7"
                        value={clientInfo.name}
                        onChange={(e) =>
                          setClientInfo({ ...clientInfo, name: e.target.value })
                        }
                        placeholder="e.g. John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="mt-2">
                      <Input
                        className="h-7"
                        value={clientInfo.email}
                        onChange={(e) =>
                          setClientInfo({
                            ...clientInfo,
                            email: e.target.value,
                          })
                        }
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Company / Project Name</Label>
                    <div className="mt-2">
                      <Input
                        className="h-7"
                        value={clientInfo.company}
                        onChange={(e) =>
                          setClientInfo({
                            ...clientInfo,
                            company: e.target.value,
                          })
                        }
                        placeholder="e.g. Acme Corp"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <div className="mt-2">
                      <Input
                        className="h-7"
                        value={clientInfo.date}
                        onChange={(e) =>
                          setClientInfo({ ...clientInfo, date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label>Address</Label>
                  <div className="mt-2">
                    <Input
                      className="h-7"
                      value={clientInfo.address}
                      onChange={(e) =>
                        setClientInfo({
                          ...clientInfo,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h3 className="text-label-md text-foreground">
                Agency Information
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Agency Name</Label>
                  <div className="mt-2">
                    <Input
                      className="h-7"
                      value={agencyInfo.name}
                      onChange={(e) =>
                        setAgencyInfo({ ...agencyInfo, name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Representative Name</Label>
                  <div className="mt-2">
                    <Input
                      className="h-7"
                      value={agencyInfo.repName}
                      onChange={(e) =>
                        setAgencyInfo({
                          ...agencyInfo,
                          repName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Representative Title</Label>
                  <div className="mt-2">
                    <Input
                      className="h-7"
                      value={agencyInfo.repTitle}
                      onChange={(e) =>
                        setAgencyInfo({
                          ...agencyInfo,
                          repTitle: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="mt-2">
                    <Input
                      className="h-7"
                      value={agencyInfo.email}
                      onChange={(e) =>
                        setAgencyInfo({ ...agencyInfo, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label>Address</Label>
                  <div className="mt-2">
                    <Textarea
                      value={agencyInfo.address}
                      onChange={(e) =>
                        setAgencyInfo({
                          ...agencyInfo,
                          address: e.target.value,
                        })
                      }
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <ScopeOfWorkForm data={scopeOfWork} onChange={setScopeOfWork} />
            </section>

            <Separator />

            <section>
              <MilestonesForm data={milestones} onChange={setMilestones} />
            </section>

            <div className="h-10"></div>
          </div>
        </div>

        {/* --- RIGHT PANEL: PREVIEW --- */}
        <div
          className={`bg-card flex h-full w-full flex-col lg:w-1/2 print:block print:w-full ${activeTab === "editor" ? "hidden lg:flex" : "flex"}`}
        >
          {/* Mobile Header for Preview */}
          <div className="border-border bg-card flex items-center justify-between border-b px-5 py-4 lg:hidden print:hidden">
            <span className="text-label-md text-foreground">PDF Preview</span>
            <div className="flex gap-2">
              <Button
                size="icon-sm"
                onClick={handleSaveToDatabase}
                disabled={saving}
              >
                <RiSave3Line />
              </Button>
              <Button onClick={handlePrint} size="icon-sm">
                <RiPrinterLine />
              </Button>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center overflow-x-hidden overflow-y-auto p-5 lg:p-8">
            <SLADocumentPreview
              clientInfo={clientInfo}
              agencyInfo={agencyInfo}
              scopeOfWork={scopeOfWork}
              milestones={milestones}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
