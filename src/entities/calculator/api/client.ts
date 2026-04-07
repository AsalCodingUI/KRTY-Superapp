import type { SaveCalculationPayload } from "@/app/(main)/calculator/actions/calculation-actions"

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}

export type { SaveCalculationPayload }

export async function getCalculationsByProject(projectId: string) {
  const params = new URLSearchParams({ projectId })
  const response = await fetch(`/api/calculator/calculations?${params.toString()}`, {
    cache: "no-store",
  })
  return parseJson<any>(response)
}

export async function saveCalculation(payload: SaveCalculationPayload) {
  const response = await fetch("/api/calculator/calculations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return parseJson<any>(response)
}

export async function updateCalculation(
  id: string,
  payload: Partial<SaveCalculationPayload>,
) {
  const response = await fetch("/api/calculator/calculations", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, payload }),
  })
  return parseJson<any>(response)
}

export async function deleteCalculation(id: string) {
  const response = await fetch("/api/calculator/calculations", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  })
  return parseJson<any>(response)
}
