"use client"

import { EmptyState } from "@/components/empty-state"
import { SegmentedControl } from "@/components/segmented-control"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createClient } from "@/shared/api/supabase/client"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  ATTENDANCE_NOTE_TAGS,
  removeAttendanceNote,
} from "@/shared/lib/attendance"
import { daysKey, leaveTypeLabel } from "@/shared/lib/leave"
import { RiCheckLine, RiCloseLine, RiInboxLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, m } from "motion/react"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import { formatLeaveRange, leaveDays } from "./AdminLeaveList"

type Person = { full_name: string; avatar_url: string | null } | null

type PendingLeave = {
  id: number
  leave_type: string
  start_date: string
  end_date: string
  reason: string | null
  profiles: Person
}

type PendingDelete = {
  id: string
  date: string
  clock_in: string
  clock_out: string | null
  notes: string | null
  profiles: Person
}

type Tab = "leave" | "attendance"

const ROW_EXIT = {
  opacity: 0,
  height: 0,
  transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
} as const

function initials(name?: string | null) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

/**
 * Approval inbox: a button (with the waiting count) that opens one modal
 * holding every pending leave request and attendance delete request, each
 * decided in place without leaving the page.
 */
export function ApprovalInbox({
  onChanged,
  trigger,
}: {
  onChanged: () => void
  /** Custom trigger (e.g. a Home action); gets the opener and the count. */
  trigger?: (open: () => void, count: number) => ReactNode
}) {
  const t = useT("leave")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const supabase = useMemo(() => createClient(), [])
  // Notification links open the inbox on the request they're about:
  // /leave?inbox=leave&request=<id> (or inbox=attendance for a deletion).
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const linkedTab = searchParams.get("inbox")
  const linkedId = searchParams.get("request")
  const linked =
    !trigger && (linkedTab === "leave" || linkedTab === "attendance")
  const [open, setOpenState] = useState(false)
  const [tab, setTab] = useState<Tab>("leave")
  const setOpen = (next: boolean) => {
    setOpenState(next)
    // Closing drops the link's params, so a refresh doesn't reopen it.
    if (!next && linked) router.replace(pathname, { scroll: false })
  }
  useEffect(() => {
    if (!linked) return
    setTab(linkedTab as Tab)
    setOpenState(true)
  }, [linked, linkedTab])
  const [leaves, setLeaves] = useState<PendingLeave[] | null>(null)
  const [deletes, setDeletes] = useState<PendingDelete[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  // Row whose reject note is open, keyed "leave:<id>".
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [note, setNote] = useState("")

  const load = useCallback(async () => {
    const [leaveRes, deleteRes] = await Promise.all([
      supabase
        .from("leave_requests")
        .select(
          "id,leave_type,start_date,end_date,reason,profiles(full_name, avatar_url)",
        )
        .eq("status", "pending")
        .order("start_date", { ascending: true }),
      supabase
        .from("attendance_logs")
        .select(
          "id,date,clock_in,clock_out,notes,profiles(full_name, avatar_url)",
        )
        .ilike("notes", `%${ATTENDANCE_NOTE_TAGS.deleteRequested}%`)
        .order("date", { ascending: false }),
    ])
    const nextLeaves = (leaveRes.data as PendingLeave[] | null) ?? []
    const nextDeletes = (deleteRes.data as PendingDelete[] | null) ?? []
    setLeaves(nextLeaves)
    setDeletes(nextDeletes)
    return { leaves: nextLeaves, deletes: nextDeletes }
  }, [supabase])

  useEffect(() => {
    void load()
  }, [load])

  // Each time it opens: fresh lists (the page may have decided some), and
  // start on a tab that has something waiting. Later decisions keep the tab.
  useEffect(() => {
    if (!open) return
    void load().then((fresh) => {
      if (linked) return
      if (fresh.leaves.length === 0 && fresh.deletes.length > 0)
        setTab("attendance")
      else if (fresh.leaves.length > 0) setTab("leave")
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, load])

  const total = (leaves?.length ?? 0) + (deletes?.length ?? 0)

  const done = (key: string) => {
    setBusy(null)
    setRejecting((r) => (r === key ? null : r))
    onChanged()
  }

  const decideLeave = async (ids: number[], approve: boolean) => {
    const key = ids.length > 1 ? "all" : `leave:${ids[0]}`
    setBusy(key)
    // Only pending ones: another stakeholder may have decided meanwhile.
    const { data, error } = await supabase
      .from("leave_requests")
      .update(
        approve
          ? { status: "approved", review_note: null }
          : { status: "rejected", review_note: note.trim() || null },
      )
      .in("id", ids)
      .eq("status", "pending")
      .select("id")
    if (!error && !data?.length) {
      setLeaves((list) => list?.filter((l) => !ids.includes(l.id)) ?? null)
      toast.error(t("toastAlreadyDecided"))
      done(key)
      return
    }
    if (error) {
      setBusy(null)
      toast.error(
        error.message ||
          t(approve ? "toastApproveFailed" : "toastRejectFailed"),
      )
      return
    }
    setLeaves((list) => list?.filter((l) => !ids.includes(l.id)) ?? null)
    toast.success(t(approve ? "toastApproved" : "toastRejectedOne"))
    setNote("")
    done(key)
  }

  const decideDelete = async (log: PendingDelete, approve: boolean) => {
    const key = `attendance:${log.id}`
    setBusy(key)
    const { error } = approve
      ? await supabase.from("attendance_logs").delete().eq("id", log.id)
      : await supabase
          .from("attendance_logs")
          .update({
            notes: removeAttendanceNote(
              log.notes,
              ATTENDANCE_NOTE_TAGS.deleteRequested,
            ),
          })
          .eq("id", log.id)
    if (error) {
      setBusy(null)
      toast.error(
        error.message ||
          t(approve ? "toastDeleteLogFailed" : "toastDeclineFailed"),
      )
      return
    }
    setDeletes((list) => list?.filter((l) => l.id !== log.id) ?? null)
    toast.success(t(approve ? "toastLogDeleted" : "toastDeleteRequestDeclined"))
    done(key)
  }

  const loading = leaves === null || deletes === null

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true), total)
      ) : (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <RiInboxLine data-icon="inline-start" />
          {t("inbox")}
          <InboxCount count={total} />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("inbox")}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3">
            <SegmentedControl<Tab>
              fitContent
              value={tab}
              onChange={setTab}
              items={[
                {
                  value: "leave",
                  label: `${t("inboxLeave")} · ${leaves?.length ?? 0}`,
                },
                {
                  value: "attendance",
                  label: `${t("inboxAttendance")} · ${deletes?.length ?? 0}`,
                },
              ]}
            />
            {tab === "leave" && (leaves?.length ?? 0) > 1 && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy !== null}
                onClick={() =>
                  decideLeave(
                    leaves!.map((l) => l.id),
                    true,
                  )
                }
              >
                {busy === "all" ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <RiCheckLine data-icon="inline-start" />
                )}
                {t("inboxApproveAll")}
              </Button>
            )}
          </div>

          <div className="-mx-2 flex h-[min(24rem,calc(100svh-16rem))] flex-col overflow-y-auto">
            {loading ? (
              <div className="grid flex-1 place-items-center">
                <Spinner />
              </div>
            ) : (tab === "leave" ? leaves! : deletes!).length === 0 ? (
              <EmptyState
                className="flex-1 transition-none"
                icon={<RiCheckLine />}
                title={t("inboxEmpty")}
              />
            ) : (
              <AnimatePresence initial={false}>
                {tab === "leave"
                  ? leaves!.map((req) => {
                      const key = `leave:${req.id}`
                      const days = leaveDays(req.start_date, req.end_date)
                      return (
                        <InboxRow
                          key={key}
                          highlighted={linked && String(req.id) === linkedId}
                          person={req.profiles}
                          title={leaveTypeLabel(req.leave_type, t)}
                          meta={`${formatLeaveRange(req.start_date, req.end_date, dateLocale)} · ${t(daysKey(days), { n: days })}`}
                          detail={req.reason}
                          busy={busy === key}
                          disabled={busy !== null}
                          rejecting={rejecting === key}
                          note={note}
                          onNote={setNote}
                          onApprove={() => decideLeave([req.id], true)}
                          onReject={() => {
                            setNote("")
                            setRejecting(key)
                          }}
                          onCancelReject={() => setRejecting(null)}
                          onConfirmReject={() => decideLeave([req.id], false)}
                          approveLabel={t("approve")}
                          rejectLabel={t("reject")}
                          notePlaceholder={t("rejectPlaceholder")}
                          cancelLabel={tc("cancel")}
                        />
                      )
                    })
                  : deletes!.map((log) => {
                      const key = `attendance:${log.id}`
                      const day = format(new Date(log.date), "d MMM yyyy", {
                        locale: dateLocale,
                      })
                      const range = `${format(new Date(log.clock_in), "HH:mm")} – ${
                        log.clock_out
                          ? format(new Date(log.clock_out), "HH:mm")
                          : "…"
                      }`
                      return (
                        <InboxRow
                          key={key}
                          highlighted={linked && String(log.id) === linkedId}
                          person={log.profiles}
                          title={t("inboxDeleteAsked", { date: day })}
                          meta={range}
                          busy={busy === key}
                          disabled={busy !== null}
                          onApprove={() => decideDelete(log, true)}
                          onReject={() => decideDelete(log, false)}
                          approveLabel={t("deleteData")}
                          rejectLabel={t("declineRequest")}
                        />
                      )
                    })}
              </AnimatePresence>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** The waiting count as a small pill inside a button. */
export function InboxCount({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="bg-primary text-primary-foreground -mr-1 ml-0.5 grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums">
      {count}
    </span>
  )
}

function InboxRow({
  highlighted = false,
  person,
  title,
  meta,
  detail,
  busy,
  disabled,
  rejecting = false,
  note = "",
  onNote,
  onApprove,
  onReject,
  onCancelReject,
  onConfirmReject,
  approveLabel,
  rejectLabel,
  notePlaceholder,
  cancelLabel,
}: {
  /** The request a notification linked to: marked and scrolled to. */
  highlighted?: boolean
  person: Person
  title: string
  meta: string
  detail?: string | null
  busy: boolean
  disabled: boolean
  rejecting?: boolean
  note?: string
  onNote?: (v: string) => void
  onApprove: () => void
  onReject: () => void
  onCancelReject?: () => void
  onConfirmReject?: () => void
  approveLabel: string
  rejectLabel: string
  notePlaceholder?: string
  cancelLabel?: string
}) {
  return (
    <m.div
      ref={(el) => {
        if (el && highlighted) el.scrollIntoView({ block: "nearest" })
      }}
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={ROW_EXIT}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden"
    >
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-(--row-hover)",
          highlighted && "bg-primary/8 ring-primary/30 ring-1 ring-inset",
        )}
      >
        <Avatar className="size-8">
          {person?.avatar_url && <AvatarImage src={person.avatar_url} />}
          <AvatarFallback className="text-[11px]">
            {initials(person?.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 text-[13px]">
          <p className="truncate">
            <span className="font-medium">{person?.full_name ?? "—"}</span>
            <span className="text-muted-foreground"> · {title}</span>
          </p>
          <p className="text-muted-foreground tabular-nums">{meta}</p>
          {detail && (
            <p className="text-tertiary-foreground mt-0.5 line-clamp-2">
              {detail}
            </p>
          )}
        </div>
        {!rejecting && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={rejectLabel}
              title={rejectLabel}
              disabled={disabled}
              onClick={onReject}
            >
              <RiCloseLine />
            </Button>
            <Button
              size="icon-sm"
              variant="secondary"
              aria-label={approveLabel}
              title={approveLabel}
              disabled={disabled}
              onClick={onApprove}
              className={cn(!busy && "text-green-11")}
            >
              {busy ? <Spinner /> : <RiCheckLine />}
            </Button>
          </div>
        )}
      </div>
      <AnimatePresence initial={false}>
        {rejecting && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={ROW_EXIT}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 px-2 pt-1 pb-3 pl-13">
              <Textarea
                autoFocus
                rows={2}
                placeholder={notePlaceholder}
                value={note}
                onChange={(e) => onNote?.(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={onCancelReject}>
                  <RiCloseLine data-icon="inline-start" />
                  {cancelLabel}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={disabled}
                  onClick={onConfirmReject}
                >
                  {busy && <Spinner data-icon="inline-start" />}
                  {rejectLabel}
                </Button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  )
}
