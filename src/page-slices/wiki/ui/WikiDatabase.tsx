"use client"

import { PrefetchLink } from "@/components/prefetch-link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { useT } from "@/shared/i18n/client"
import {
  RiAddLine,
  RiDeleteBinLine,
  RiTableLine,
} from "@/shared/ui/lucide-icons"
import { useState } from "react"
import { toast } from "sonner"
import {
  PROP_TYPES,
  childrenOf,
  newPropId,
  useWikiWriter,
  wikiHref,
  type PropOption,
  type PropType,
  type PropValue,
  type WikiPageMeta,
  type WikiProp,
} from "../model/data"
import { PROP_TYPE_LABEL, PropCell } from "./props"
import { WikiIcon } from "./wiki-icon"

/** A select's options grow as people type new ones (in any row). */
export function withOption(
  schema: WikiProp[],
  propId: string,
  option: PropOption,
) {
  return schema.map((p) =>
    p.id === propId && !(p.options ?? []).some((o) => o.name === option.name)
      ? { ...p, options: [...(p.options ?? []), option] }
      : p,
  )
}

/** A property's header: its name (rename in place), type, delete. */
function PropHeader({
  prop,
  onChange,
  onDelete,
}: {
  prop: WikiProp
  onChange: (prop: WikiProp) => void
  onDelete: () => void
}) {
  const t = useT("wiki")
  const [name, setName] = useState(prop.name)
  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open && name.trim() && name.trim() !== prop.name)
          onChange({ ...prop, name: name.trim() })
      }}
    >
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="hover:text-foreground flex w-full items-center gap-1.5 text-left"
          />
        }
      >
        <span className="truncate">{prop.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <div className="p-1">
          <Input
            value={name}
            aria-label={t("propName")}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="h-8"
          />
        </div>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {t("propType")}: {t(PROP_TYPE_LABEL[prop.type])}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={prop.type}
              onValueChange={(type) =>
                onChange({ ...prop, type: type as PropType })
              }
            >
              {PROP_TYPES.map((type) => (
                <DropdownMenuRadioItem key={type} value={type}>
                  {t(PROP_TYPE_LABEL[type])}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <RiDeleteBinLine />
          {t("deleteProp")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * A database page's table, as Notion's: Nama (the row page) then each
 * property; cells edit in place; + Baru adds a row, + a property.
 */
export function WikiDatabase({
  db,
  pages,
}: {
  db: WikiPageMeta
  pages: WikiPageMeta[]
}) {
  const t = useT("wiki")
  const writer = useWikiWriter()
  const [adding, setAdding] = useState(false)
  const rows = childrenOf(pages, db.id)
  const schema = db.schema ?? []

  const saveSchema = (next: WikiProp[]) =>
    writer
      .save(db.id, { schema: next })
      .catch(() => toast.error(t("saveFailed")))
  const setValue = (row: WikiPageMeta, prop: WikiProp, value: PropValue) =>
    writer
      .setProp(row.id, prop.id, value)
      .catch(() => toast.error(t("saveFailed")))
  const addOption = (prop: WikiProp, option: PropOption) =>
    saveSchema(withOption(schema, prop.id, option))

  return (
    <div className="flex flex-col gap-2">
      <Table className="[&_td]:border-border [&_th]:border-border table-fixed border-separate border-spacing-0 [&_td]:border-b [&_td+td]:border-l [&_th]:border-b [&_th+th]:border-l">
        <colgroup>
          <col className="w-64" />
          {schema.map((p) => (
            <col key={p.id} className="w-44" />
          ))}
          <col className="w-12" />
        </colgroup>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium">
              {t("name")}
            </TableHead>
            {schema.map((prop) => (
              <TableHead
                key={prop.id}
                className="text-muted-foreground font-medium"
              >
                <PropHeader
                  prop={prop}
                  onChange={(next) =>
                    saveSchema(schema.map((p) => (p.id === prop.id ? next : p)))
                  }
                  onDelete={() =>
                    saveSchema(schema.filter((p) => p.id !== prop.id))
                  }
                />
              </TableHead>
            ))}
            <TableHead className="px-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("addProp")}
                className="text-muted-foreground"
                onClick={() =>
                  void saveSchema([
                    ...schema,
                    {
                      id: newPropId(),
                      name: `${t("newPropName")} ${schema.length + 1}`,
                      type: "text",
                    },
                  ])
                }
              >
                <RiAddLine />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="group/row">
              <TableCell className="py-0">
                <PrefetchLink
                  href={wikiHref(row)}
                  className="flex min-h-9 items-center gap-2 font-medium"
                >
                  <WikiIcon icon={row.icon} kind={row.kind} />
                  <span className="truncate">{row.title || t("untitled")}</span>
                </PrefetchLink>
              </TableCell>
              {schema.map((prop) => (
                <TableCell key={prop.id} className="px-0 py-0.5">
                  <PropCell
                    prop={prop}
                    value={row.props?.[prop.id]}
                    onChange={(value) => void setValue(row, prop, value)}
                    onAddOption={(option) => void addOption(prop, option)}
                    quiet
                  />
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 && (
        <p className="text-muted-foreground text-meta flex items-center gap-2 py-2">
          <RiTableLine className="size-4" />
          {t("noRows")}
        </p>
      )}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          disabled={adding}
          onClick={async () => {
            setAdding(true)
            try {
              await writer.create(db.id)
            } catch {
              toast.error(t("createFailed"))
            } finally {
              setAdding(false)
            }
          }}
        >
          {adding ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <RiAddLine data-icon="inline-start" />
          )}
          {t("newRow")}
        </Button>
      </div>
    </div>
  )
}

/** A row page's properties (its database's columns), under its title. */
export function RowProps({ db, row }: { db: WikiPageMeta; row: WikiPageMeta }) {
  const t = useT("wiki")
  const writer = useWikiWriter()
  const schema = db.schema ?? []
  if (!schema.length) return null
  return (
    <dl className="mt-4 flex flex-col gap-0.5 text-sm">
      {schema.map((prop) => (
        <div key={prop.id} className="grid grid-cols-[10rem_1fr] items-center">
          <dt className="text-muted-foreground truncate px-1">{prop.name}</dt>
          <dd className="min-w-0">
            <PropCell
              prop={prop}
              value={row.props?.[prop.id]}
              onChange={(value) =>
                void writer
                  .setProp(row.id, prop.id, value)
                  .catch(() => toast.error(t("saveFailed")))
              }
              onAddOption={(option) =>
                void writer
                  .save(db.id, { schema: withOption(schema, prop.id, option) })
                  .catch(() => toast.error(t("saveFailed")))
              }
            />
          </dd>
        </div>
      ))}
    </dl>
  )
}
