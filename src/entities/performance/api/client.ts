const noStoreInit = { cache: "no-store" as const }

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T
  return payload
}

export async function getAllEmployees(
  searchQuery?: string,
  page = 0,
  pageSize = 25,
) {
  const params = new URLSearchParams({
    mode: "employees",
    page: String(page),
    pageSize: String(pageSize),
  })

  if (searchQuery) {
    params.set("searchQuery", searchQuery)
  }

  const response = await fetch(`/api/performance/kpi?${params.toString()}`, noStoreInit)
  return parseJson<any>(response)
}

export async function getEmployeeDetail(userId: string, quarter?: string) {
  const params = new URLSearchParams({
    mode: "employee-detail",
    userId,
  })

  if (quarter) {
    params.set("quarter", quarter)
  }

  const response = await fetch(`/api/performance/kpi?${params.toString()}`, noStoreInit)
  return parseJson<any>(response)
}

export async function getEmployeeOverview(userId: string, quarter?: string) {
  const params = new URLSearchParams({
    mode: "employee-overview",
    userId,
  })

  if (quarter) {
    params.set("quarter", quarter)
  }

  const response = await fetch(`/api/performance/kpi?${params.toString()}`, noStoreInit)
  return parseJson<any>(response)
}

export async function getOverviewStats(quarter?: string) {
  const params = new URLSearchParams({
    mode: "overview-stats",
  })

  if (quarter) {
    params.set("quarter", quarter)
  }

  const response = await fetch(`/api/performance/kpi?${params.toString()}`, noStoreInit)
  return parseJson<any>(response)
}
