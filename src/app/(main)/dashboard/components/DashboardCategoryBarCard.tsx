import { Badge } from "@/components/ui"
import { cx } from "@/shared/lib/utils"
import React from "react"

export type KpiEntryExtended = {
  title: string
  percentage: number
  value: string
  color: string
}

export type CardProps = {
  title: string
  change: string
  value: string
  valueDescription: string
  subtitle: string
  ctaDescription: string
  ctaText: string
  ctaLink: string
  data: KpiEntryExtended[]
}

export function CategoryBarCard({
  title,
  change,
  value,
  valueDescription,
  subtitle,
  ctaDescription,
  ctaText,
  ctaLink,
  data,
}: CardProps) {
  return (
    <>
      <div className="flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-content dark:text-content sm:text-label-md">
              {title}
            </h3>
            <Badge variant="zinc">{change}</Badge>
          </div>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-content dark:text-content text-heading-lg">
              {value}
            </span>
            <span className="text-content-muted text-body-sm">
              {valueDescription}
            </span>
          </p>
          <div className="mt-4">
            <p className="text-content dark:text-content text-label-md">
              {subtitle}
            </p>
            <div className="mt-2 flex items-center gap-0.5">
              {data.map((item) => (
                <div
                  key={item.title}
                  className={cx(
                    item.color,
                    `h-1.5 w-[var(--width)] rounded-full`,
                  )}
                  style={
                    { "--width": `${item.percentage}%` } as React.CSSProperties
                  }
                />
              ))}
            </div>
          </div>
          <ul role="list" className="mt-5 space-y-2">
            {data.map((item) => (
              <li
                key={item.title}
                className="text-body-xs flex items-center gap-2"
              >
                <span
                  className={cx(item.color, "size-2.5 rounded-sm")}
                  aria-hidden="true"
                />
                <span className="text-content dark:text-content">
                  {item.title}
                </span>
                <span className="text-content-muted dark:text-foreground-default-disable">
                  ({item.value} / {item.percentage}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-content-muted text-body-xs mt-6">
          {ctaDescription}{" "}
          <a href={ctaLink} className="text-primary hover:text-primary-hover">
            {ctaText}
          </a>
        </p>
      </div>
    </>
  )
}
