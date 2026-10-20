"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiInformationLine,
  RiStarFill,
} from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

type Colleague = {
  id: string
  full_name: string | null
  job_title: string | null
}

interface ReviewFormClientPageProps {
  cycleId: string
  colleagues: Colleague[]
}

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (val: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-label-xs text-muted-foreground">
          {value > 0 ? value + "/5" : "—"}
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 transition-all hover:scale-110 focus:outline-none ${
              star <= value ? "text-yellow-400" : "text-muted-foreground/70"
            }`}
          >
            <RiStarFill className="size-6" />
          </button>
        ))}
      </div>
    </div>
  )
}

function JustificationField({
  label,
  value,
  onChange,
  isComplete,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  isComplete: boolean
}) {
  const trimmedLength = value.trim().length

  return (
    <div className="mt-3 rounded-lg p-3">
      <div className="mb-2 flex items-center gap-2">
        <RiInformationLine className="text-muted-foreground size-4 shrink-0" />
        <div className="flex flex-1 items-center justify-between gap-3">
          <p className="text-label-xs text-muted-foreground">
            Why this rating for {label}?
          </p>
          <span
            className={`text-label-xs ${
              isComplete ? "text-success" : "text-muted-foreground"
            }`}
          >
            {trimmedLength}/10
          </span>
        </div>
      </div>
      <Textarea
        placeholder="Explain why you gave this rating..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[60px]"
      />
      <p className="text-body-xs text-muted-foreground mt-2">
        Minimum 10 non-space characters.
      </p>
    </div>
  )
}

export default function ReviewFormClientPage({
  cycleId,
  colleagues,
}: ReviewFormClientPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

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
    justification_quality: "",
    justification_reliability: "",
    justification_communication: "",
    justification_initiative: "",
    justification_leadership: "",
  })

  const hasMinJustificationLength = (value: string) => value.trim().length >= 10

  const isExtremeScore = (score: number) =>
    score > 0 && (score <= 2 || score === 5)

  const needsQualityJustification = isExtremeScore(formData.score_quality)
  const needsReliabilityJustification = isExtremeScore(
    formData.score_reliability,
  )
  const needsCommunicationJustification = isExtremeScore(
    formData.score_communication,
  )
  const needsInitiativeJustification = isExtremeScore(formData.score_initiative)
  const needsLeadershipJustification = isExtremeScore(formData.score_leadership)

  const step1Complete = formData.reviewee_id !== ""
  const step2Complete = [
    formData.score_quality,
    formData.score_reliability,
    formData.score_communication,
    formData.score_initiative,
    formData.score_leadership,
  ].every((score) => score > 0)

  const step3Complete =
    (!needsQualityJustification ||
      hasMinJustificationLength(formData.justification_quality)) &&
    (!needsReliabilityJustification ||
      hasMinJustificationLength(formData.justification_reliability)) &&
    (!needsCommunicationJustification ||
      hasMinJustificationLength(formData.justification_communication)) &&
    (!needsInitiativeJustification ||
      hasMinJustificationLength(formData.justification_initiative)) &&
    (!needsLeadershipJustification ||
      hasMinJustificationLength(formData.justification_leadership))

  const step4Complete =
    formData.feedback_start !== "" &&
    formData.feedback_continue !== "" &&
    formData.feedback_stop !== ""

  const hasAnyExtremeScore =
    needsQualityJustification ||
    needsReliabilityJustification ||
    needsCommunicationJustification ||
    needsInitiativeJustification ||
    needsLeadershipJustification

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/performance/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          cycle_id: cycleId,
        }),
      })
      const result = (await response.json().catch(() => null)) as {
        success?: boolean
        error?: string
      } | null

      if (!response.ok) {
        toast.error(result?.error || "Failed to submit review")
        return
      }

      if (result?.success) {
        toast.success("Review submitted successfully")
        router.push("/performance")
      } else {
        toast.error("Failed to submit review")
      }
    } catch {
      toast.error("Failed to submit review")
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, label: "Select Colleague", complete: step1Complete },
    { number: 2, label: "Rate Competencies", complete: step2Complete },
    {
      number: 3,
      label: "Justify Scores",
      complete: step3Complete,
      hidden: !hasAnyExtremeScore,
    },
    { number: 4, label: "Written Feedback", complete: step4Complete },
  ]

  return (
    <div className="min-h-screen">
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave review?</DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-body-sm text-muted-foreground">
              Your progress will not be saved.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExitConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => router.push("/performance")}
            >
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border-border bg-sidebar sticky top-0 z-10 border-b">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowExitConfirm(true)}
              >
                <RiArrowLeftLine className="size-4" />
              </Button>
              <span className="text-label-md text-foreground">360 Review</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <div className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-20">
              <Card className="gap-0 space-y-4 p-4">
                <div>
                  <p className="text-label-md text-foreground">
                    Review Progress
                  </p>
                  <p className="text-body-xs text-muted-foreground mt-1">
                    Complete all steps to submit
                  </p>
                </div>
                <div className="space-y-3">
                  {steps
                    .filter((s) => !s.hidden)
                    .map((step) => (
                      <div
                        key={step.number}
                        className="flex items-center gap-3"
                      >
                        {step.complete ? (
                          <div className="bg-success flex size-6 shrink-0 items-center justify-center rounded-full">
                            <RiCheckLine className="text-success size-4" />
                          </div>
                        ) : (
                          <div className="border-border flex size-6 shrink-0 items-center justify-center rounded-full border-2">
                            <span className="text-label-xs text-muted-foreground/70">
                              {step.number}
                            </span>
                          </div>
                        )}
                        <span
                          className={`text-label-sm ${
                            step.complete
                              ? "text-foreground font-medium"
                              : "text-muted-foreground/70"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-5">
            <div>
              <h1 className="text-heading-md text-foreground">
                New Feedback Review
              </h1>
              <p className="text-body-sm text-muted-foreground mt-1">
                Provide anonymous feedback for your colleague
              </p>
            </div>

            <Card className="gap-0 p-4">
              <div className="flex gap-3">
                <RiInformationLine className="text-muted-foreground mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="text-label-md text-foreground">
                    Anonymous Feedback System
                  </p>
                  <p className="text-body-xs text-muted-foreground mt-1">
                    Your feedback is anonymous and will be processed by AI to
                    maintain objectivity.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="gap-0 space-y-4 overflow-visible p-4">
              <Label htmlFor="colleague-select">
                Who do you want to review?
              </Label>
              <Select
                value={formData.reviewee_id}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, reviewee_id: val ?? "" }))
                }
              >
                <SelectTrigger
                  id="colleague-select"
                  size="sm"
                  className="mt-2 w-full"
                >
                  <SelectValue placeholder="Select a colleague..." />
                </SelectTrigger>
                <SelectContent>
                  {colleagues.map((colleague) => (
                    <SelectItem key={colleague.id} value={colleague.id}>
                      {colleague.full_name} — {colleague.job_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            {formData.reviewee_id && (
              <>
                <Card className="gap-0 space-y-4 p-4">
                  <p className="text-label-md text-foreground">
                    Rate their competencies
                  </p>
                  <div className="space-y-4">
                    <div>
                      <StarRating
                        label="Quality of Work"
                        value={formData.score_quality}
                        onChange={(v) =>
                          setFormData((prev) => ({ ...prev, score_quality: v }))
                        }
                      />
                      {needsQualityJustification && (
                        <JustificationField
                          label="Quality of Work"
                          value={formData.justification_quality}
                          isComplete={hasMinJustificationLength(
                            formData.justification_quality,
                          )}
                          onChange={(v) =>
                            setFormData((prev) => ({
                              ...prev,
                              justification_quality: v,
                            }))
                          }
                        />
                      )}
                    </div>

                    <div>
                      <StarRating
                        label="Reliability & Deadline"
                        value={formData.score_reliability}
                        onChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            score_reliability: v,
                          }))
                        }
                      />
                      {needsReliabilityJustification && (
                        <JustificationField
                          label="Reliability & Deadline"
                          value={formData.justification_reliability}
                          isComplete={hasMinJustificationLength(
                            formData.justification_reliability,
                          )}
                          onChange={(v) =>
                            setFormData((prev) => ({
                              ...prev,
                              justification_reliability: v,
                            }))
                          }
                        />
                      )}
                    </div>

                    <div>
                      <StarRating
                        label="Communication"
                        value={formData.score_communication}
                        onChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            score_communication: v,
                          }))
                        }
                      />
                      {needsCommunicationJustification && (
                        <JustificationField
                          label="Communication"
                          value={formData.justification_communication}
                          isComplete={hasMinJustificationLength(
                            formData.justification_communication,
                          )}
                          onChange={(v) =>
                            setFormData((prev) => ({
                              ...prev,
                              justification_communication: v,
                            }))
                          }
                        />
                      )}
                    </div>

                    <div>
                      <StarRating
                        label="Initiative & Growth"
                        value={formData.score_initiative}
                        onChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            score_initiative: v,
                          }))
                        }
                      />
                      {needsInitiativeJustification && (
                        <JustificationField
                          label="Initiative & Growth"
                          value={formData.justification_initiative}
                          isComplete={hasMinJustificationLength(
                            formData.justification_initiative,
                          )}
                          onChange={(v) =>
                            setFormData((prev) => ({
                              ...prev,
                              justification_initiative: v,
                            }))
                          }
                        />
                      )}
                    </div>

                    <div>
                      <StarRating
                        label="Leadership & Teamwork"
                        value={formData.score_leadership}
                        onChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            score_leadership: v,
                          }))
                        }
                      />
                      {needsLeadershipJustification && (
                        <JustificationField
                          label="Leadership & Teamwork"
                          value={formData.justification_leadership}
                          isComplete={hasMinJustificationLength(
                            formData.justification_leadership,
                          )}
                          onChange={(v) =>
                            setFormData((prev) => ({
                              ...prev,
                              justification_leadership: v,
                            }))
                          }
                        />
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="gap-0 space-y-4 p-4">
                  <div>
                    <Label htmlFor="feedback-continue">
                      CONTINUE (Strength)
                    </Label>
                    <p className="text-body-xs text-muted-foreground mt-1">
                      What positive things should they keep doing?
                    </p>
                    <Textarea
                      id="feedback-continue"
                      placeholder="Example: Very detail-oriented in design work..."
                      value={formData.feedback_continue}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          feedback_continue: e.target.value,
                        }))
                      }
                      className="mt-2 min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="feedback-start">START (Opportunity)</Label>
                    <p className="text-body-xs text-muted-foreground mt-1">
                      What new things should they start doing?
                    </p>
                    <Textarea
                      id="feedback-start"
                      placeholder="Example: Start learning Framer for prototyping..."
                      value={formData.feedback_start}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          feedback_start: e.target.value,
                        }))
                      }
                      className="mt-2 min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="feedback-stop">STOP (Blocker)</Label>
                    <p className="text-body-xs text-muted-foreground mt-1">
                      What habits should they stop?
                    </p>
                    <Textarea
                      id="feedback-stop"
                      placeholder="Example: Stop delaying status updates on Trello..."
                      value={formData.feedback_stop}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          feedback_stop: e.target.value,
                        }))
                      }
                      className="mt-2 min-h-[80px]"
                    />
                  </div>
                </Card>

                <div className="flex justify-end pt-2 pb-8">
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={
                      loading ||
                      !step1Complete ||
                      !step2Complete ||
                      !step3Complete ||
                      !step4Complete
                    }
                    className="min-w-[200px]"
                  >
                    {loading && <Spinner data-icon="inline-start" />}
                    Submit Review
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
