"use client"

import {
  deleteCompetency,
  getCompetencies,
  saveCompetency,
  type CompetencyRow,
} from "@/app/(main)/performance/actions/competency-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  GroupedList,
  ListGroup,
  ListRow,
  ListRowActions,
} from "@/components/grouped-list"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Constants } from "@/shared/types/database.types"
import { RiAddLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

type Role = CompetencyRow["role"]
const ROLES = Constants.public.Enums.project_role_enum as readonly Role[]

type Draft = { id?: string; role: Role; name: string; description: string }

/** Competencies per project role; used as the checklist when scoring. */
export function CompetencyLibrary() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["competencies"],
    queryFn: () => getCompetencies(),
  })
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<CompetencyRow | null>(null)
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["competencies"] })

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }

  const save = async () => {
    if (!draft) return
    setSaving(true)
    const result = await saveCompetency(draft)
    setSaving(false)
    if (!result.success) {
      toast.error(result.error ?? "Gagal menyimpan.")
      return
    }
    toast.success(draft.id ? "Kompetensi diubah" : "Kompetensi ditambahkan")
    setDraft(null)
    refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Checklist kualitas kerja per peran di project. Dipakai saat menilai
          anggota.
        </p>
        <Button
          onClick={() =>
            setDraft({ role: ROLES[0], name: "", description: "" })
          }
        >
          <RiAddLine data-icon="inline-start" />
          Kompetensi
        </Button>
      </div>

      <GroupedList>
        {ROLES.map((role) => {
          const items = data.filter((c) => c.role === role)
          return (
            <ListGroup
              key={role}
              label={role}
              count={items.length}
              action={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Tambah kompetensi ${role}`}
                  onClick={() => setDraft({ role, name: "", description: "" })}
                >
                  <RiAddLine />
                </Button>
              }
            >
              {items.length === 0 ? (
                <ListRow className="text-muted-foreground">
                  Belum ada kompetensi. Anggota dengan peran ini tidak punya
                  nilai kualitas kerja.
                </ListRow>
              ) : (
                items.map((c) => (
                  <ListRow key={c.id}>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium">{c.name}</span>
                      {c.description && (
                        <span className="text-muted-foreground truncate text-xs">
                          {c.description}
                        </span>
                      )}
                    </div>
                    <ListRowActions>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDraft({
                            id: c.id,
                            role: c.role,
                            name: c.name,
                            description: c.description ?? "",
                          })
                        }
                      >
                        Ubah
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRemoving(c)}
                      >
                        Hapus
                      </Button>
                    </ListRowActions>
                    {c.usage > 0 && (
                      <span className="text-muted-foreground w-24 shrink-0 text-right text-xs tabular-nums">
                        {c.usage} penilaian
                      </span>
                    )}
                  </ListRow>
                ))
              )}
            </ListGroup>
          )
        })}
      </GroupedList>

      <Dialog open={Boolean(draft)} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {draft?.id ? "Ubah kompetensi" : "Kompetensi baru"}
            </DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Peran</Label>
                <Select
                  value={draft.role}
                  onValueChange={(v) =>
                    v && setDraft({ ...draft, role: v as Role })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="comp-name">Nama</Label>
                <Input
                  id="comp-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="comp-desc">Penjelasan</Label>
                <Textarea
                  id="comp-desc"
                  placeholder="Kapan kompetensi ini dianggap tercapai"
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Batal
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Hapus "${removing?.name ?? ""}"?`}
        description={
          removing?.usage
            ? `Sudah dipakai di ${removing.usage} penilaian, jadi tidak bisa dihapus. Ubah namanya saja kalau perlu.`
            : "Kompetensi dihapus permanen."
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
        onConfirm={async () => {
          if (!removing) return
          const result = await deleteCompetency(removing.id)
          if (result.success) toast.success("Kompetensi dihapus")
          else toast.error(result.error ?? "Gagal menghapus.")
          setRemoving(null)
          refresh()
        }}
      />
    </div>
  )
}
