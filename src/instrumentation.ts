/**
 * Runs once when the server starts. Background notices (lib/jobs/runner.ts)
 * only start where JOBS_ENABLED=1, which only the production app sets.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (process.env.JOBS_ENABLED !== "1") return
  const { startJobs } = await import("@/shared/lib/jobs/runner")
  startJobs()
}
