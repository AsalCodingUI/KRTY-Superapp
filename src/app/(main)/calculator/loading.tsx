"use client"

export default function CalculatorLoading() {
    return (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-7 space-y-10">
                {/* Project Context Section */}
                <div>
                    <div className="h-5 w-32 bg-border dark:bg-hover rounded animate-pulse mb-6"></div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 w-24 bg-border dark:bg-hover rounded animate-pulse"></div>
                                <div className="h-10 bg-border dark:bg-hover rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline Section */}
                <div>
                    <div className="h-5 w-32 bg-border dark:bg-hover rounded animate-pulse mb-6"></div>
                    {[1, 2].map((i) => (
                        <div key={i} className="flex gap-4 mb-4">
                            <div className="h-10 flex-1 bg-border dark:bg-hover rounded animate-pulse"></div>
                            <div className="h-10 w-24 bg-border dark:bg-hover rounded animate-pulse"></div>
                            <div className="h-10 w-24 bg-border dark:bg-hover rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT COLUMN - HUD */}
            <div className="lg:col-span-5">
                <div className="rounded-lg border border-border p-6 space-y-6 sticky top-6">
                    <div className="h-6 w-32 bg-border dark:bg-hover rounded animate-pulse"></div>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 w-24 bg-border dark:bg-hover rounded animate-pulse"></div>
                            <div className="h-8 w-32 bg-border dark:bg-hover rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
