import { Badge } from "@/components/ui/badge"

interface QuarterBadgeProps {
  quarter: string
}

export function QuarterBadge({ quarter }: QuarterBadgeProps) {
  return (
    <Badge variant="secondary">
      {quarter}
    </Badge>
  )
}
