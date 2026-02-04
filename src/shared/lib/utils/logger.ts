/**
 * Centralized logger for the application.
 * Use this instead of console.log/error directly to allow for easier integration
 * with monitoring services (Sentry, LogRocket, etc.) in the future.
 */

type LogContext = Record<string, unknown>

export function logError(
  message: string,
  error?: unknown,
  context?: LogContext,
) {
  // In a real app, we might filter out errors in test environment
  // if (process.env.NODE_ENV === 'test') return

  const timestamp = new Date().toISOString()

  // Format the error object safely
  const errorDetails =
    error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : error

  // In production, this is where we would send to Sentry
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
