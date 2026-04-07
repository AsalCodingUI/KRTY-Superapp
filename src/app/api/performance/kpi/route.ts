import {
  getAllEmployees,
  getEmployeeDetail,
  getEmployeeOverview,
  getOverviewStats,
} from "@/app/(main)/performance/actions/employee-kpi-actions"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("mode")

  switch (mode) {
    case "employees": {
      const searchQuery = searchParams.get("searchQuery") || undefined
      const page = Number(searchParams.get("page") || "0")
      const pageSize = Number(searchParams.get("pageSize") || "25")
      return Response.json(
        await getAllEmployees(searchQuery, page, pageSize),
      )
    }
    case "employee-detail": {
      const userId = searchParams.get("userId")
      const quarter = searchParams.get("quarter") || undefined
      if (!userId) {
        return Response.json(
          { success: false, error: "Missing userId" },
          { status: 400 },
        )
      }
      return Response.json(await getEmployeeDetail(userId, quarter))
    }
    case "employee-overview": {
      const userId = searchParams.get("userId")
      const quarter = searchParams.get("quarter") || undefined
      if (!userId) {
        return Response.json(
          { success: false, error: "Missing userId" },
          { status: 400 },
        )
      }
      return Response.json(await getEmployeeOverview(userId, quarter))
    }
    case "overview-stats": {
      const quarter = searchParams.get("quarter") || undefined
      return Response.json(await getOverviewStats(quarter))
    }
    default:
      return Response.json(
        { success: false, error: "Unsupported mode" },
        { status: 400 },
      )
  }
}
