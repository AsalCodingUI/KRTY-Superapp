"use client"

export default function PerformanceLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div>
                <div className="h-7 w-64 bg-border dark:bg-hover rounded animate-pulse"></div>
            </div>

            {/* Tab Navigation Skeleton */}
            <div className="flex gap-2 border-b border-border">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-24 bg-border dark:bg-hover rounded-t animate-pulse"></div>
                ))}
            </div>

            {/* Content Skeleton */}
            <div className="space-y-4">
                <div className="h-32 bg-border dark:bg-hover rounded animate-pulse"></div>
                <div className="h-48 bg-border dark:bg-hover rounded animate-pulse"></div>
                <div className="h-64 bg-border dark:bg-hover rounded animate-pulse"></div>
            </div>
        </div>
    )
}
