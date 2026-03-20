import { Badge } from "@/shared/ui"

interface QuarterBadgeProps {
  quarter: string
}

export function QuarterBadge({ quarter }: QuarterBadgeProps) {
  return (
    <Badge size="sm" variant="info">
      {quarter}
    </Badge>
  )
}
