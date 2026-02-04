"use client"

import { createClient } from '@/shared/api/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { PerformanceScore } from './types'

/**
 * Hook to fetch performance scores for an employee
 * 
 * @param employeeId - The ID of the employee
 * @param quarterId - The quarter ID (e.g., "2025-Q1")
 * @returns Query result with performance scores
 */
export function usePerformanceScore(employeeId: string | null, quarterId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: ['performance-score', employeeId, quarterId],
        queryFn: async () => {
            if (!employeeId) return null

            const { data, error } = await supabase
                .from('performance_scores')
                .select('*')
                .eq('employee_id', employeeId)
                .eq('quarter_id', quarterId)
                .single()

            if (error) {
                // Return null if no data found instead of throwing
                if (error.code === 'PGRST116') return null
                throw error
            }

            return data as PerformanceScore
        },
        enabled: !!employeeId,
    })
}

/**
 * Hook to fetch all performance scores for a quarter
 * 
 * @param quarterId - The quarter ID (e.g., "2025-Q1")
 * @returns Query result with all performance scores
 */
export function useAllPerformanceScores(quarterId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: ['all-performance-scores', quarterId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('performance_scores')
                .select('*')
                .eq('quarter_id', quarterId)
                .order('overall_score', { ascending: false })

            if (error) throw error
            return data as PerformanceScore[]
        },
    })
}
