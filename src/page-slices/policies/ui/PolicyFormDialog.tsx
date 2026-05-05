"use client"

import type {
  PolicyAudience,
  PolicyDocument,
  SavePolicyPayload,
} from "@/app/(main)/policies/actions/policy-actions"
import { logError } from "@/shared/lib/utils/logger"
import {
  Button,
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  RichTextEditor,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  TextInput,
} from "@/shared/ui"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const CATEGORIES = ["HR", "Operations", "Quality", "Finance", "Legal", "IT", "Other"]
const AUDIENCES: PolicyAudience[] = [
  "Everyone",
  "Stakeholder",
  "Employee",
  "Project Team",
]

const EMPTY_FORM = {
  title: "",
  category: "HR",
  summary: "",
  ownerRole: "",
  audience: "Everyone" as PolicyAudience,
  changeSummary: "",
  effectiveDate: "",
  publishImmediately: false,
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy?: PolicyDocument | null
}

export function PolicyFormDialog({ open, onOpenChange, policy }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [content, setContent] = useState<object | null>(null)

  const isEdit = !!policy

  useEffect(() => {
    if (!open) return
    if (policy) {
      setForm({
        title: policy.title,
        category: policy.category,
        summary: policy.summary,
        ownerRole: policy.ownerLabel,
        audience: policy.audience,
        changeSummary: "",
        effectiveDate: policy.effectiveDate ?? "",
        publishImmediately: policy.latestStatus === "Published",
      })
      setContent(
        policy.content && !Array.isArray(policy.content)
          ? (policy.content as object)
          : null,
      )
    } else {
      setForm(EMPTY_FORM)
      setContent(null)
    }
  }, [open, policy])

  function setField<K extends keyof typeof EMPTY_FORM>(
    key: K,
    value: (typeof EMPTY_FORM)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Title wajib diisi")
      return
    }

    const payload: SavePolicyPayload = {
      title: form.title.trim(),
      category: form.category,
      summary: form.summary.trim(),
      ownerRole: form.ownerRole.trim(),
      audience: form.audience,
      content: (content ?? {}) as SavePolicyPayload["content"],
      changeSummary: form.changeSummary.trim() || undefined,
      effectiveDate: form.effectiveDate || undefined,
      publishImmediately: form.publishImmediately,
    }

    setLoading(true)
    try {
      let res: Response
      if (isEdit && policy?.versionId) {
        res = await fetch("/api/policies", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            documentId: policy.id,
            versionId: policy.versionId,
            payload,
          }),
        })
      } else {
        res = await fetch("/api/policies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      toast.success(isEdit ? "Policy updated" : "Policy created")
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      logError("Policy save failed", err)
      toast.error("Gagal menyimpan policy")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Policy" : "New Policy"}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        <DialogBody className="space-y-5 overflow-y-auto">
          {/* Basic info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="pol-title">Title</Label>
              <TextInput
                id="pol-title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Leave & Attendance Policy"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pol-category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setField("category", v)}
              >
                <SelectTrigger id="pol-category" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pol-audience">Audience</Label>
              <Select
                value={form.audience}
                onValueChange={(v) => setField("audience", v as PolicyAudience)}
              >
                <SelectTrigger id="pol-audience" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pol-owner">Owner</Label>
              <TextInput
                id="pol-owner"
                value={form.ownerRole}
                onChange={(e) => setField("ownerRole", e.target.value)}
                placeholder="People Ops"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pol-effective">Effective Date</Label>
              <TextInput
                id="pol-effective"
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setField("effectiveDate", e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="pol-summary">Summary</Label>
              <Textarea
                id="pol-summary"
                value={form.summary}
                onChange={(e) => setField("summary", e.target.value)}
                placeholder="Ringkasan singkat isi policy..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>

          {/* Rich text content */}
          <div>
            <Label className="mb-2 block">Content</Label>
            <RichTextEditor
              value={content ?? undefined}
              onChange={setContent}
              placeholder="Start writing the policy... Select text to format it."
            />
          </div>

          {/* Version note */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="pol-change">Change Summary</Label>
              <Textarea
                id="pol-change"
                value={form.changeSummary}
                onChange={(e) => setField("changeSummary", e.target.value)}
                placeholder="Apa yang berubah dari versi sebelumnya..."
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                id="pol-publish"
                type="checkbox"
                checked={form.publishImmediately}
                onChange={(e) =>
                  setField("publishImmediately", e.target.checked)
                }
                className="size-4 rounded border-neutral-primary"
              />
              <Label htmlFor="pol-publish" className="cursor-pointer">
                Publish immediately
              </Label>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={loading}>
            {isEdit ? "Save changes" : "Create policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
