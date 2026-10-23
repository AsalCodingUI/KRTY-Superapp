"use client"

import { useT } from "@/shared/i18n/client"
import { useRouter, useSearchParams } from "next/navigation"
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
  const t = useT("calendar")
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
      console.error("Failed to check Google Calendar connection:", error)
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
      console.error("Failed to connect Google Calendar:", error)
      toast.error(t("googleConnectFailed"))
    }
  }, [t])

  const disconnect = useCallback(async () => {
    try {
      const response = await fetch("/api/calendar/connect", {
        method: "DELETE",
      })

      if (response.ok) {
        setIsConnected(false)
        toast.success(t("googleDisconnected"))
        router.refresh()
      } else {
        throw new Error("Failed to disconnect")
      }
    } catch (error) {
      console.error("Failed to disconnect Google Calendar:", error)
      toast.error(t("googleDisconnectFailed"))
    }
  }, [router, t])

  // Check connection on mount
  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  // Handle OAuth callback success/error
  useEffect(() => {
    const connected = searchParams.get("connected")
    const error = searchParams.get("error")

    if (connected === "true") {
      toast.success(t("googleConnected"))
      checkConnection()
      // Clean up URL
      router.replace("/calendar")
    } else if (error) {
      const errorMessages: Record<string, string> = {
        no_code: t("googleErrorNoCode"),
        invalid_state: t("googleErrorInvalidState"),
        unauthorized: t("googleErrorUnauthorized"),
        missing_credentials: t("googleErrorMissingCredentials"),
        token_exchange_failed: t("googleErrorTokenExchange"),
        store_failed: t("googleErrorStoreFailed"),
      }

      toast.error(errorMessages[error] || t("googleConnectFailed"))
      // Clean up URL
      router.replace("/calendar")
    }
  }, [searchParams, checkConnection, router, t])

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
