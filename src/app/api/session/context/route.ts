import { getSessionContext } from "@/shared/lib/session-context-server"

// Refetches of ["session-context"]; the app layout seeds the first one.
export async function GET() {
  return Response.json(await getSessionContext())
}
