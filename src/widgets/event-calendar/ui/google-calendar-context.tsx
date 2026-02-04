"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { logError } from "@/shared/lib/utils/logger"
import { createContext, useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

interface GoogleCalendarContextValue {
  isConnected: boolean
  isLoading: boolean
  checkConnection: () => Promise<void>
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

export const GoogleCalendarContext = createContext<
  GoogleCalendarContextValue | undefined
>(undefined)

interface GoogleCalendarProviderProps {
  children: React.ReactNode
}

export function GoogleCalendarProvider({
  children,
}: GoogleCalendarProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  const checkConnection = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/calendar/connect")
      const data = await response.json()
      setIsConnected(data.isConnected || false)
    } catch (error) {
      logError("Failed to check Google Calendar connection:", error)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const connect = useCallback(async () => {
    try {
      // First, get the authorize URL
      const response = await fetch("/api/calendar/connect", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to initiate OAuth")
      }

      const data = await response.json()

      // Get the actual OAuth URL from the authorize endpoint
      const authorizeResponse = await fetch(data.authorizeUrl)
      const authorizeData = await authorizeResponse.json()

      if (authorizeData.authUrl) {
        // Redirect to Google OAuth
        window.location.href = authorizeData.authUrl
      } else {
        throw new Error("No auth URL received")
      }
    } catch (error) {
      logError("Failed to connect Google Calendar:", error)
      toast.error("Failed to connect Google Calendar")
    }
  }, [])

  const disconnect = useCallback(async () => {
    try {
      const response = await fetch("/api/calendar/connect", {
        method: "DELETE",
      })

      if (response.ok) {
        setIsConnected(false)
        toast.success("Google Calendar disconnected")
        router.refresh()
      } else {
        throw new Error("Failed to disconnect")
      }
    } catch (error) {
      logError("Failed to disconnect Google Calendar:", error)
      toast.error("Failed to disconnect Google Calendar")
    }
  }, [router])

  // Check connection on mount
  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  // Handle OAuth callback success/error
  useEffect(() => {
    const connected = searchParams.get("connected")
    const error = searchParams.get("error")

    if (connected === "true") {
      toast.success("Google Calendar connected successfully!")
      checkConnection()
      // Clean up URL
      router.replace("/calendar")
    } else if (error) {
      const errorMessages: Record<string, string> = {
        no_code: "Authorization failed: No code received",
        invalid_state:
          "Authorization failed: Invalid state (CSRF check failed)",
        unauthorized: "You must be logged in to connect Google Calendar",
        missing_credentials: "Server configuration error",
        token_exchange_failed: "Failed to exchange authorization code",
        store_failed: "Failed to store access token",
      }

      toast.error(errorMessages[error] || "Failed to connect Google Calendar")
      // Clean up URL
      router.replace("/calendar")
    }
  }, [searchParams, checkConnection, router])

  return (
    <GoogleCalendarContext.Provider
      value={{
        isConnected,
        isLoading,
        checkConnection,
        connect,
        disconnect,
      }}
    >
      {children}
    </GoogleCalendarContext.Provider>
  )
}
