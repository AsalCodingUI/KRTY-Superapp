'use client'

import { Toaster } from 'sonner'

/**
 * ToastProvider initializes the Sonner toaster.
 * Placed at the root of the application.
 */
export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            expand={false}
            richColors
            closeButton
        />
    )
}
