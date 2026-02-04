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
            <dt className="text-content sm:text-label-md dark:text-content">
              {title}
            </dt>
            <Badge variant="zinc">{change}</Badge>
          </div>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-heading-lg text-content dark:text-content">
              {value}
            </span>
            <span className="text-body-sm text-content-muted">
              {valueDescription}
            </span>
          </dd>
          <ul role="list" className="mt-4 space-y-5">
            {data.map((item) => (
              <li key={item.title}>
                <p className="text-label-md flex justify-between">
                  <span className="text-content dark:text-content font-medium">
                    {item.title}
                  </span>
                  <span className="text-content dark:text-content font-medium">
                    {item.current}
                    <span className="text-content-muted font-normal">
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
          <p className="text-body-xs text-content-muted mt-6">
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
