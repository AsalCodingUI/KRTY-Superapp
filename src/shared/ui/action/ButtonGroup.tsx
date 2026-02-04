import { cx } from "@/shared/lib/utils"
import React from "react"
import { type ButtonProps } from "./Button"

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactElement<ButtonProps>[] | React.ReactElement<ButtonProps>
  size?: ButtonProps["size"]
  variant?: ButtonProps["variant"]
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    { className, children, size = "default", variant = "secondary", ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cx(
          "inline-flex -space-x-px rounded-lg shadow-sm",
          className,
        )}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return null

          const isFirst = index === 0
          const isLast = index === React.Children.count(children) - 1

          return React.cloneElement(child, {
            size,
            variant,
            className: cx(
              child.props.className,
              "rounded-none shadow-none focus:z-10",
              isFirst && "rounded-l-lg",
              isLast && "rounded-r-lg",
              // Ensure borders overlap correctly
              !isFirst && "border-l-0",
            ),
          } as ButtonProps)
        })}
      </div>
    )
  },
)

ButtonGroup.displayName = "ButtonGroup"

export { ButtonGroup }
