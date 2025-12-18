import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { StatsCard } from "@/components/StatsCard"
import { createClient } from "@/lib/supabase/server"
import { RiCalendarLine, RiFileTextLine, RiTeamLine, RiUserLine } from "@remixicon/react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    // Get user profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, user_role")
        .eq("id", user.id)
        .single()

    // Get leave balance
    const { data: leaveData } = await supabase
        .from("leave_balances")
        .select("remaining")
        .eq("user_id", user.id)
        .single()

    // Get active projects count
    const { data: projects } = await supabase
        .from("project_assignments")
        .select(`
            id,
            projects!inner (status)
        `)
        .eq("user_id", user.id)
        .eq("projects.status", "Active")

    // Get pending reviews (if stakeholder/admin)
    const isAdminOrStakeholder = profile?.user_role === 'Admin' || profile?.user_role === 'Stakeholder'
    let pendingReviews = 0
    if (isAdminOrStakeholder) {
        const { count } = await supabase
            .from("performance_reviews")
            .select("*", { count: 'exact', head: true })
            .is("self_score", null)
        pendingReviews = count || 0
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-content dark:text-content">
                    Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}! 👋
                </h1>
                <p className="mt-1 text-sm text-content-subtle dark:text-content-placeholder">
                    Here&apos;s what&apos;s happening with your work today
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                <StatsCard
                    title="Leave Balance"
                    value={`${leaveData?.remaining || 0} days`}
                    icon={<RiCalendarLine className="size-5" />}
                />
                <StatsCard
                    title="Active Projects"
                    value={projects?.length || 0}
                    icon={<RiFileTextLine className="size-5" />}
                />
                {isAdminOrStakeholder && (
                    <StatsCard
                        title="Pending Reviews"
                        value={pendingReviews}
                        icon={<RiUserLine className="size-5" />}
                    />
                )}
            </div>

            {/* Quick Actions */}
            <Card>
                <h2 className="text-lg font-semibold text-content dark:text-content mb-4">
                    Quick Actions
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Link href="/leave">
                        <Button variant="secondary" className="w-full justify-start">
                            <RiCalendarLine className="size-4 mr-2" />
                            Request Leave
                        </Button>
                    </Link>
                    <Link href="/performance">
                        <Button variant="secondary" className="w-full justify-start">
                            <RiUserLine className="size-4 mr-2" />
                            View Performance
                        </Button>
                    </Link>
                    {isAdminOrStakeholder && (
                        <>
                            <Link href="/teams">
                                <Button variant="secondary" className="w-full justify-start">
                                    <RiTeamLine className="size-4 mr-2" />
                                    Manage Teams
                                </Button>
                            </Link>
                            <Link href="/performance/review">
                                <Button variant="secondary" className="w-full justify-start">
                                    <RiFileTextLine className="size-4 mr-2" />
                                    Review Employees
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </Card>
        </div>
    )
}