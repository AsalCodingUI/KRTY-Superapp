"use client"

import { LightboxScope, useLightbox } from "@/components/image-lightbox"
import type { Editor } from "@tiptap/react"
import { useEffect, type ReactNode } from "react"

/** Pointer over a picture that opens large (read-only). */
const ZOOMABLE = "[&_.doc-image_img]:cursor-zoom-in"

/**
 * The editor's lightbox (components/image-lightbox): all the document's
 * pictures, galleries included, in order. Read-only, a click on a picture
 * opens it; editing, a click picks it and the image menu's "Buka" (or a
 * gallery picture's) opens it.
 */
export function EditorLightbox({
  editor,
  children,
}: {
  editor: Editor | null
  children: ReactNode
}) {
  return (
    <LightboxScope
      root={() => (editor && !editor.isDestroyed ? editor.view.dom : null)}
    >
      {children}
      {editor && <ReadOnlyImageClicks editor={editor} />}
    </LightboxScope>
  )
}

function ReadOnlyImageClicks({ editor }: { editor: Editor }) {
  const lightbox = useLightbox()
  useEffect(() => {
    if (editor.isDestroyed || !lightbox) return
    const dom = editor.view.dom
    if (!editor.isEditable) dom.classList.add(ZOOMABLE)
    const onClick = (e: MouseEvent) => {
      if (editor.isEditable) return
      const img = (e.target as Element | null)?.closest?.(".doc-image img")
      if (img instanceof HTMLImageElement) lightbox.open(img)
    }
    dom.addEventListener("click", onClick)
    return () => {
      dom.removeEventListener("click", onClick)
      dom.classList.remove(ZOOMABLE)
    }
  }, [editor, lightbox])
  return null
}

/** The selected picture, for the image menu's "Buka". */
export function selectedImage(editor: Editor) {
  const dom = editor.view.nodeDOM(editor.state.selection.from)
  return dom instanceof HTMLElement
    ? (dom.querySelector("img") ??
        (dom instanceof HTMLImageElement ? dom : null))
    : null
}
