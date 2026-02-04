"use client"

import { cx, focusRing } from "@/shared/lib/utils"
import { motion } from "framer-motion"
import { useId } from "react"

export interface SegmentedControlItem<T extends string> {
    value: T
    label: React.ReactNode
    icon?: React.ElementType
}

interface SegmentedControlProps<T extends string> {
    items: SegmentedControlItem<T>[]
    value: T
    onChange: (value: T) => void
    disabled?: boolean
    className?: string
}

export function SegmentedControl<T extends string>({
    items,
    value,
    onChange,
    disabled,
    className,
}: SegmentedControlProps<T>) {
    const id = useId()

    return (
        <div
            className={cx(
                "bg-surface-neutral-secondary flex p-[2px] rounded-[10px] w-full",
                disabled && "opacity-50 pointer-events-none",
                className
            )}
        >
            {items.map((item) => {
                const isActive = item.value === value
                return (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => onChange(item.value)}
                        className={cx(
                            "relative flex flex-1 items-center justify-center gap-0.5 rounded-[8px] px-2 py-1 text-[13px] font-medium transition-colors duration-200 focus:outline-none",
                            isActive ? "bg-surface-neutral-primary text-content shadow-neutral" : "text-muted hover:text-content",
                            focusRing
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId={`segment-active-${id}`}
                                className="absolute inset-0 rounded-[8px] bg-surface-neutral-primary shadow-neutral"
                                initial={false}
                                transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30,
                                }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-0.5">
                            {item.icon && <item.icon className="size-[14px] shrink-0" aria-hidden="true" />}
                            {item.label}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
