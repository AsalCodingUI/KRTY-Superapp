"use client"

import { submitPerformanceReview } from "@/app/(main)/performance/action"
import {
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/shared/ui"
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
      formData.justification_quality.length >= 10) &&
    (!needsReliabilityJustification ||
      formData.justification_reliability.length >= 10) &&
    (!needsCommunicationJustification ||
      formData.justification_communication.length >= 10) &&
    (!needsInitiativeJustification ||
      formData.justification_initiative.length >= 10) &&
    (!needsLeadershipJustification ||
      formData.justification_leadership.length >= 10)

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
      const result = await submitPerformanceReview({
        ...formData,
        cycle_id: cycleId,
      })
      if (result.success) {
        toast.success("Review submitted successfully")
        router.push("/performance")
      } else {
        toast.error(result.message)
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

  const StarRating = ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: number
    onChange: (val: number) => void
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-label-xs text-foreground-secondary">
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
              star <= value ? "text-yellow-400" : "text-foreground-tertiary"
            }`}
          >
            <RiStarFill className="size-6" />
          </button>
        ))}
      </div>
    </div>
  )

  const JustificationField = ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: string
    onChange: (val: string) => void
  }) => (
    <div className="bg-surface-neutral-secondary mt-3 rounded-lg p-3">
      <div className="mb-2 flex items-center gap-2">
        <RiInformationLine className="text-foreground-secondary size-4 shrink-0" />
        <p className="text-label-xs text-foreground-secondary">
          Why this rating for {label}?
        </p>
      </div>
      <Textarea
        placeholder="Explain why you gave this rating..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[60px]"
      />
    </div>
  )

  return (
    <div className="bg-surface min-h-screen">
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave review?</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody>
            <p className="text-body-sm text-foreground-secondary">
              Your progress will not be saved.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowExitConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => router.push("/performance")}
            >
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border-neutral-primary bg-surface sticky top-0 z-10 border-b">
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
              <span className="text-label-md text-foreground-primary">
                360 Review
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <div className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-20">
              <Card className="space-y-4">
                <div>
                  <p className="text-label-md text-foreground-primary">
                    Review Progress
                  </p>
                  <p className="text-body-xs text-foreground-secondary mt-1">
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
                          <div className="bg-surface-success flex size-6 shrink-0 items-center justify-center rounded-full">
                            <RiCheckLine className="text-foreground-success size-4" />
                          </div>
                        ) : (
                          <div className="border-neutral-primary flex size-6 shrink-0 items-center justify-center rounded-full border-2">
                            <span className="text-label-xs text-foreground-tertiary">
                              {step.number}
                            </span>
                          </div>
                        )}
                        <span
                          className={`text-label-sm ${
                            step.complete
                              ? "text-foreground-primary font-medium"
                              : "text-foreground-tertiary"
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
              <h1 className="text-heading-md text-foreground-primary">
                New Feedback Review
              </h1>
              <p className="text-body-sm text-foreground-secondary mt-1">
                Provide anonymous feedback for your colleague
              </p>
            </div>

            <Card>
              <div className="flex gap-3">
                <RiInformationLine className="text-foreground-secondary mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="text-label-md text-foreground-primary">
                    Anonymous Feedback System
                  </p>
                  <p className="text-body-xs text-foreground-secondary mt-1">
                    Your feedback is anonymous and will be processed by AI to
                    maintain objectivity.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="space-y-4 overflow-visible">
              <Label htmlFor="colleague-select">
                Who do you want to review?
              </Label>
              <Select
                value={formData.reviewee_id}
                onValueChange={(val) =>
                  setFormData({ ...formData, reviewee_id: val })
                }
              >
                <SelectTrigger id="colleague-select" className="mt-2 w-full">
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
                <Card className="space-y-4">
                  <p className="text-label-md text-foreground-primary">
                    Rate their competencies
                  </p>
                  <div className="space-y-4">
                    <div>
                      <StarRating
                        label="Quality of Work"
                        value={formData.score_quality}
                        onChange={(v) =>
                          setFormData({ ...formData, score_quality: v })
                        }
                      />
                      {needsQualityJustification && (
                        <JustificationField
                          label="Quality of Work"
                          value={formData.justification_quality}
                          onChange={(v) =>
                            setFormData({
                              ...formData,
                              justification_quality: v,
                            })
                          }
                        />
                      )}
                    </div>

                    <div>
                      <StarRating
                        label="Reliability & Deadline"
                        value={formData.score_reliability}
                        onChange={(v) =>
                          setFormData({ ...formData, score_reliability: v })
                        }
                      />
                      {needsReliabilityJustification && (
                        <JustificationField
                          label="Reliability & Deadline"
                          value={formData.justification_reliability}
                          onChange={(v) =>
                            setFormData({
                              ...formData,
                              justification_reliability: v,
                            })
                          }
                        />
                      )}
                    </div>

                    <div>
                      <StarRating
                        label="Communication"
                        value={formData.score_communication}
                        onChange={(v) =>
                          setFormData({ ...formData, score_communication: v })
                        }
                      />
                      {needsCommunicationJustification && (
                        <JustificationField
                          label="Communication"
                          value={formData.justification_communication}
                          onChange={(v) =>
                            setFormData({
                              ...formData,
                              justification_communication: v,
                            })
                          }
                        />
                      )}
                    </div>

                    <div>
                      <StarRating
                        label="Initiative & Growth"
                        value={formData.score_initiative}
                        onChange={(v) =>
                          setFormData({ ...formData, score_initiative: v })
                        }
                      />
                      {needsInitiativeJustification && (
                        <JustificationField
                          label="Initiative & Growth"
                          value={formData.justification_initiative}
                          onChange={(v) =>
                            setFormData({
                              ...formData,
                              justification_initiative: v,
                            })
                          }
                        />
                      )}
                    </div>

                    <div>
                      <StarRating
                        label="Leadership & Teamwork"
                        value={formData.score_leadership}
                        onChange={(v) =>
                          setFormData({ ...formData, score_leadership: v })
                        }
                      />
                      {needsLeadershipJustification && (
                        <JustificationField
                          label="Leadership & Teamwork"
                          value={formData.justification_leadership}
                          onChange={(v) =>
                            setFormData({
                              ...formData,
                              justification_leadership: v,
                            })
                          }
                        />
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="space-y-4">
                  <div>
                    <Label htmlFor="feedback-continue">
                      CONTINUE (Strength)
                    </Label>
                    <p className="text-body-xs text-foreground-secondary mt-1">
                      What positive things should they keep doing?
                    </p>
                    <Textarea
                      id="feedback-continue"
                      placeholder="Example: Very detail-oriented in design work..."
                      value={formData.feedback_continue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          feedback_continue: e.target.value,
                        })
                      }
                      className="mt-2 min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="feedback-start">START (Opportunity)</Label>
                    <p className="text-body-xs text-foreground-secondary mt-1">
                      What new things should they start doing?
                    </p>
                    <Textarea
                      id="feedback-start"
                      placeholder="Example: Start learning Framer for prototyping..."
                      value={formData.feedback_start}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          feedback_start: e.target.value,
                        })
                      }
                      className="mt-2 min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="feedback-stop">STOP (Blocker)</Label>
                    <p className="text-body-xs text-foreground-secondary mt-1">
                      What habits should they stop?
                    </p>
                    <Textarea
                      id="feedback-stop"
                      placeholder="Example: Stop delaying status updates on Trello..."
                      value={formData.feedback_stop}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          feedback_stop: e.target.value,
                        })
                      }
                      className="mt-2 min-h-[80px]"
                    />
                  </div>
                </Card>

                <div className="flex justify-end pt-2 pb-8">
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
  )
}
