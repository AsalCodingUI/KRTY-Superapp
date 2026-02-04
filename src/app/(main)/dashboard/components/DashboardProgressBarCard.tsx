import { Badge, ProgressBar } from "@/components/ui"

export type KpiEntry = {
  title: string
  percentage: number
  current: number
  allowed: number
  unit?: string
}

export type CardProps = {
  title: string
  change: string
  value: string
  valueDescription: string
  ctaDescription: string
  ctaText: string
  ctaLink: string
  data: KpiEntry[]
}

export function ProgressBarCard({
  title,
  change,
  value,
  valueDescription,
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
            <dt className="font-semibold text-content sm:text-sm dark:text-content">
              {title}
            </dt>
            <Badge variant="zinc">{change}</Badge>
          </div>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-xl text-content dark:text-content">
              {value}
            </span>
            <span className="text-sm text-content-muted">{valueDescription}</span>
          </dd>
          <ul role="list" className="mt-4 space-y-5">
            {data.map((item) => (
              <li key={item.title}>
                <p className="flex justify-between text-sm">
                  <span className="font-medium text-content dark:text-content">
                    {item.title}
                  </span>
                  <span className="font-medium text-content dark:text-content">
                    {item.current}
                    <span className="font-normal text-content-muted">
                      /{item.allowed}
                      {item.unit}
                    </span>
                  </span>
                </p>
                <ProgressBar
                  value={item.percentage}
                  className="mt-2 [&>*]:h-1.5"
                />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mt-6 text-xs text-content-muted">
            {ctaDescription}{" "}
            <a href={ctaLink} className="text-primary hover:text-primary-hover">
              {ctaText}
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
