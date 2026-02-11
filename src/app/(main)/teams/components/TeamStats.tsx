"use client"

import { Card } from "@/shared/ui"
import { CategoryBar } from "@/shared/ui"
import { Database } from "@/shared/types/database.types"
import { cx } from "@/shared/lib/utils"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface TeamStatsProps {
  data: Profile[]
}

export function TeamStats({ data }: TeamStatsProps) {
  const totalMembers = data.length

  // TODO: Move filtering logic to server/parent for better scalability
  const totalDesigners = data.filter((p) => p.job_title === "Designer").length
  const totalDevelopers = data.filter(
    (p) => p.job_title === "Web Developer",
  ).length
  const totalPMs = data.filter((p) => p.job_title === "Project Manager").length
  const totalAdmins = data.filter((p) => p.job_title === "Admin").length

  const calculatePercent = (value: number) => {
    return totalMembers > 0 ? Math.round((value / totalMembers) * 100) : 0
  }

  // UPDATED: Menggunakan semantic chart colors
  const statsData = [
    {
      name: "Designers",
      count: totalDesigners,
      percentage: calculatePercent(totalDesigners),
      color: "chart-1", // Referensi ke config baru
      bgClass: "bg-chart-1",
    },
    {
      name: "Developers",
      count: totalDevelopers,
      percentage: calculatePercent(totalDevelopers),
      color: "chart-2",
      bgClass: "bg-chart-2",
    },
    {
      name: "Project Managers",
      count: totalPMs,
      percentage: calculatePercent(totalPMs),
      color: "chart-3",
      bgClass: "bg-chart-3",
    },
    {
      name: "Admin",
      count: totalAdmins,
      percentage: calculatePercent(totalAdmins),
      color: "chart-4",
      bgClass: "bg-chart-4",
    },
  ].filter((item) => item.count > 0)

  const barValues = statsData.map((item) => item.count)
  // Pass class names directly or handle in CategoryBar
  const barColors = statsData.map((item) => item.color)

  return (
    <div className="max-w-full">
      <dl className="grid grid-cols-1">
        <Card>
          <dt className="text-label-md text-foreground-secondary">
            Total Team Members
          </dt>
          <dd className="text-display-xxs text-foreground-primary mt-1">{totalMembers}</dd>

          <CategoryBar
            values={barValues}
            colors={barColors}
            className="mt-6"
            showLabels={false}
          />

          <ul
            role="list"
            className="text-body-sm mt-4 flex flex-wrap gap-x-8 gap-y-4"
          >
            {statsData.map((item) => (
              <li key={item.name} className="flex items-center gap-3">
                <span
                  className={cx("size-2.5 shrink-0 rounded-sm", item.bgClass)}
                  aria-hidden="true"
                />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-foreground-primary font-semibold">
                    {item.percentage}%
                  </span>
                  <span className="text-foreground-secondary">
                    {item.name} ({item.count})
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </dl>
    </div>
  )
}
