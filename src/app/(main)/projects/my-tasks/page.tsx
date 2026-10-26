import { MyTasksPage } from "@/page-slices/projects/ui/my-tasks/MyTasksPage"

export const dynamic = "force-dynamic"

// Static segment, so it wins over /projects/[id].
export default function MyTasksRoute() {
  return <MyTasksPage />
}
