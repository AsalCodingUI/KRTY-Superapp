import { notFound } from "next/navigation"
import { getEmployeeDetail } from "../../actions/employee-kpi-actions"
import { EmployeeDetailClient } from "./EmployeeDetailClient"

// Type matching EmployeeDetailClient's Assignment type
type Assignment = {
    id: string
    role_in_project: string
    weight_in_quarter: number | null
    projects: {
        id: string
        name: string
        description: string | null
        start_date: string
        end_date: string
        quarter_id: string
        status: string
    }
    project_sla_scores: Array<{
        score_achieved: number
        weight_percentage: number
    }>
    project_work_quality_scores: Array<{
        is_achieved: boolean
    }>
}

interface EmployeeDetailPageProps {
    params: {
        id: string
    }
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
    const { id } = params

    const result = await getEmployeeDetail(id)

    if (!result.success || !result.data) {
        notFound()
    }

    return <EmployeeDetailClient employee={result.data.employee} initialAssignments={result.data.assignments as unknown as Assignment[]} showBackButton={true} />
}
