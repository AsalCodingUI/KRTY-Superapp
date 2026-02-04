"use client"

import { Button } from "@/shared/ui"
import { Card } from "@/shared/ui"
import { RiHome2Line, RiRefreshLine } from "@remixicon/react"
import { useEffect } from "react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Application Error:", error)
    }, [error])

    return (
        <div className="flex min-h-[50vh] items-center justify-center">
            <Card className="max-w-md text-center">
                <div className="space-y-4">
                    <div className="mx-auto h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                    </div>

                    <h2 className="text-lg font-semibold text-content dark:text-content">
                        Terjadi Kesalahan
                    </h2>

                    <p className="text-sm text-content-subtle dark:text-content-placeholder">
                        Maaf, terjadi kesalahan saat memuat halaman ini.
                        Silakan coba lagi atau kembali ke halaman utama.
                    </p>

                    {error.digest && (
                        <p className="text-xs text-content-placeholder dark:text-content-subtle font-mono">
                            Error ID: {error.digest}
                        </p>
                    )}

                    <div className="flex gap-3 justify-center pt-2">
                        <Button variant="secondary" onClick={reset}>
                            <RiRefreshLine className="size-4 mr-2" />
                            Coba Lagi
                        </Button>
                        <Button onClick={() => window.location.href = "/dashboard"}>
                            <RiHome2Line className="size-4 mr-2" />
                            Dashboard
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
