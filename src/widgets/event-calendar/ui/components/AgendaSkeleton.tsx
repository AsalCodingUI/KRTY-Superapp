"use client";

export function AgendaSkeleton() {
    return (
        <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border border-border-border rounded-lg">
                    {/* Date column */}
                    <div className="flex flex-col items-center gap-1 w-16">
                        <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                        <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                    </div>

                    {/* Event details */}
                    <div className="flex-1 space-y-2">
                        <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                        <div className="flex gap-2">
                            <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
                            <div className="h-6 w-24 bg-muted animate-pulse rounded-full" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
