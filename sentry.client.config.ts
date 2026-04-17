import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Replay captures user interactions that led to an error
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Traces % of requests captured for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay % of sessions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Disable in development to reduce noise
  enabled: process.env.NODE_ENV === "production",
})
