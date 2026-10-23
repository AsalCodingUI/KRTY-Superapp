"use client"

import { useRef, useState } from "react"

/**
 * Drag files from the computer onto an area to upload them. Only reacts to
 * real files (not cards dragged inside the app). Spread `bind` on the area
 * and show an overlay while `dragging`.
 */
export function useFileDrop(
  onFiles: (files: FileList) => void,
  enabled = true,
) {
  const [dragging, setDragging] = useState(false)
  // dragenter/leave fire for every child; count them to know when we left.
  const depth = useRef(0)
  const hasFiles = (e: React.DragEvent) =>
    enabled && Array.from(e.dataTransfer.types).includes("Files")

  const bind = {
    onDragEnter: (e: React.DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth.current++
      setDragging(true)
    },
    onDragOver: (e: React.DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      e.dataTransfer.dropEffect = "copy"
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!hasFiles(e)) return
      depth.current = Math.max(0, depth.current - 1)
      if (depth.current === 0) setDragging(false)
    },
    onDrop: (e: React.DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth.current = 0
      setDragging(false)
      if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files)
    },
  }
  return { dragging, bind }
}

/** Type used when dragging a library file card onto a folder. */
export const FILE_DRAG_TYPE = "application/x-krty-file"
