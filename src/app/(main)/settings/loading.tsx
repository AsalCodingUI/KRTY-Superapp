"use client"

export default function SettingsLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div>
                <div className="h-7 w-32 bg-border dark:bg-hover rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-border dark:bg-hover rounded animate-pulse mt-2"></div>
            </div>

            {/* Settings Form Skeleton */}
            <div className="rounded-lg border border-border p-6 space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 w-24 bg-border dark:bg-hover rounded animate-pulse"></div>
                        <div className="h-10 bg-border dark:bg-hover rounded animate-pulse"></div>
                    </div>
                ))}
                <div className="h-10 w-24 bg-border dark:bg-hover rounded animate-pulse"></div>
            </div>
        </div>
    )
}
