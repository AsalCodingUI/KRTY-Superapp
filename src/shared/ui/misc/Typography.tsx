import { cx } from "@/shared/lib/utils"

/**
 * Text component for body copy.
 */
export const Text = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cx("text-content-subtle text-sm", className)} {...props} />
)

export const Title = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cx("text-content text-lg font-medium", className)}
    {...props}
  />
)

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

export const Heading = ({ className, level = 2, ...props }: HeadingProps) => (
  <h2
    className={cx("text-content text-base font-semibold", className)}
    {...props}
  />
)

export const StatusText = Text
