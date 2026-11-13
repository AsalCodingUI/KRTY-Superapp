"use client"

import type { Editor } from "@tiptap/react"
import { useState } from "react"
import { CALLOUT_SLASH_ITEM, Callout } from "./callout"
import {
  Gallery,
  gallerySlashItem,
  galleryStorage,
  useGalleryPicker,
  type GalleryPicker,
} from "./gallery"
import type { BlockItem } from "./slash-command"
import { TOGGLE_NODES, TOGGLE_SLASH_ITEM } from "./toggle"
import { COLUMN_NODES } from "./columns"

/*
 * The richer blocks of documents with pictures (reports, notes, rules):
 * callout, toggle and gallery. Their Markdown is described in
 * shared/lib/doc-blocks.
 */

// Columns parse in every document; only the wiki offers them in "/".
export const DOC_BLOCK_NODES = [
  Callout,
  ...TOGGLE_NODES,
  Gallery,
  ...COLUMN_NODES,
]

/** Their "/" items; the gallery's opens `pick`. */
export const docBlockSlashItems = (pick: GalleryPicker): BlockItem[] => [
  CALLOUT_SLASH_ITEM,
  TOGGLE_SLASH_ITEM,
  gallerySlashItem(pick),
]

/**
 * For useDocUploads: the gallery's picker (uploading the way images do),
 * its hidden input, and an editor ref that hands the picker to the editor
 * (for a gallery's own "add" button) as soon as it's set.
 */
export function useDocBlocks(
  getUpload: () =>
    | ((file: File, original: boolean) => Promise<string>)
    | undefined,
) {
  const { pick, input } = useGalleryPicker(getUpload)
  const [editorRef] = useState(() => {
    let editor: Editor | null = null
    return {
      get current() {
        return editor
      },
      set current(next: Editor | null) {
        editor = next
        const storage = next && !next.isDestroyed && galleryStorage(next)
        if (storage) storage.pick = pick
      },
    }
  })
  return { pick, input, editorRef }
}
