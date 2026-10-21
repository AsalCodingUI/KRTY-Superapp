"use client"

import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  ListGroup,
  ListRow,
  ListRowActions,
} from "@/components/grouped-list"
import { Button } from "@/components/ui/button"
import { RiFileTextLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import type { SLA } from "./SLAColumns"

/** SLAs grouped by client. Active rows open the editor; archived can be restored. */
export function SLAList({
  slas,
  archived,
  canManage,
  onOpen,
  onArchive,
  onRestore,
  onDelete,
}: {
  slas: SLA[]
  archived: boolean
  canManage: boolean
  onOpen: (id: string) => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onDelete: (id: string) => void
}) {
  if (slas.length === 0) {
    return (
      <EmptyState
        title={archived ? "Arsip kosong" : "Belum ada SLA"}
        description={
          archived
            ? "SLA yang diarsipkan akan muncul di sini."
            : "SLA yang dibuat akan muncul di sini."
        }
        icon={<RiFileTextLine className="size-5" />}
        placement="inner"
      />
    )
  }

  const groups = new Map<string, SLA[]>()
  for (const sla of slas) {
    const key = sla.client_name?.trim() || "Tanpa klien"
    groups.set(key, [...(groups.get(key) ?? []), sla])
  }

  return (
    <GroupedList>
      {[...groups.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([client, items]) => (
          <ListGroup key={client} label={client} count={items.length}>
            {items.map((sla) => {
              const date = archived ? sla.archived_at : sla.created_at
              return (
                <ListRow key={sla.id}>
                  {archived ? (
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {sla.title || "Tanpa judul"}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpen(sla.id)}
                      className="min-w-0 flex-1 truncate text-left font-medium hover:underline"
                    >
                      {sla.title || "Tanpa judul"}
                    </button>
                  )}
                  {canManage && (
                    <ListRowActions>
                      {archived ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRestore(sla.id)}
                          >
                            Pulihkan
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onDelete(sla.id)}
                          >
                            Hapus
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onArchive(sla.id)}
                        >
                          Arsipkan
                        </Button>
                      )}
                    </ListRowActions>
                  )}
                  {date && (
                    <span className="text-muted-foreground w-36 shrink-0 text-right text-xs">
                      {archived ? "Diarsipkan " : "Dibuat "}
                      {format(new Date(date), "d MMM yyyy", {
                        locale: idLocale,
                      })}
                    </span>
                  )}
                </ListRow>
              )
            })}
          </ListGroup>
        ))}
    </GroupedList>
  )
}
