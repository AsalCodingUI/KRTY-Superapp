import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

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
            <dt className="text-foreground sm:text-sm">{title}</dt>
            <Badge variant="secondary">{change}</Badge>
          </div>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-foreground text-xl font-semibold">
              {value}
            </span>
            <span className="text-muted-foreground/70 text-sm">
              {valueDescription}
            </span>
          </dd>
          <ul role="list" className="mt-4 space-y-5">
            {data.map((item) => (
              <li key={item.title}>
                <p className="flex justify-between text-sm font-medium">
                  <span className="text-foreground font-medium">
                    {item.title}
                  </span>
                  <span className="text-foreground font-medium">
                    {item.current}
                    <span className="text-muted-foreground/70 font-normal">
                      /{item.allowed}
                      {item.unit}
                    </span>
                  </span>
                </p>
                <Progress value={item.percentage} className="mt-2 h-1.5" />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-muted-foreground/70 mt-6 text-xs">
            {ctaDescription}{" "}
            <a href={ctaLink} className="text-primary hover:text-primary/90">
              {ctaText}
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
