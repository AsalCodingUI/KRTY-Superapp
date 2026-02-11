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
            <dt className="text-foreground-primary sm:text-label-md dark:text-foreground-primary">
              {title}
            </dt>
            <Badge variant="zinc">{change}</Badge>
          </div>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-heading-lg text-foreground-primary dark:text-foreground-primary">
              {value}
            </span>
            <span className="text-body-sm text-foreground-tertiary">
              {valueDescription}
            </span>
          </dd>
          <ul role="list" className="mt-4 space-y-5">
            {data.map((item) => (
              <li key={item.title}>
                <p className="text-label-md flex justify-between">
                  <span className="text-foreground-primary dark:text-foreground-primary font-medium">
                    {item.title}
                  </span>
                  <span className="text-foreground-primary dark:text-foreground-primary font-medium">
                    {item.current}
                    <span className="text-foreground-tertiary font-normal">
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
          <p className="text-body-xs text-foreground-tertiary mt-6">
            {ctaDescription}{" "}
            <a href={ctaLink} className="text-foreground-brand-primary hover:text-foreground-brand-primary-hover">
              {ctaText}
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
