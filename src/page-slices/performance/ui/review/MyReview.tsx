"use client"

import {
  getMyReview,
  getMyReviewOf,
  getReviewStatusFor,
  type MyReviewData,
  type MyReviewOf,
  type ReviewSummary,
} from "@/app/(main)/performance/actions/review-actions"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DialogFooter } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { ReviewFormFields, useReviewForm } from "./ReviewForm"
import { useT } from "@/shared/i18n/client"
import { useRef, useState } from "react"
import { isQuarter, periodLabel } from "../kpi/period"
import { ListColumns, PersonCell } from "../list"
import { useCycleLine } from "./cycle-status"
import { ReviewResult } from "./ReviewResult"

type Person = MyReviewData["targets"][number]

/** Shared column template so the header and rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_12rem_6rem]"

/** Teammates to review while the cycle is open, the ones left first. */
function PeerList({
  targets,
  onReview,
}: {
  targets: MyReviewData["targets"]
  onReview: (person: Person, edit?: boolean) => void
}) {
  const t = useT("performance")
  const sorted = [
    ...targets.filter((p) => !p.done && !p.processed),
    ...targets.filter((p) => p.done || p.processed),
  ]
  return (
    <GroupedList hover={false}>
      <ListColumns grid={ROW_GRID}>
        <span>{t("peer")}</span>
        <span className="hidden md:block">{t("jobTitle")}</span>
        <span className="text-right">{t("status")}</span>
      </ListColumns>
      {sorted.map((p) => (
        <ListRow key={p.id} className={cn(ROW_GRID, "min-h-14")}>
          <PersonCell name={p.full_name} avatarUrl={p.avatar_url} />
          <div className="hidden min-w-0 md:block">
            {p.job_title && (
              <Badge variant="secondary" className="max-w-full">
                <span className="truncate">{p.job_title}</span>
              </Badge>
            )}
          </div>
          <div className="flex justify-end">
            {p.editable ? (
              <span className="flex items-center gap-2">
                <Badge variant="success">{t("sent")}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReview(p, true)}
                >
                  {t("editReviewAction")}
                </Button>
              </span>
            ) : p.done ? (
              <Badge variant="success">{t("sent")}</Badge>
            ) : p.processed ? (
              <Badge variant="secondary">{t("reviewProcessedBadge")}</Badge>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => onReview(p)}>
                {t("reviewAction")}
              </Button>
            )}
          </div>
        </ListRow>
      ))}
    </GroupedList>
  )
}

/**
 * One teammate's review inside the peers modal: the criteria and notes
 * scroll, the actions stay at the bottom. Keyed by the teammate so each
 * review starts empty; when changing a sent one (`edit`), it loads that
 * review first.
 */
function ReviewStep({
  cycleId,
  person,
  edit = false,
  dirty,
  onBack,
  onDone,
}: {
  cycleId: string
  person: Person
  edit?: boolean
  dirty: React.RefObject<boolean>
  onBack: () => void
  onDone: () => void
}) {
  const { data: initial, isLoading } = useQuery({
    queryKey: ["my-review-of", cycleId, person.id],
    queryFn: () => getMyReviewOf(cycleId, person.id),
    enabled: edit,
    staleTime: 0,
  })
  if (edit && (isLoading || !initial)) {
    return (
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{person.full_name}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center py-16">
          <Spinner className="size-6" />
        </div>
      </DialogContent>
    )
  }
  return (
    <ReviewStepForm
      cycleId={cycleId}
      person={person}
      initial={edit ? (initial ?? undefined) : undefined}
      dirty={dirty}
      onBack={onBack}
      onDone={onDone}
    />
  )
}

function ReviewStepForm({
  cycleId,
  person,
  initial,
  dirty,
  onBack,
  onDone,
}: {
  cycleId: string
  person: Person
  initial?: MyReviewOf
  dirty: React.RefObject<boolean>
  onBack: () => void
  onDone: () => void
}) {
  const t = useT("performance")
  const tc = useT("common")
  const form = useReviewForm(cycleId, person.id, initial)
  dirty.current = form.touched
  return (
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>
          {t(initial ? "editReviewTitle" : "reviewPeerTitle", {
            name: person.full_name ?? "",
          })}
        </DialogTitle>
        <DialogDescription>
          {[person.job_title, t(initial ? "editReviewOnce" : "anonymousNote")]
            .filter(Boolean)
            .join(" · ")}
        </DialogDescription>
      </DialogHeader>
      <ReviewFormFields form={form} />
      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" onClick={onBack}>
          {tc("back")}
        </Button>
        <div className="flex items-center gap-3">
          {!form.canSubmit && (
            <span className="text-muted-foreground text-xs">
              {t("completeAllFields")}
            </span>
          )}
          <Button
            disabled={form.loading || !form.canSubmit}
            onClick={async () => {
              if (await form.submit()) onDone()
            }}
          >
            {form.loading && <Spinner data-icon="inline-start" />}
            {t(initial ? "saveReviewEdit" : "submitReview")}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  )
}

/** Teammates to review, then the review itself, in one modal. */
function PeersDialog({
  open,
  onOpenChange,
  period,
  cycleId,
  targets,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  period: string
  cycleId: string
  targets: Person[]
}) {
  const t = useT("performance")
  const queryClient = useQueryClient()
  const [reviewing, setReviewing] = useState<Person | null>(null)
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState<null | "back" | "close">(null)
  const dirty = useRef(false)

  // Back asks only when something was filled in; clicking outside (or Esc)
  // during a review always asks, so a stray click never drops it.
  const leave = (to: "back" | "close", confirmed = false) => {
    if (reviewing && !confirmed && (to === "close" || dirty.current))
      return setConfirm(to)
    dirty.current = false
    // Closing keeps the review on screen while the modal animates out;
    // it's cleared once closed (swapping it mid-exit reopens the modal).
    if (to === "close") onOpenChange(false)
    else setReviewing(null)
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => (o ? onOpenChange(o) : leave("close"))}
        onOpenChangeComplete={(o) => !o && setReviewing(null)}
      >
        {reviewing ? (
          <ReviewStep
            key={reviewing.id}
            cycleId={cycleId}
            person={reviewing}
            edit={editing}
            dirty={dirty}
            onBack={() => leave("back")}
            onDone={() => {
              dirty.current = false
              setReviewing(null)
              queryClient.invalidateQueries({ queryKey: ["my-review", period] })
            }}
          />
        ) : (
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("reviewTeammates")}</DialogTitle>
              <DialogDescription>{t("anonymousNote")}</DialogDescription>
            </DialogHeader>
            <PeerList
              targets={targets}
              onReview={(person, edit = false) => {
                setEditing(edit)
                setReviewing(person)
              }}
            />
          </DialogContent>
        )}
      </Dialog>
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("leaveReviewTitle")}
        description={t("unsavedEntries")}
        confirmText={t("leave")}
        cancelText={t("keepFilling")}
        variant="destructive"
        onConfirm={() => {
          const to = confirm
          setConfirm(null)
          leave(to ?? "back", true)
        }}
      />
    </>
  )
}

/** The written 360 result (score, criteria, feedback) in a wide modal. */
function ResultDialog({
  open,
  onOpenChange,
  period,
  summary,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  period: string
  summary: ReviewSummary | null
}) {
  const t = useT("performance")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {t("score360")} · {periodLabel(period, t)}
          </DialogTitle>
        </DialogHeader>
        {summary && <ReviewResult summary={summary} />}
      </DialogContent>
    </Dialog>
  )
}

/** The foot of the 360 card: one status line, then the actions. */
function Footer({
  lines,
  children,
}: {
  lines: (string | null)[]
  children?: React.ReactNode
}) {
  const shown = lines.filter(Boolean)
  if (shown.length === 0 && !children) return null
  return (
    <div className="border-border mt-auto flex flex-col gap-2.5 border-t pt-3">
      {shown.length > 0 && (
        <p className="text-muted-foreground text-xs">{shown.join(" · ")}</p>
      )}
      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  )
}

/**
 * The member's own 360, at the foot of the 360 card, by the cycle's dates:
 * scheduled → when it opens; running → review teammates (in a modal) and
 * when it closes; ended or closed → waiting for the result; and once there
 * is one, the full result in a modal.
 */
export function My360Actions({ period }: { period: string }) {
  const t = useT("performance")
  const cycleLine = useCycleLine()
  const quarter = isQuarter(period)
  const [open, setOpen] = useState<"result" | "peers" | null>(null)
  const { data } = useQuery({
    queryKey: ["my-review", period],
    queryFn: () => getMyReview(period),
    enabled: quarter,
  })
  if (!quarter || !data) return null

  const { cycle, targets, summary } = data
  const todo = targets.filter((p) => !p.done && !p.processed).length
  const showPeers = Boolean(cycle?.isOpen && targets.length > 0)

  return (
    <Footer lines={[cycleLine(cycle, Boolean(summary))]}>
      {showPeers && (
        <Button
          size="sm"
          variant={todo > 0 ? "default" : "secondary"}
          onClick={() => setOpen("peers")}
        >
          {todo > 0
            ? t("my360ReviewCount", { n: todo })
            : t("my360ReviewAction")}
        </Button>
      )}
      {summary && (
        <Button size="sm" variant="secondary" onClick={() => setOpen("result")}>
          {t("my360SeeResult")}
        </Button>
      )}

      <ResultDialog
        open={open === "result"}
        onOpenChange={(o) => !o && setOpen(null)}
        period={period}
        summary={summary}
      />
      {cycle && (
        <PeersDialog
          open={open === "peers"}
          onOpenChange={(o) => setOpen(o ? "peers" : null)}
          period={period}
          cycleId={cycle.id}
          targets={targets}
        />
      )}
    </Footer>
  )
}

/**
 * Someone else's 360 at the foot of their 360 card, for a stakeholder:
 * the cycle's state, how many of their reviewers are done, and the result
 * (same modal). No reviewing from here.
 */
export function Their360Actions({
  userId,
  period,
}: {
  userId: string
  period: string
}) {
  const t = useT("performance")
  const cycleLine = useCycleLine()
  const quarter = isQuarter(period)
  const [open, setOpen] = useState(false)
  const { data } = useQuery({
    queryKey: ["review-status-for", userId, period],
    queryFn: () => getReviewStatusFor(userId, period),
    enabled: quarter,
  })
  if (!quarter || !data) return null

  const { cycle, summary, reviewersDone, reviewersTotal } = data
  return (
    <Footer
      lines={[
        cycleLine(cycle, Boolean(summary)),
        cycle && reviewersTotal > 0
          ? t("reviewerProgress", {
              done: reviewersDone,
              total: reviewersTotal,
            })
          : null,
      ]}
    >
      {summary && (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          {t("my360SeeResult")}
        </Button>
      )}
      <ResultDialog
        open={open}
        onOpenChange={setOpen}
        period={period}
        summary={summary}
      />
    </Footer>
  )
}
