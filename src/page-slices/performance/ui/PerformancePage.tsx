"use client"

import { TabNavigation, TabNavigationLink } from "@/shared/ui"
import { useUserProfile } from '@/shared/hooks/useUserProfile'
import dynamic from "next/dynamic"
import { useState } from "react"

// Dynamic imports for tab components - only load when needed
const OverviewTab = dynamic(() => import("@/app/(main)/performance/components/overview/OverviewTab").then(mod => mod.OverviewTab), {
    loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

const KPITab = dynamic(() => import("@/app/(main)/performance/components/kpi/KPITab").then(mod => mod.KPITab), {
    loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

const Review360Tab = dynamic(() => import("@/app/(main)/performance/components/360-review/Review360Tab").then(mod => mod.Review360Tab), {
    loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

const OneOnOneMeetingTab = dynamic(() => import("@/app/(main)/performance/components/meeting/OneOnOneMeetingTab").then(mod => mod.OneOnOneMeetingTab), {
    loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

const ListProjectTab = dynamic(() => import("@/app/(main)/performance/components/admin/ListProjectTab").then(mod => mod.ListProjectTab), {
    loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

const WorkQualityTab = dynamic(() => import("@/app/(main)/performance/components/admin/WorkQualityTab").then(mod => mod.WorkQualityTab), {
    loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

type TabType = 'overview' | 'kpi' | '360-review' | 'one-on-one' | 'list-project' | 'competency-library'

export function PerformancePage() {
    const [activeTab, setActiveTab] = useState<TabType>('overview')
    const { profile } = useUserProfile()

    const isStakeholder = profile?.role === 'stakeholder'

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div>
                <h1 className="text-lg font-semibold text-content sm:text-xl dark:text-content">
                    Individual Performance
                </h1>
            </div>

            {/* TAB NAVIGATION */}
            <TabNavigation value={activeTab}>
                <TabNavigationLink
                    active={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </TabNavigationLink>
                <TabNavigationLink
                    active={activeTab === 'kpi'}
                    onClick={() => setActiveTab('kpi')}
                >
                    KPI
                </TabNavigationLink>
                <TabNavigationLink
                    active={activeTab === '360-review'}
                    onClick={() => setActiveTab('360-review')}
                >
                    360 Review
                </TabNavigationLink>
                <TabNavigationLink
                    active={activeTab === 'one-on-one'}
                    onClick={() => setActiveTab('one-on-one')}
                >
                    Jadwal 1:1
                </TabNavigationLink>

                {/* ADMIN TABS (Stakeholder Only) */}
                {isStakeholder && (
                    <>
                        <TabNavigationLink
                            active={activeTab === 'list-project'}
                            onClick={() => setActiveTab('list-project')}
                        >
                            List Project
                        </TabNavigationLink>
                        <TabNavigationLink
                            active={activeTab === 'competency-library'}
                            onClick={() => setActiveTab('competency-library')}
                        >
                            Competency Library
                        </TabNavigationLink>
                    </>
                )}
            </TabNavigation>

            {/* TAB CONTENT */}
            <div className="mt-6">
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'kpi' && <KPITab />}
                {activeTab === '360-review' && <Review360Tab />}
                {activeTab === 'one-on-one' && <OneOnOneMeetingTab />}
                {activeTab === 'list-project' && isStakeholder && <ListProjectTab />}
                {activeTab === 'competency-library' && isStakeholder && <WorkQualityTab />}
            </div>
        </div>
    )
}
