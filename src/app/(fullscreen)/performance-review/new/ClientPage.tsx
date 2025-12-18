"use client"

import { submitPerformanceReview } from "@/app/(main)/performance/action"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/Dialog"
import { Label } from "@/components/Label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/Select"
import { Textarea } from "@/components/Textarea"
import { RiCheckLine, RiCloseLine, RiInformationLine, RiStarFill } from "@remixicon/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Colleague = { id: string, full_name: string | null, job_title: string | null }

interface ReviewFormClientPageProps {
    colleagues: Colleague[]
}

export default function ReviewFormClientPage({ colleagues }: ReviewFormClientPageProps) {

    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showExitConfirm, setShowExitConfirm] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        reviewee_id: "",
        score_quality: 0,
        score_reliability: 0,
        score_communication: 0,
        score_initiative: 0,
        score_leadership: 0,
        feedback_start: "",
        feedback_continue: "",
        feedback_stop: "",
        // Individual justifications for each competency
        justification_quality: "",
        justification_reliability: "",
        justification_communication: "",
        justification_initiative: "",
        justification_leadership: ""
    })

    // Helper function: check if a score is extreme (1, 2, or 5)
    const isExtremeScore = (score: number) => score > 0 && (score <= 2 || score === 5)

    // Check individual extreme scores
    const needsQualityJustification = isExtremeScore(formData.score_quality)
    const needsReliabilityJustification = isExtremeScore(formData.score_reliability)
    const needsCommunicationJustification = isExtremeScore(formData.score_communication)
    const needsInitiativeJustification = isExtremeScore(formData.score_initiative)
    const needsLeadershipJustification = isExtremeScore(formData.score_leadership)

    // Step completion logic
    const step1Complete = formData.reviewee_id !== ""
    const step2Complete = [
        formData.score_quality,
        formData.score_reliability,
        formData.score_communication,
        formData.score_initiative,
        formData.score_leadership
    ].every(score => score > 0)

    // Step 3: Check that all extreme ratings have justifications (min 10 chars)
    const step3Complete =
        (!needsQualityJustification || formData.justification_quality.length >= 10) &&
        (!needsReliabilityJustification || formData.justification_reliability.length >= 10) &&
        (!needsCommunicationJustification || formData.justification_communication.length >= 10) &&
        (!needsInitiativeJustification || formData.justification_initiative.length >= 10) &&
        (!needsLeadershipJustification || formData.justification_leadership.length >= 10)

    const step4Complete = formData.feedback_start !== "" && formData.feedback_continue !== "" && formData.feedback_stop !== ""

    // Handler untuk exit confirmation
    const handleExitClick = () => {
        setShowExitConfirm(true)
    }

    const handleConfirmExit = () => {
        setShowExitConfirm(false)
        router.push("/performance")
    }

    const handleCancelExit = () => {
        setShowExitConfirm(false)
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const payload = {
                ...formData,
                cycle_id: "2025-Q1",
            }

            const result = await submitPerformanceReview(payload)
            if (result.success) {
                alert("Review submitted! AI is processing anonymity...")
                router.push("/performance")
            } else {
                alert(result.message)
            }
        } catch (error) {
            console.error(error)
            alert("Error submitting review.")
        } finally {
            setLoading(false)
        }
    }

    // Progress Tracker Component
    const ProgressTracker = () => {
        const hasAnyExtremeScore = needsQualityJustification || needsReliabilityJustification ||
            needsCommunicationJustification || needsInitiativeJustification || needsLeadershipJustification

        const steps = [
            { number: 1, label: "Select Colleague", complete: step1Complete },
            { number: 2, label: "Rate Competencies", complete: step2Complete },
            { number: 3, label: "Justify Scores", complete: step3Complete, hidden: !hasAnyExtremeScore },
            { number: 4, label: "Written Feedback", complete: step4Complete },
        ]

        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-content dark:text-content mb-1">Review Progress</h3>
                    <p className="text-xs text-content-subtle">Complete all steps to submit</p>
                </div>
                <div className="space-y-3">
                    {steps.filter(s => !s.hidden).map((step) => (
                        <div key={step.number} className="flex items-center gap-3">
                            {step.complete ? (
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-surface dark:bg-muted flex items-center justify-center">
                                    <RiCheckLine className="w-4 h-4 text-white dark:text-content" />
                                </div>
                            ) : (
                                <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-input dark:border-border-subtle flex items-center justify-center">
                                    <span className="text-xs font-medium text-content-subtle dark:text-content-placeholder">{step.number}</span>
                                </div>
                            )}
                            <span className={`text-sm ${step.complete
                                ? "text-content dark:text-content font-medium"
                                : "text-content-subtle dark:text-content-placeholder"
                                }`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Komponen Rating Bintang
    const StarRating = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label className="text-content-subtle dark:text-content-subtle font-medium">{label}</Label>
                <span className="text-xs font-medium text-content-subtle">{value > 0 ? value + "/5" : "-"}</span>
            </div>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className={`p-1 transition-all hover:scale-110 focus:outline-none ${star <= value ? "text-yellow-400" : "text-border-strong dark:text-content"}`}
                    >
                        <RiStarFill className="size-6" />
                    </button>
                ))}
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-background dark:bg-surface">
            {/* EXIT CONFIRMATION DIALOG */}
            <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yakin ingin keluar?</DialogTitle>
                        <DialogDescription>
                            Data yang sudah Anda isi tidak akan tersimpan jika keluar sekarang. Apakah Anda yakin ingin melanjutkan?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="secondary" onClick={handleCancelExit}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmExit}>
                            Ya, Keluar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* STANDALONE HEADER */}
            <div className="sticky top-0 z-10 bg-surface dark:bg-surface border-b border dark:border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo / Title */}
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-content dark:text-content">
                                Kretya Studio 360 Review
                            </span>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={handleExitClick}
                            className="p-2 rounded-lg hover:bg-muted dark:hover:bg-hover transition-colors"
                        >
                            <RiCloseLine className="size-5 text-content-subtle dark:text-content-placeholder" />
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    {/* PROGRESS TRACKER SIDEBAR - Hidden on mobile */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-24">
                            <Card className="p-5">
                                <ProgressTracker />
                            </Card>
                        </div>
                    </div>

                    {/* FORM CONTENT */}
                    <div className="flex-1 min-w-0">
                        <div className="max-w-4xl mx-auto space-y-6 overflow-visible">
                            {/* PAGE TITLE */}
                            <div>
                                <h1 className="text-2xl font-semibold text-content dark:text-content mb-2">
                                    New feedback cycle
                                </h1>
                                <p className="text-sm text-content-subtle dark:text-content-placeholder">
                                    Provide anonymous feedback for your colleague
                                </p>
                            </div>

                            {/* INFO BOX */}
                            <Card>
                                <div className="flex gap-3">
                                    <RiInformationLine className="size-5 text-content-subtle dark:text-content-placeholder shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-content dark:text-content">
                                            Anonymous Feedback System
                                        </p>
                                        <p className="text-xs text-content-subtle dark:text-content-placeholder mt-1">
                                            Your feedback is <b>ANONYMOUS</b> and will be processed by AI to maintain objectivity.
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* COLLEAGUE SELECTION */}
                            <Card className="overflow-visible">
                                <Label>Who do you want to review?</Label>
                                <Select
                                    value={formData.reviewee_id}
                                    onValueChange={(val) => setFormData({ ...formData, reviewee_id: val })}
                                >
                                    <SelectTrigger className="mt-2 w-full">
                                        <SelectValue placeholder="Select a colleague..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {colleagues.map((colleague) => (
                                            <SelectItem key={colleague.id} value={colleague.id}>
                                                {colleague.full_name} — <span className="text-content-placeholder">{colleague.job_title}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Card>

                            {/* RATING SCORES */}
                            {formData.reviewee_id && (
                                <Card className="animate-in fade-in slide-in-from-bottom-4">
                                    <h3 className="font-semibold text-content dark:text-content mb-4">
                                        Rate their competencies
                                    </h3>
                                    <div className="space-y-6">
                                        {/* Quality of Work */}
                                        <div>
                                            <StarRating
                                                label="Quality of Work"
                                                value={formData.score_quality}
                                                onChange={(v) => setFormData({ ...formData, score_quality: v })}
                                            />
                                            {needsQualityJustification && (
                                                <div className="rounded-md bg-muted dark:bg-surface p-3 border border-border animate-in zoom-in-95 mt-3">
                                                    <div className="flex gap-2 text-content-subtle dark:text-content-subtle mb-2">
                                                        <RiInformationLine className="size-4 shrink-0" />
                                                        <p className="text-xs font-medium">Why this rating for Quality of Work?</p>
                                                    </div>
                                                    <Textarea
                                                        placeholder="Explain why you gave this extreme rating..."
                                                        value={formData.justification_quality}
                                                        onChange={(e) => setFormData({ ...formData, justification_quality: e.target.value })}
                                                        className="bg-surface dark:bg-surface text-sm min-h-[60px]"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Reliability & Deadline */}
                                        <div>
                                            <StarRating
                                                label="Reliability & Deadline"
                                                value={formData.score_reliability}
                                                onChange={(v) => setFormData({ ...formData, score_reliability: v })}
                                            />
                                            {needsReliabilityJustification && (
                                                <div className="rounded-md bg-muted dark:bg-surface p-3 border border-border animate-in zoom-in-95 mt-3">
                                                    <div className="flex gap-2 text-content-subtle dark:text-content-subtle mb-2">
                                                        <RiInformationLine className="size-4 shrink-0" />
                                                        <p className="text-xs font-medium">Why this rating for Reliability & Deadline?</p>
                                                    </div>
                                                    <Textarea
                                                        placeholder="Explain why you gave this extreme rating..."
                                                        value={formData.justification_reliability}
                                                        onChange={(e) => setFormData({ ...formData, justification_reliability: e.target.value })}
                                                        className="bg-surface dark:bg-surface text-sm min-h-[60px]"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Communication */}
                                        <div>
                                            <StarRating
                                                label="Communication"
                                                value={formData.score_communication}
                                                onChange={(v) => setFormData({ ...formData, score_communication: v })}
                                            />
                                            {needsCommunicationJustification && (
                                                <div className="rounded-md bg-muted dark:bg-surface p-3 border border-border animate-in zoom-in-95 mt-3">
                                                    <div className="flex gap-2 text-content-subtle dark:text-content-subtle mb-2">
                                                        <RiInformationLine className="size-4 shrink-0" />
                                                        <p className="text-xs font-medium">Why this rating for Communication?</p>
                                                    </div>
                                                    <Textarea
                                                        placeholder="Explain why you gave this extreme rating..."
                                                        value={formData.justification_communication}
                                                        onChange={(e) => setFormData({ ...formData, justification_communication: e.target.value })}
                                                        className="bg-surface dark:bg-surface text-sm min-h-[60px]"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Initiative & Growth */}
                                        <div>
                                            <StarRating
                                                label="Initiative & Growth"
                                                value={formData.score_initiative}
                                                onChange={(v) => setFormData({ ...formData, score_initiative: v })}
                                            />
                                            {needsInitiativeJustification && (
                                                <div className="rounded-md bg-muted dark:bg-surface p-3 border border-border animate-in zoom-in-95 mt-3">
                                                    <div className="flex gap-2 text-content-subtle dark:text-content-subtle mb-2">
                                                        <RiInformationLine className="size-4 shrink-0" />
                                                        <p className="text-xs font-medium">Why this rating for Initiative & Growth?</p>
                                                    </div>
                                                    <Textarea
                                                        placeholder="Explain why you gave this extreme rating..."
                                                        value={formData.justification_initiative}
                                                        onChange={(e) => setFormData({ ...formData, justification_initiative: e.target.value })}
                                                        className="bg-surface dark:bg-surface text-sm min-h-[60px]"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Leadership & Teamwork */}
                                        <div>
                                            <StarRating
                                                label="Leadership & Teamwork"
                                                value={formData.score_leadership}
                                                onChange={(v) => setFormData({ ...formData, score_leadership: v })}
                                            />
                                            {needsLeadershipJustification && (
                                                <div className="rounded-md bg-muted dark:bg-surface p-3 border border-border animate-in zoom-in-95 mt-3">
                                                    <div className="flex gap-2 text-content-subtle dark:text-content-subtle mb-2">
                                                        <RiInformationLine className="size-4 shrink-0" />
                                                        <p className="text-xs font-medium">Why this rating for Leadership & Teamwork?</p>
                                                    </div>
                                                    <Textarea
                                                        placeholder="Explain why you gave this extreme rating..."
                                                        value={formData.justification_leadership}
                                                        onChange={(e) => setFormData({ ...formData, justification_leadership: e.target.value })}
                                                        className="bg-surface dark:bg-surface text-sm min-h-[60px]"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* WRITTEN FEEDBACK */}
                            {formData.reviewee_id && (
                                <>
                                    <Card>
                                        <Label className="font-semibold mb-1 block">CONTINUE (Strength)</Label>
                                        <p className="text-xs text-content-subtle dark:text-content-placeholder mb-2">What positive things should they keep doing?</p>
                                        <Textarea
                                            placeholder="Example: Very detail-oriented in design work..."
                                            value={formData.feedback_continue}
                                            onChange={(e) => setFormData({ ...formData, feedback_continue: e.target.value })}
                                            className="min-h-[80px]"
                                        />
                                    </Card>

                                    <Card>
                                        <Label className="font-semibold mb-1 block">START (Opportunity)</Label>
                                        <p className="text-xs text-content-subtle dark:text-content-placeholder mb-2">What new things should they start doing?</p>
                                        <Textarea
                                            placeholder="Example: Start learning Framer for prototyping..."
                                            value={formData.feedback_start}
                                            onChange={(e) => setFormData({ ...formData, feedback_start: e.target.value })}
                                            className="min-h-[80px]"
                                        />
                                    </Card>

                                    <Card>
                                        <Label className="font-semibold mb-1 block">STOP (Blocker)</Label>
                                        <p className="text-xs text-content-subtle dark:text-content-placeholder mb-2">What habits should they stop?</p>
                                        <Textarea
                                            placeholder="Example: Stop delaying status updates on Trello..."
                                            value={formData.feedback_stop}
                                            onChange={(e) => setFormData({ ...formData, feedback_stop: e.target.value })}
                                            className="min-h-[80px]"
                                        />
                                    </Card>

                                    {/* SUBMIT BUTTON */}
                                    <div className="flex justify-end pt-4">
                                        <Button
                                            onClick={handleSubmit}
                                            isLoading={loading}
                                            disabled={
                                                !step1Complete ||
                                                !step2Complete ||
                                                !step3Complete ||
                                                !step4Complete
                                            }
                                            className="min-w-[200px]"
                                        >
                                            Submit Review
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
