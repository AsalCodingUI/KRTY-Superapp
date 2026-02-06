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
      toast.error("Gagal konek kalender")
    }
  }, [])

  const disconnect = useCallback(async () => {
    try {
      const response = await fetch("/api/calendar/connect", {
        method: "DELETE",
      })

      if (response.ok) {
        setIsConnected(false)
        toast.success("Kalender terputus")
        router.refresh()
      } else {
        throw new Error("Failed to disconnect")
      }
    } catch (error) {
      logError("Failed to disconnect Google Calendar:", error)
      toast.error("Gagal putus kalender")
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
      toast.success("Kalender terhubung")
      checkConnection()
      // Clean up URL
      router.replace("/calendar")
    } else if (error) {
      const errorMessages: Record<string, string> = {
        no_code: "Kode kosong",
        invalid_state: "State invalid",
        unauthorized: "Harus login",
        missing_credentials: "Config server",
        token_exchange_failed: "Token gagal",
        store_failed: "Simpan token gagal",
      }

      toast.error(errorMessages[error] || "Gagal konek kalender")
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
