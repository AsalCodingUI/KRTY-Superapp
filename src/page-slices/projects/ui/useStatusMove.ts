"use client"

import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { useEffect, useState } from "react"
import type { ProjectStatus } from "../lib/status"
import type { ProjectListRow } from "./ProjectList"

export type MoveProject = (
  project: ProjectListRow,
  status: ProjectStatus,
) => Promise<boolean>

/**
 * Drag a project onto a status (kanban column or list group; droppable ids
 * are statuses). It moves right away and goes back if saving fails; on
 * success the override stays until the refetched list has moved on.
 */
export function useStatusMove(
  projects: ProjectListRow[],
  onMove: MoveProject | undefined,
) {
  // Where a project was dragged, and from where: it shows there until the
  // refetched list has it somewhere else than `from` (moved, or an undo).
  const [overrides, setOverrides] = useState<
    Record<string, { to: ProjectStatus; from: ProjectStatus }>
  >({})
  const [activeId, setActiveId] = useState<string | null>(null)
  // A click opens the project; only a 6px+ drag moves it.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const statusOf = (p: ProjectListRow) => {
    const o = overrides[p.id]
    return o && p.status === o.from ? o.to : p.status
  }
  // Once the list has moved on, the override goes (so an undo back to
  // `from` shows there again).
  useEffect(() => {
    const done = Object.keys(overrides).filter((id) => {
      const p = projects.find((row) => row.id === id)
      return !p || p.status !== overrides[id].from
    })
    if (!done.length) return
    setOverrides((o) =>
      Object.fromEntries(Object.entries(o).filter(([id]) => !done.includes(id))),
    )
  }, [projects, overrides])
  const active = projects.find((p) => p.id === activeId) ?? null

  /** Also used by the "Pindahkan ke" menus, so they move just as quickly. */
  const move = async (project: ProjectListRow, target: ProjectStatus) => {
    if (!onMove || statusOf(project) === target) return
    const from = project.status
    setOverrides((o) => ({ ...o, [project.id]: { to: target, from } }))
    const ok = await onMove(project, target)
    if (!ok)
      setOverrides((o) => {
        const { [project.id]: _dropped, ...rest } = o
        return rest
      })
  }

  const onDragStart = (event: DragStartEvent) =>
    setActiveId(String(event.active.id))

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const project = projects.find((p) => p.id === event.active.id)
    const target = event.over?.id as ProjectStatus | undefined
    if (project && target) void move(project, target)
  }

  const onDragCancel = () => setActiveId(null)

  return {
    sensors,
    statusOf,
    active,
    move,
    onDragStart,
    onDragEnd,
    onDragCancel,
  }
}
