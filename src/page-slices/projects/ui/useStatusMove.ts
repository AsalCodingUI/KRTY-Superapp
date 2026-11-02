"use client"

import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { useState } from "react"
import type { ProjectStatus } from "../lib/status"
import type { ProjectListRow } from "./ProjectList"

export type MoveProject = (
  project: ProjectListRow,
  status: ProjectStatus,
) => Promise<boolean>

/**
 * Drag a project onto a status (kanban column or list group; droppable ids
 * are statuses). It moves right away and goes back if saving fails; on
 * success the override stays until the refetched list agrees.
 */
export function useStatusMove(
  projects: ProjectListRow[],
  onMove: MoveProject | undefined,
) {
  const [overrides, setOverrides] = useState<Record<string, ProjectStatus>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  // A click opens the project; only a 6px+ drag moves it.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const statusOf = (p: ProjectListRow) => overrides[p.id] ?? p.status
  const active = projects.find((p) => p.id === activeId) ?? null

  /** Also used by the "Pindahkan ke" menus, so they move just as quickly. */
  const move = async (project: ProjectListRow, target: ProjectStatus) => {
    if (!onMove || statusOf(project) === target) return
    setOverrides((o) => ({ ...o, [project.id]: target }))
    const ok = await onMove(project, target)
    if (!ok) setOverrides((o) => ({ ...o, [project.id]: project.status }))
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
