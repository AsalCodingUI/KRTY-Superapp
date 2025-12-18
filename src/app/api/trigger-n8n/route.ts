import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;



    if (!webhookUrl) {
        return NextResponse.json({ error: 'Configuration Error: Missing Webhook URL' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { reviewee_id, cycle_id } = body;

        const supabase = createClient();

        // --- STEP 1: Coba ambil data dengan filter strict (Cycle ID harus cocok) ---
        let query = supabase
            .from('performance_reviews')
            .select(`*, reviewer:profiles!reviewer_id(full_name, job_title)`)
            .eq('reviewee_id', reviewee_id);

        if (cycle_id) {
            query = query.eq('cycle_id', cycle_id);
        }

        let { data: reviews, error } = await query;

        if (error) throw new Error(error.message);

        // If no reviews found, return empty result (NOT all reviews!)
        if (!reviews || reviews.length === 0) {
            return NextResponse.json({
                success: true,
                count: 0,
                message: cycle_id
                    ? `No reviews found for cycle ${cycle_id}`
                    : 'No reviews found for this user'
            });
        }

        // 3. Kirim Payload ke n8n
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                meta: {
                    reviewee_id,
                    cycle_id,
                    timestamp: new Date().toISOString(),
                    total_reviews: reviews.length
                },
                reviews: reviews
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`n8n rejected: ${response.status} - ${errorText}`);
        }

        return NextResponse.json({ success: true, count: reviews.length });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
        console.error("❌ [API] Error:", error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}