"use client"

import { Card } from "@/shared/ui"
import { isWithinInterval, parseISO, startOfDay } from "date-fns"
import { LeaveRequestWithProfile } from "./AdminColumns"

export function LeaveAdminStats({
  requests,
}: {
  requests: LeaveRequestWithProfile[]
}) {
  const today = startOfDay(new Date())

  // 1. Hitung Pending
  const pendingCount = requests.filter((r) => r.status === "pending").length

  // 2. Hitung On Leave Today
  const onLeaveToday = requests.filter((r) => {
    if (r.status !== "approved") return false
    const start = parseISO(r.start_date)
    const end = parseISO(r.end_date)
    return isWithinInterval(today, { start, end })
  })

  // 3. Approved Month (Total Approved)
  const approvedMonth = requests.filter((r) => r.status === "approved").length

  const data = [
    {
      name: "On Leave Today",
      stat: onLeaveToday.length.toString(),
    },
    {
      name: "Pending Requests",
      stat: pendingCount.toString(),
    },
    {
      name: "Total Approved",
      stat: approvedMonth.toString(),
    },
  ]

  return (
    <>
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <Card key={item.name}>
            <dt className="text-label-md text-foreground-secondary dark:text-foreground-secondary">
              {item.name}
            </dt>
            <dd className="mt-2 flex items-baseline space-x-2.5">
              <span className="text-display-xxs text-foreground-primary dark:text-foreground-primary">
                {item.stat}
              </span>
            </dd>
          </Card>
        ))}
      </dl>
    </>
  )
}
