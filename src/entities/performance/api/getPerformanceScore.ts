"use server"

import { createClient } from '@/shared/api/supabase/server'
import { PerformanceScore } from '../model/types'

/**
 * Fetch performance score for an employee in a specific quarter
 * 
 * @param employeeId - The ID of the employee
 * @param quarterId - The quarter ID (e.g., "2025-Q1")
 * @returns Performance score data or null if not found
 */
export async function getPerformanceScore(
    employeeId: string,
    quarterId: string
): Promise<PerformanceScore | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('performance_scores')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('quarter_id', quarterId)
        .single()

    if (error) {
        // Return null if no data found
        if (error.code === 'PGRST116') return null
        console.error('Error fetching performance score:', error)
        throw error
    }

    return data as PerformanceScore
}

/**
 * Fetch all performance scores for a quarter
 * 
 * @param quarterId - The quarter ID (e.g., "2025-Q1")
 * @returns Array of performance scores
 */
export async function getAllPerformanceScores(
    quarterId: string
): Promise<PerformanceScore[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('performance_scores')
        .select('*')
        .eq('quarter_id', quarterId)
        .order('overall_score', { ascending: false })

    if (error) {
        console.error('Error fetching performance scores:', error)
        throw error
    }

    return data as PerformanceScore[]
}
