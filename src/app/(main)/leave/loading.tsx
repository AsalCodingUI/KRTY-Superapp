"use client"

export default function LeaveLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-7 w-40 bg-border dark:bg-hover rounded animate-pulse"></div>
                <div className="h-9 w-32 bg-border dark:bg-hover rounded animate-pulse"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border border-border p-6 space-y-3">
                        <div className="h-4 w-24 bg-border dark:bg-hover rounded animate-pulse"></div>
                        <div className="h-8 w-16 bg-border dark:bg-hover rounded animate-pulse"></div>
                    </div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="rounded-lg border border-border overflow-hidden">
                {/* Table Header */}
                <div className="flex gap-4 p-4 border-b border-border bg-muted dark:bg-surface/50">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-4 w-20 bg-border dark:bg-hover rounded animate-pulse"></div>
                    ))}
                </div>
                {/* Table Rows */}
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4 p-4 border-b border-border last:border-0">
                        {[1, 2, 3, 4, 5].map((j) => (
                            <div key={j} className="h-4 w-20 bg-border dark:bg-hover rounded animate-pulse"></div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
