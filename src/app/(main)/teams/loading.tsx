"use client"

export default function TeamsLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-7 w-32 bg-border dark:bg-hover rounded animate-pulse"></div>
                <div className="h-9 w-28 bg-border dark:bg-hover rounded animate-pulse"></div>
            </div>

            {/* Team Cards Grid Skeleton */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="rounded-lg border border-border p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="h-5 w-32 bg-border dark:bg-hover rounded animate-pulse"></div>
                            <div className="h-6 w-16 bg-border dark:bg-hover rounded-full animate-pulse"></div>
                        </div>
                        <div className="h-4 w-full bg-border dark:bg-hover rounded animate-pulse"></div>
                        <div className="flex gap-2">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="h-8 w-8 bg-border dark:bg-hover rounded-full animate-pulse"></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
