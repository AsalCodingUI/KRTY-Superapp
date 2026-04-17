/**
 * Centralized logger for the application.
 * In production, errors are forwarded to Sentry.
 * In development, errors are logged to the console.
 */

import * as Sentry from "@sentry/nextjs"

type LogContext = Record<string, unknown>

export function logError(
  message: string,
  error?: unknown,
  context?: LogContext,
) {
  const timestamp = new Date().toISOString()

  // Format the error object safely
  const errorDetails =
    error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : error

  if (process.env.NODE_ENV === "production") {
    // Forward to Sentry in production
    const sentryError =
      error instanceof Error ? error : new Error(message)

    Sentry.captureException(sentryError, {
      extra: {
        message,
        context,
        originalError: error instanceof Error ? undefined : errorDetails,
      },
    })
  } else {
    console.error(
      JSON.stringify(
        {
          level: "ERROR",
          timestamp,
          message,
          error: errorDetails,
          context,
        },
        null,
        2,
      ),
    )
  }
}

export function logInfo(message: string, context?: LogContext) {
  const timestamp = new Date().toISOString()

  console.log(
    JSON.stringify(
      {
        level: "INFO",
        timestamp,
        message,
        context,
      },
      null,
      2,
    ),
  )
}

export function logWarn(message: string, context?: LogContext) {
  const timestamp = new Date().toISOString()

  console.warn(
    JSON.stringify(
      {
        level: "WARN",
        timestamp,
        message,
        context,
      },
      null,
      2,
    ),
  )
}
