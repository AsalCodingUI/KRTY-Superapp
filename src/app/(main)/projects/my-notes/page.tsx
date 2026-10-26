import { MyNotesPage } from "@/page-slices/projects/ui/my-notes/MyNotesPage"

export const dynamic = "force-dynamic"

// Static segment, so it wins over /projects/[id].
export default function MyNotesRoute() {
  return <MyNotesPage />
}
