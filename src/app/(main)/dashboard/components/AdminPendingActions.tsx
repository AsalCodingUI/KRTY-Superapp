"use client"

import { EmptyState } from "@/components/empty-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RiArrowRightLine, RiFileList3Line } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import Link from "next/link"

interface PendingReview {
  employee_id: string
  employee_name: string | null
  employee_avatar: string | null
  employee_job_title: string | null
  cycle_id: string
  cycle_name: string
  reviewers_pending: number
  total_reviewers: number
}

interface PendingLeave {
  id: string
  user_id: string
  user_name: string | null
  user_avatar: string | null
  leave_type: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string | null
  created_at: string
}

interface AdminPendingActionsProps {
  pendingReviews: PendingReview[]
  pendingLeaveApprovals: PendingLeave[]
}

export function AdminPendingActions({
  pendingReviews,
  pendingLeaveApprovals,
}: AdminPendingActionsProps) {
  return (
    <div className="space-y-4">
      <Card className="gap-0 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-muted-foreground text-sm font-medium">
            Pending Reviews
          </p>
          <span className="text-muted-foreground/70 text-xs tabular-nums">
            {pendingReviews.length} items
          </span>
        </div>

        {pendingReviews.length === 0 ? (
          <EmptyState
            icon={<RiFileList3Line className="size-5" />}
            title="No pending reviews"
            description="All performance reviews are completed."
            placement="inner"
            className="min-h-[160px] px-0 py-6"
          />
        ) : (
          <>
            <div className="divide-border divide-y">
              {pendingReviews.slice(0, 5).map((review) => (
                <Link
                  key={`${review.employee_id}-${review.cycle_id}`}
                  href={`/performance?tab=360review`}
                >
                  <div className="hover:bg-muted flex items-center justify-between px-3 py-2 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-7">
                        <AvatarImage
                          src={review.employee_avatar || undefined}
                        />
                        <AvatarFallback className="text-[10px]">
                          {review.employee_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-foreground text-sm font-medium">
                          {review.employee_name}
                        </h4>
                        <p className="text-muted-foreground text-xs">
                          {review.employee_job_title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{review.cycle_name}</Badge>
                      <RiArrowRightLine className="text-muted-foreground size-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {pendingReviews.length > 5 && (
              <div className="mt-3">
                <Link href="/performance?tab=360review">
                  <Button variant="outline" className="w-full">
                    View All {pendingReviews.length} Pending Reviews
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </Card>

      <Card className="gap-0 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-muted-foreground text-sm font-medium">
            Leave Approvals
          </p>
          <span className="text-muted-foreground/70 text-xs tabular-nums">
            {pendingLeaveApprovals.length} items
          </span>
        </div>

        {pendingLeaveApprovals.length === 0 ? (
          <EmptyState
            icon={<RiFileList3Line className="size-5" />}
            title="No leave approvals pending"
            description="There are no leave requests waiting for review."
            placement="inner"
            className="min-h-[160px] px-0 py-6"
          />
        ) : (
          <>
            <div className="divide-border divide-y">
              {pendingLeaveApprovals.slice(0, 5).map((leave) => {
                const daysAgo = Math.floor(
                  (new Date().getTime() -
                    new Date(leave.created_at).getTime()) /
                    (1000 * 60 * 60 * 24),
                )

                return (
                  <Link key={leave.id} href="/leave">
                    <div className="hover:bg-muted px-3 py-2 transition-colors">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-7">
                            <AvatarImage src={leave.user_avatar || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {leave.user_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-foreground text-sm font-medium">
                              {leave.user_name}
                            </h4>
                            <p className="text-muted-foreground text-xs">
                              {leave.leave_type} • {leave.days_requested} days
                            </p>
                          </div>
                        </div>
                        {daysAgo <= 2 && (
                          <Badge variant="destructive">New</Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground ml-11 text-xs">
                        {format(new Date(leave.start_date), "MMM d")} -{" "}
                        {format(new Date(leave.end_date), "MMM d, yyyy")}
                      </div>
                      {leave.reason && (
                        <div className="text-muted-foreground mt-1 ml-11 line-clamp-1 text-xs">
                          {leave.reason}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>

            {pendingLeaveApprovals.length > 5 && (
              <div className="mt-3">
                <Link href="/leave">
                  <Button variant="outline" className="w-full">
                    View All {pendingLeaveApprovals.length} Requests
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
