"use server"

import { createClient } from '@/shared/api/supabase/server'
import { revalidatePath } from "next/cache"

interface PerformanceReviewFormData {
    cycle_id: string
    reviewee_id: string
    score_quality: number
    score_reliability: number
    score_communication: number
    score_initiative: number
    score_leadership: number
    feedback_start: string
    feedback_continue: string
    feedback_stop: string
    justification_quality?: string
    justification_reliability?: string
    justification_communication?: string
    justification_initiative?: string
    justification_leadership?: string
    justification_score?: string
}

export async function submitPerformanceReview(formData: PerformanceReviewFormData) {
    const supabase = await createClient()

    // 1. Ambil User saat ini (Reviewer)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // 2. Simpan Data Mentah ke Database
    const { data: insertedData, error } = await supabase
        .from('performance_reviews')
        .insert({
            cycle_id: formData.cycle_id,
            reviewer_id: user.id,
            reviewee_id: formData.reviewee_id,

            // Quantitative Scores
            score_quality: formData.score_quality,
            score_reliability: formData.score_reliability,
            score_communication: formData.score_communication,
            score_initiative: formData.score_initiative,
            score_leadership: formData.score_leadership,

            // Qualitative Feedback (Start/Stop/Continue)
            feedback_start: formData.feedback_start,
            feedback_continue: formData.feedback_continue,
            feedback_stop: formData.feedback_stop,

            // === TAMBAHAN BARU: JUSTIFIKASI PER KATEGORI ===
            justification_quality: formData.justification_quality,
            justification_reliability: formData.justification_reliability,
            justification_communication: formData.justification_communication,
            justification_initiative: formData.justification_initiative,
            justification_leadership: formData.justification_leadership,

            status: 'processing'
        })
        .select()
        .single()

    if (error) {
        console.error("Database Insert Error:", error)
        return { success: false, message: "Gagal menyimpan review. Coba lagi." }
    }

    // 3. Trigger Webhook n8n (Fire & Forget)
    if (process.env.N8N_WEBHOOK_URL) {
        fetch(process.env.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                review_id: insertedData.id,
                reviewer_id: user.id,
                reviewee_id: formData.reviewee_id,
                raw_feedback: {
                    start: formData.feedback_start,
                    continue: formData.feedback_continue,
                    stop: formData.feedback_stop,
                    justification: formData.justification_score
                }
            })
        }).catch(err => console.error("n8n Trigger Failed:", err))
    }

    revalidatePath('/performance')
    return { success: true, message: "Review berhasil dikirim!" }
}