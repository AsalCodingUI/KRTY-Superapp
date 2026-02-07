"use client"

import { Button } from "@/shared/ui"
import { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-surface-danger-light p-3">
            <svg
              className="h-6 w-6 text-foreground-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-heading-lg text-content">Terjadi Kesalahan</h2>
          <p className="text-label-md text-content-subtle max-w-md">
            Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi
            atau kembali ke halaman utama.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => this.setState({ hasError: false })}
            >
              Coba Lagi
            </Button>
            <Button
              variant="primary"
              onClick={() => (window.location.href = "/")}
            >
              Dashboard
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
