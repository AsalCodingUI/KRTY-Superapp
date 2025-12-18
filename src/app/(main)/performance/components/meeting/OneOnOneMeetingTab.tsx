"use client"

import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { QuarterFilter, type QuarterFilterValue } from "@/components/QuarterFilter"
import { RiCalendarLine, RiTimeLine, RiUserLine, RiVideoLine } from "@remixicon/react"
import { useState } from "react"

export function OneOnOneMeetingTab() {
    const [selectedQuarter, setSelectedQuarter] = useState<QuarterFilterValue>("2025-Q1")

    return (
        <div className="space-y-6">
            {/* QUARTER FILTER */}
            <QuarterFilter value={selectedQuarter} onChange={setSelectedQuarter} />
            {/* UPCOMING MEETINGS */}
            <div>
                <h3 className="font-semibold text-content dark:text-content mb-4">Upcoming 1:1 Meetings</h3>
                <div className="space-y-4">
                    <Card className="border-l-4 border-l-primary">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                                    <RiCalendarLine className="size-5 text-primary dark:text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-content dark:text-content">Weekly Check-in</h4>
                                    <p className="text-sm text-content-subtle">with Sarah Johnson (Manager)</p>
                                </div>
                            </div>
                            <Badge variant="default">This Week</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-content-subtle dark:text-content-placeholder mb-4">
                            <div className="flex items-center gap-1.5">
                                <RiTimeLine className="size-4" />
                                <span>Fri, Dec 10 • 2:00 PM - 2:30 PM</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <RiVideoLine className="size-4" />
                                <span>Google Meet</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-content dark:text-content">Agenda:</p>
                            <ul className="text-sm text-content-subtle dark:text-content-placeholder list-disc pl-4 space-y-1">
                                <li>Project Alpha progress update</li>
                                <li>Q4 goal review and adjustments</li>
                                <li>Career development discussion</li>
                            </ul>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button size="sm">Join Meeting</Button>
                            <Button size="sm" variant="secondary">View Agenda</Button>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-muted dark:bg-hover">
                                    <RiUserLine className="size-5 text-content-subtle dark:text-content-placeholder" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-content dark:text-content">Mentorship Session</h4>
                                    <p className="text-sm text-content-subtle">with Alex Chen (Mentee)</p>
                                </div>
                            </div>
                            <Badge>Next Week</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-content-subtle dark:text-content-placeholder mb-4">
                            <div className="flex items-center gap-1.5">
                                <RiTimeLine className="size-4" />
                                <span>Tue, Dec 14 • 10:00 AM - 10:30 AM</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <RiVideoLine className="size-4" />
                                <span>Zoom</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-content dark:text-content">Topics:</p>
                            <ul className="text-sm text-content-subtle dark:text-content-placeholder list-disc pl-4 space-y-1">
                                <li>Code review best practices</li>
                                <li>Technical architecture patterns</li>
                            </ul>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="secondary">Reschedule</Button>
                        </div>
                    </Card>
                </div>
            </div >

            {/* PAST MEETINGS */}
            < div >
                <h3 className="font-semibold text-content dark:text-content mb-4">Past Meeting Notes</h3>
                <div className="space-y-4">
                    <Card>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-medium text-content dark:text-content">Weekly Check-in</h4>
                                <p className="text-sm text-content-subtle">with Sarah Johnson • Dec 3, 2024</p>
                            </div>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="font-medium text-content dark:text-content mb-1">Key Discussion Points:</p>
                                <ul className="text-content-subtle dark:text-content-placeholder list-disc pl-4 space-y-1">
                                    <li>Successfully completed migration to new architecture</li>
                                    <li>Discussed promotion readiness for Q1 2025</li>
                                    <li>Identified need for public speaking workshops</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-medium text-content dark:text-content mb-1">Action Items:</p>
                                <ul className="text-content-subtle dark:text-content-placeholder space-y-1">
                                    <li className="flex items-start gap-2">
                                        <Badge variant="success" className="mt-0.5">Done</Badge>
                                        <span>Complete technical design doc for Project Beta</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Badge className="mt-0.5">In Progress</Badge>
                                        <span>Enroll in presentation skills course</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-medium text-content dark:text-content">Career Development</h4>
                                <p className="text-sm text-content-subtle">with Sarah Johnson • Nov 26, 2024</p>
                            </div>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="font-medium text-content dark:text-content mb-1">Key Discussion Points:</p>
                                <ul className="text-content-subtle dark:text-content-placeholder list-disc pl-4 space-y-1">
                                    <li>Reviewed career path to Senior Engineer role</li>
                                    <li>Discussed areas of technical expertise to develop</li>
                                    <li>Set goals for Q4 performance review</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-medium text-content dark:text-content mb-1">Action Items:</p>
                                <ul className="text-content-subtle dark:text-content-placeholder space-y-1">
                                    <li className="flex items-start gap-2">
                                        <Badge variant="success" className="mt-0.5">Done</Badge>
                                        <span>Lead architectural review sessions (2x/month)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Badge variant="success" className="mt-0.5">Done</Badge>
                                        <span>Mentor 2 junior developers</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </div >
        </div >
    )
}
