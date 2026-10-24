"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { Paperclip } from "lucide-react"
import * as React from "react"

/**
 * A file picker that looks like the rest of the form (a field with a
 * "Pilih file" button and the chosen name) instead of the browser's
 * "Choose File / No file chosen" control. Files can also be dropped on it.
 */
export function FileField({
  id,
  accept,
  multiple,
  disabled,
  onChange,
  fileName,
  className,
}: {
  id?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
  onChange: (
    files: FileList | null,
    event?: React.ChangeEvent<HTMLInputElement>,
  ) => void
  /** Name to show when a file is already chosen elsewhere (e.g. dropped). */
  fileName?: string | null
  className?: string
}) {
  const tc = useT("common")
  const input = React.useRef<HTMLInputElement>(null)
  const [picked, setPicked] = React.useState<string[]>([])
  const [over, setOver] = React.useState(false)
  const names = picked.length ? picked : fileName ? [fileName] : []

  return (
    <div
      onDragOver={(e) => {
        if (disabled || !e.dataTransfer.types.includes("Files")) return
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (disabled || !e.dataTransfer.files.length) return
        e.preventDefault()
        e.stopPropagation()
        setOver(false)
        const files = e.dataTransfer.files
        setPicked(
          Array.from(files)
            .slice(0, multiple ? undefined : 1)
            .map((f) => f.name),
        )
        onChange(files)
      }}
      className={cn(
        // 3px all round the button (32px field, 1px border, 24px button).
        "bg-field border-field-border flex h-8 min-w-0 items-center gap-2 rounded-full border pr-3 pl-[3px] text-sm transition-colors",
        over && "border-primary/50 bg-primary/5",
        disabled && "opacity-50",
        className,
      )}
    >
      <Button
        type="button"
        variant="secondary"
        size="xs"
        disabled={disabled}
        onClick={() => input.current?.click()}
        className="shrink-0"
      >
        <Paperclip data-icon="inline-start" />
        {tc("chooseFile")}
      </Button>
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          names.length ? "text-foreground" : "text-tertiary-foreground",
        )}
        title={names.join(", ") || undefined}
      >
        {names.length
          ? names.join(", ")
          : over
            ? tc("dropToUpload")
            : tc("noFileChosen")}
      </span>
      <input
        ref={input}
        id={id}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          setPicked(Array.from(e.target.files ?? []).map((f) => f.name))
          onChange(e.target.files, e)
        }}
      />
    </div>
  )
}
