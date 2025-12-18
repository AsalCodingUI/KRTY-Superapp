"use client"

import { Badge } from "@/components/Badge"
import { Card } from "@/components/Card"
import { ProgressBar } from "@/components/ProgressBar"
import { QuarterFilter, type QuarterFilterValue } from "@/components/QuarterFilter"
import { RiStarFill } from "@remixicon/react"
import { useState } from "react"

export function OverviewTab() {
    const [selectedQuarter, setSelectedQuarter] = useState<QuarterFilterValue>("2025-Q1")
    return (
        <div className="space-y-6">
            {/* QUARTER FILTER */}
            <QuarterFilter value={selectedQuarter} onChange={setSelectedQuarter} />
            {/* SCORECARD SUMMARY */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card className="flex flex-col justify-between border-l-4 border-l-blue-500">
                    <dt className="text-sm font-medium text-content-subtle">Overall Score</dt>
                    <dd className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-semibold text-content dark:text-content">4.6</span>
                        <span className="text-sm text-content-subtle">/ 5.0</span>
                    </dd>
                    <div className="mt-4">
                        <Badge variant="success">Exceeds Expectations</Badge>
                    </div>
                </Card>

                <Card>
                    <dt className="text-sm font-medium text-content-subtle">KPI Achievement</dt>
                    <dd className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-semibold text-content dark:text-content">108%</span>
                    </dd>
                    <p className="mt-4 text-xs text-content-subtle">
                        <span className="font-medium text-emerald-600">+8%</span> vs Target
                    </p>
                </Card>

                <Card>
                    <dt className="text-sm font-medium text-content-subtle">360 Feedback Rating</dt>
                    <dd className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-semibold text-content dark:text-content">4.5</span>
                        <div className="flex text-yellow-400">
                            <RiStarFill className="size-5" />
                            <RiStarFill className="size-5" />
                            <RiStarFill className="size-5" />
                            <RiStarFill className="size-5" />
                            <RiStarFill className="size-5 opacity-50" />
                        </div>
                    </dd>
                    <p className="mt-4 text-xs text-content-subtle">Based on 5 peer reviews</p>
                </Card>
            </div>

            {/* FEEDBACK SECTIONS */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Strengths */}
                <Card>
                    <h3 className="font-semibold text-content dark:text-content mb-4">
                        Top Strengths
                    </h3>
                    <ul className="space-y-3 text-sm text-content-subtle dark:text-content-subtle list-disc pl-4">
                        <li>Consistently delivers high-quality code with minimal bugs.</li>
                        <li>Great team player, always willing to help juniors.</li>
                        <li>Strong problem-solving skills in critical situations.</li>
                    </ul>
                </Card>

                {/* Improvements */}
                <Card>
                    <h3 className="font-semibold text-content dark:text-content mb-4">
                        Areas for Growth
                    </h3>
                    <ul className="space-y-3 text-sm text-content-subtle dark:text-content-subtle list-disc pl-4">
                        <li>Need to improve public speaking during sprint reviews.</li>
                        <li>Documentation could be more detailed.</li>
                        <li>Time management on multiple parallel tasks.</li>
                    </ul>
                </Card>

                {/* Recent Goals */}
                <Card>
                    <h3 className="font-semibold text-content dark:text-content mb-4">
                        Active Goals (OKRs)
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-content-subtle dark:text-content-subtle">Lead Project Alpha</span>
                                <span className="font-medium">75%</span>
                            </div>
                            <ProgressBar value={75} variant="default" />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-content-subtle dark:text-content-subtle">Mentor 2 Juniors</span>
                                <span className="font-medium">40%</span>
                            </div>
                            <ProgressBar value={40} variant="warning" />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
