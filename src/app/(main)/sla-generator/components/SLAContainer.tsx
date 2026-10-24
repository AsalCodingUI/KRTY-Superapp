"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { createClient as createClientBrowser } from "@/shared/api/supabase/client"
import { useT } from "@/shared/i18n/client"
import { logError } from "@/shared/lib/utils/logger"
import {
  RiArrowLeftLine,
  RiPrinterLine,
  RiSave3Line,
  RiSaveLine,
} from "@/shared/ui/lucide-icons"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

// Heavy editor sections and the document preview ship as separate chunks.
const MilestonesForm = dynamic(
  () => import("./MilestonesForm").then((m) => m.MilestonesForm),
  { loading: () => null },
)
const ScopeOfWorkForm = dynamic(
  () => import("./ScopeOfWorkForm").then((m) => m.ScopeOfWorkForm),
  { loading: () => null },
)
const SLADocumentPreview = dynamic(() => import("./SLADocumentPreview"), {
  loading: () => null,
})

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
  const t = useT("sla")
  const tc = useT("common")
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
      toast.error(t("toastLoginFirst"))
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
      toast.error(t("toastSaveFailed"))
      logError("Error", result.error)
    } else {
      toast.success(slaId ? t("toastUpdated") : t("toastSaved"))
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
    toast.success(t("toastExported"))
  }

  return (
    <div className="flex flex-col">
      <div className="flex h-full w-full flex-col overflow-hidden lg:flex-row print:bg-white">
        {/* --- LEFT PANEL: EDITOR (Scrollable) --- */}
        <div
          className={`border-border bg-card flex h-full w-full flex-col border-r lg:w-1/2 print:hidden ${activeTab === "preview" ? "hidden lg:flex" : "flex"}`}
        >
          {/* Header */}
          <div className="border-border bg-background dark:bg-surface sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack ?? (() => router.back())}
              >
                <RiArrowLeftLine className="text-tertiary-foreground size-5" />
              </Button>
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-medium">
                  {slaId ? t("editSla") : t("newSla")}
                </p>
                <p className="text-muted-foreground truncate text-sm">
                  {clientInfo.company || t("untitledProject")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="lg:hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="editor">{t("tabEditor")}</TabsTrigger>
                    <TabsTrigger value="preview">{t("tabPreview")}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Button
                onClick={handleSaveToDatabase}
                disabled={saving || !clientInfo.name}
                className="hidden lg:flex"
              >
                <RiSave3Line data-icon="inline-start" />
                {saving ? tc("saving") : tc("save")}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleExportJson}
                className="hidden lg:flex"
                title={t("exportJson")}
              >
                <RiSaveLine />
              </Button>
              <Button
                onClick={handlePrint}
                size="icon"
                variant="outline"
                className="hidden lg:flex"
                title={t("printPdf")}
              >
                <RiPrinterLine />
              </Button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <section className="space-y-4">
              <h3 className="text-foreground text-sm font-medium">
                {t("clientInfo")}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label>{t("clientName")}</Label>
                    <div className="mt-2">
                      <Input
                        value={clientInfo.name}
                        onChange={(e) =>
                          setClientInfo({ ...clientInfo, name: e.target.value })
                        }
                        placeholder={t("clientNamePlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t("email")}</Label>
                    <div className="mt-2">
                      <Input
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
                    <Label>{t("companyProjectName")}</Label>
                    <div className="mt-2">
                      <Input
                        value={clientInfo.company}
                        onChange={(e) =>
                          setClientInfo({
                            ...clientInfo,
                            company: e.target.value,
                          })
                        }
                        placeholder={t("companyPlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t("date")}</Label>
                    <div className="mt-2">
                      <Input
                        value={clientInfo.date}
                        onChange={(e) =>
                          setClientInfo({ ...clientInfo, date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label>{t("address")}</Label>
                  <div className="mt-2">
                    <Input
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
              <h3 className="text-foreground text-sm font-medium">
                {t("agencyInfo")}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>{t("agencyName")}</Label>
                  <div className="mt-2">
                    <Input
                      value={agencyInfo.name}
                      onChange={(e) =>
                        setAgencyInfo({ ...agencyInfo, name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>{t("repName")}</Label>
                  <div className="mt-2">
                    <Input
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
                  <Label>{t("repTitle")}</Label>
                  <div className="mt-2">
                    <Input
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
                  <Label>{t("email")}</Label>
                  <div className="mt-2">
                    <Input
                      value={agencyInfo.email}
                      onChange={(e) =>
                        setAgencyInfo({ ...agencyInfo, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label>{t("address")}</Label>
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
          <div className="border-border flex items-center justify-between border-b px-5 py-4 lg:hidden print:hidden">
            <span className="text-foreground text-sm font-medium">
              {t("pdfPreview")}
            </span>
            <div className="flex gap-2">
              <Button
                size="icon"
                onClick={handleSaveToDatabase}
                disabled={saving}
              >
                <RiSave3Line />
              </Button>
              <Button onClick={handlePrint} size="icon">
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
