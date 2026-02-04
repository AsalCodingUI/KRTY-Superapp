"use client"

import { Button } from "@/components/ui"
import { logError } from "@/shared/lib/utils/logger"
import { Divider } from "@/components/ui"
import { Label } from "@/components/ui"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui"
import { Textarea } from "@/components/ui"
import { TextInput } from "@/components/ui"
import { createClient as createClientBrowser } from "@/shared/api/supabase/client"
import {
  RiArrowLeftLine,
  RiPrinterLine,
  RiSave3Line,
  RiSaveLine,
} from "@remixicon/react"
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
}

export default function SLAContainer({
  slaId,
  initialData,
  onBack,
}: SLAContainerProps) {
  const router = useRouter()
  const supabase = createClientBrowser()
  const [saving, setSaving] = useState(false)

  // --- STATE ---
  const [clientInfo, setClientInfo] = useState(
    initialData?.client_info || {
      name: "Shafiq shah",
      company: "SiteNav AI",
      email: "Shafiq.Shah298@gmail.com",
      address: "United Kingdom",
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    },
  )

  const [agencyInfo, setAgencyInfo] = useState(
    initialData?.agency_info || {
      name: "Kretya Studio",
      email: "kretyastudio@gmail.com",
      address: "Cluster Seven Residence No.B8\n17157, Bekasi City\nIndonesia",
      repName: "Ahmad Fauzi",
      repTitle: "Creative Director, Kretya Studio",
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
      toast.error("You must be logged in to save.")
      setSaving(false)
      return
    }

    const payload = {
      user_id: user.id,
      client_name: clientInfo.name,
      project_name: clientInfo.company, // Using company as project name for now
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
      toast.error("Failed to save SLA")
      logError("Error", result.error)
    } else {
      toast.success(slaId ? "SLA Updated" : "SLA Saved")
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
    toast.success("Project data exported to JSON")
  }

  return (
    <div className="bg-muted flex h-full w-full flex-col overflow-hidden lg:flex-row print:bg-white">
      {/* --- LEFT PANEL: EDITOR (Scrollable) --- */}
      <div
        className={`border-border-border bg-surface flex h-full w-full flex-col border-r lg:w-1/2 print:hidden ${activeTab === "preview" ? "hidden lg:flex" : "flex"}`}
      >
        {/* Header */}
        <div className="border-border-border bg-surface sticky top-0 z-10 flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="p-2" onClick={onBack}>
              <RiArrowLeftLine className="text-tremor-content-subtle h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-tremor-content-strong text-xl font-bold">
                {slaId ? "Edit SLA" : "New SLA"}
              </h1>
              <p className="text-tremor-content-subtle text-sm">
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
              variant="primary"
              size="sm"
              onClick={handleSaveToDatabase}
              disabled={saving || !clientInfo.name}
              className="hidden lg:flex"
            >
              <RiSave3Line className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportJson}
              className="hidden lg:flex"
              title="Export JSON"
            >
              <RiSaveLine className="h-4 w-4" />
            </Button>
            <Button
              onClick={handlePrint}
              size="sm"
              variant="secondary"
              className="hidden lg:flex"
              title="Print PDF"
            >
              <RiPrinterLine className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {/* 1. Client Info */}
          <div>
            <h3 className="text-md text-content dark:text-content mb-6 font-semibold">
              Client Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <TextInput
                  value={clientInfo.name}
                  onChange={(e) =>
                    setClientInfo({ ...clientInfo, name: e.target.value })
                  }
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Company / Project Name</Label>
                <TextInput
                  value={clientInfo.company}
                  onChange={(e) =>
                    setClientInfo({ ...clientInfo, company: e.target.value })
                  }
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <TextInput
                  value={clientInfo.email}
                  onChange={(e) =>
                    setClientInfo({ ...clientInfo, email: e.target.value })
                  }
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <TextInput
                  value={clientInfo.date}
                  onChange={(e) =>
                    setClientInfo({ ...clientInfo, date: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Address</Label>
                <TextInput
                  value={clientInfo.address}
                  onChange={(e) =>
                    setClientInfo({ ...clientInfo, address: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <Divider />

          {/* 2. Agency Info */}
          <div>
            <h3 className="text-md text-content dark:text-content mb-6 font-semibold">
              Agency Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agency Name</Label>
                <TextInput
                  value={agencyInfo.name}
                  onChange={(e) =>
                    setAgencyInfo({ ...agencyInfo, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Representative Name</Label>
                <TextInput
                  value={agencyInfo.repName}
                  onChange={(e) =>
                    setAgencyInfo({ ...agencyInfo, repName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Representative Title</Label>
                <TextInput
                  value={agencyInfo.repTitle}
                  onChange={(e) =>
                    setAgencyInfo({ ...agencyInfo, repTitle: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <TextInput
                  value={agencyInfo.email}
                  onChange={(e) =>
                    setAgencyInfo({ ...agencyInfo, email: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={agencyInfo.address}
                  onChange={(e) =>
                    setAgencyInfo({ ...agencyInfo, address: e.target.value })
                  }
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <Divider />

          {/* 3. Scope of Work */}
          <ScopeOfWorkForm data={scopeOfWork} onChange={setScopeOfWork} />

          {/* 4. Milestones */}
          <MilestonesForm data={milestones} onChange={setMilestones} />

          {/* Padding Bottom for scroll */}
          <div className="h-10"></div>
        </div>
      </div>

      {/* --- RIGHT PANEL: PREVIEW --- */}
      <div
        className={`bg-tremor-background-subtle flex h-full w-full flex-col lg:w-1/2 print:block print:w-full ${activeTab === "editor" ? "hidden lg:flex" : "flex"}`}
      >
        {/* Mobile Header for Preview */}
        <div className="border-border-border bg-surface flex items-center justify-between border-b p-4 lg:hidden print:hidden">
          <span className="text-tremor-content-strong font-semibold">
            PDF Preview
          </span>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveToDatabase}
              disabled={saving}
            >
              <RiSave3Line className="h-4 w-4" />
            </Button>
            <Button onClick={handlePrint} size="sm">
              <RiPrinterLine className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center overflow-x-hidden overflow-y-auto p-4 lg:p-8">
          <SLADocumentPreview
            clientInfo={clientInfo}
            agencyInfo={agencyInfo}
            scopeOfWork={scopeOfWork}
            milestones={milestones}
          />
        </div>
      </div>
    </div>
  )
}
