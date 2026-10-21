"use client"

import { getLeadTeam } from "@/app/(main)/performance/actions/kpi-actions"
import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  ListChip,
  ListGroup,
  ListRow,
} from "@/components/grouped-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { formatPercent } from "@/entities/performance/lib/kpi"
import { RiArrowRightSLine, RiGroupLine } from "@/shared/ui/lucide-icons"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

/** "Tim saya": projects the user leads, members to score on each. */
export function LeadTeam({ period }: { period: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["lead-team", period],
    queryFn: () => getLeadTeam(period),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }
  if (!data?.success) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        {data?.error ?? "Gagal memuat tim."}
      </p>
    )
  }
  if (data.data.length === 0) {
    return (
      <EmptyState
        title="Belum ada project yang kamu pimpin"
        description="Project tempat kamu jadi lead di periode ini akan muncul di sini."
        icon={<RiGroupLine className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">
        Nilai milestone SLA dan kompetensi anggota di project yang kamu pimpin.
      </p>
      <GroupedList>
        {data.data.map((project) => (
          <ListGroup
            key={project.projectId}
            label={project.name}
            count={project.members.length}
            action={
              project.quarter ? (
                <span className="text-muted-foreground text-xs">
                  {project.quarter}
                </span>
              ) : undefined
            }
          >
            {project.members.length === 0 ? (
              <ListRow className="text-muted-foreground">
                Belum ada anggota lain di project ini.
              </ListRow>
            ) : (
              project.members.map((m) => (
                <ListRow key={m.assignmentId} className="relative">
                  <Avatar className="size-5">
                    <AvatarImage src={m.avatar_url || undefined} alt="" />
                    <AvatarFallback className="text-[10px]">
                      {(m.full_name || "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Link
                    href={`/performance/employee/${m.id}/project/${project.projectId}?dari=tim&periode=${encodeURIComponent(period)}`}
                    prefetch={false}
                    className="min-w-0 flex-1 truncate font-medium outline-none after:absolute after:inset-0"
                  >
                    {m.full_name}
                  </Link>
                  <ListChip>{m.role}</ListChip>
                  <span className="w-24 text-right text-xs">
                    <span className="text-muted-foreground">SLA </span>
                    {m.sla === null ? (
                      <span className="text-warning">belum</span>
                    ) : (
                      <span className="font-medium tabular-nums">
                        {formatPercent(m.sla)}
                      </span>
                    )}
                  </span>
                  <span className="w-28 text-right text-xs">
                    <span className="text-muted-foreground">Kualitas </span>
                    {m.quality === null ? (
                      <span className="text-warning">belum</span>
                    ) : (
                      <span className="font-medium tabular-nums">
                        {formatPercent(m.quality)}
                      </span>
                    )}
                  </span>
                  <RiArrowRightSLine className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100" />
                </ListRow>
              ))
            )}
          </ListGroup>
        ))}
      </GroupedList>
    </div>
  )
}
