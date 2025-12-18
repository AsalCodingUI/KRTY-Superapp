"use client"

export default function DashboardLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-7 w-48 bg-border dark:bg-hover rounded animate-pulse"></div>
                <div className="h-9 w-32 bg-border dark:bg-hover rounded animate-pulse"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg border border-border p-6 space-y-3">
                        <div className="h-4 w-24 bg-border dark:bg-hover rounded animate-pulse"></div>
                        <div className="h-8 w-16 bg-border dark:bg-hover rounded animate-pulse"></div>
                    </div>
                ))}
            </div>

            {/* Chart Skeleton */}
            <div className="rounded-lg border border-border p-6">
                <div className="h-5 w-32 bg-border dark:bg-hover rounded animate-pulse mb-4"></div>
                <div className="h-64 bg-border dark:bg-hover rounded animate-pulse"></div>
            </div>
        </div>
    )
}
