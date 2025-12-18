import { Badge } from "@/components/Badge"
import { cx } from "@/lib/utils"

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
                        <h3 className="font-semibold text-content sm:text-sm dark:text-content">
                            {title}
                        </h3>
                        <Badge variant="zinc">{change}</Badge>
                    </div>
                    <p className="mt-2 flex items-baseline gap-2">
                        <span className="text-xl text-content dark:text-content">
                            {value}
                        </span>
                        <span className="text-sm text-content-subtle">{valueDescription}</span>
                    </p>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-content dark:text-content">
                            {subtitle}
                        </p>
                        <div className="mt-2 flex items-center gap-0.5">
                            {data.map((item) => (
                                <div
                                    key={item.title}
                                    className={cx(item.color, `h-1.5 rounded-full`)}
                                    style={{ width: `${item.percentage}%` }}
                                />
                            ))}
                        </div>
                    </div>
                    <ul role="list" className="mt-5 space-y-2">
                        {data.map((item) => (
                            <li key={item.title} className="flex items-center gap-2 text-xs">
                                <span
                                    className={cx(item.color, "size-2.5 rounded-sm")}
                                    aria-hidden="true"
                                />
                                <span className="text-content dark:text-content">
                                    {item.title}
                                </span>
                                <span className="text-content-subtle dark:text-content-placeholder">
                                    ({item.value} / {item.percentage}%)
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="mt-6 text-xs text-content-subtle">
                    {ctaDescription}{" "}
                    <a href={ctaLink} className="text-primary hover:text-primary/80">
                        {ctaText}
                    </a>
                </p>
            </div>
        </>
    )
}
