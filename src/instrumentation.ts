/**
 * Runs once when the server starts. Background notices (lib/jobs/runner.ts)
 * only start where JOBS_ENABLED=1, which only the production app sets.
 *
 * The import stays inside the NEXT_RUNTIME check (Next's documented shape)
 * so the edge build drops it: the jobs use Node-only modules (nodemailer).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.JOBS_ENABLED === "1") {
      const { startJobs } = await import("@/shared/lib/jobs/runner")
      startJobs()
    }
  }
}
