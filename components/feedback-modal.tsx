"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Star,
  Send,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  MessageSquareHeart,
  Sparkles,
} from "lucide-react"

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FEATURE_OPTIONS = [
  "Dashboard & Overview",
  "Career Tracks & Plans",
  "Resume Analyzer",
  "AI Chat Assistant",
  "Course Recommendations",
  "Skills Tracker",
  "Placement Tracking",
  "Internship Module",
  "Progress Reports",
  "Settings & Profile",
]

const USAGE_OPTIONS = [
  "Daily",
  "Few times a week",
  "Weekly",
  "A few times a month",
  "Rarely",
  "First time using",
]

function StarRating({
  value,
  onChange,
  label,
  description,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  description?: string
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="space-y-1.5">
      <div>
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-0.5 transition-all duration-150 hover:scale-110"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= (hovered || value)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-xs text-muted-foreground">
            {value === 1
              ? "Poor"
              : value === 2
              ? "Fair"
              : value === 3
              ? "Good"
              : value === 4
              ? "Very Good"
              : "Excellent"}
          </span>
        )}
      </div>
    </div>
  )
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [overallRating, setOverallRating] = useState(0)
  const [easeOfUse, setEaseOfUse] = useState(0)
  const [featureUsefulness, setFeatureUsefulness] = useState(0)
  const [aiQuality, setAiQuality] = useState(0)
  const [uiDesign, setUiDesign] = useState(0)
  const [performanceRating, setPerformanceRating] = useState(0)
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)
  const [mostUseful, setMostUseful] = useState("")
  const [leastUseful, setLeastUseful] = useState("")
  const [howOften, setHowOften] = useState("")
  const [missingFeature, setMissingFeature] = useState("")
  const [improvementSuggestion, setImprovementSuggestion] = useState("")
  const [bestThing, setBestThing] = useState("")
  const [additionalComments, setAdditionalComments] = useState("")

  const resetForm = () => {
    setStep(1)
    setSubmitted(false)
    setError("")
    setOverallRating(0)
    setEaseOfUse(0)
    setFeatureUsefulness(0)
    setAiQuality(0)
    setUiDesign(0)
    setPerformanceRating(0)
    setWouldRecommend(null)
    setMostUseful("")
    setLeastUseful("")
    setHowOften("")
    setMissingFeature("")
    setImprovementSuggestion("")
    setBestThing("")
    setAdditionalComments("")
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(resetForm, 300)
  }

  const handleSubmit = async () => {
    if (overallRating === 0) {
      setError("Please rate your overall experience")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          overall_rating: overallRating,
          ease_of_use: easeOfUse || null,
          feature_usefulness: featureUsefulness || null,
          ai_quality: aiQuality || null,
          ui_design: uiDesign || null,
          performance_rating: performanceRating || null,
          would_recommend: wouldRecommend,
          most_useful_feature: mostUseful || null,
          least_useful_feature: leastUseful || null,
          missing_feature: missingFeature || null,
          improvement_suggestion: improvementSuggestion || null,
          best_thing: bestThing || null,
          how_often_use: howOften || null,
          additional_comments: additionalComments || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit")
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || "Failed to submit feedback")
    } finally {
      setSubmitting(false)
    }
  }

  const totalSteps = 3

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md border-zinc-800 bg-card text-card-foreground">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Thank You!</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Your feedback is invaluable. It helps us build a better StudentPath for everyone.
            </p>
            <Button onClick={handleClose} className="mt-2">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg border-border bg-card text-card-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MessageSquareHeart className="w-5 h-5 text-primary" />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve StudentPath — your honest feedback matters!
            <span className="block mt-1 text-xs text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-1.5 mb-2">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step 1: Ratings */}
        {step === 1 && (
          <div className="space-y-5 py-2">
            <StarRating
              label="Overall Experience *"
              description="How would you rate your overall experience with StudentPath?"
              value={overallRating}
              onChange={setOverallRating}
            />
            <StarRating
              label="Ease of Use"
              description="How easy is it to navigate and use the platform?"
              value={easeOfUse}
              onChange={setEaseOfUse}
            />
            <StarRating
              label="Feature Usefulness"
              description="How useful are the features for your career planning?"
              value={featureUsefulness}
              onChange={setFeatureUsefulness}
            />
            <StarRating
              label="AI Quality"
              description="How accurate and helpful are the AI-generated plans, resume analysis, and chat?"
              value={aiQuality}
              onChange={setAiQuality}
            />
            <StarRating
              label="UI / Design Quality"
              description="How visually appealing and well-designed is the interface?"
              value={uiDesign}
              onChange={setUiDesign}
            />
            <StarRating
              label="Performance & Speed"
              description="How fast and responsive does the platform feel?"
              value={performanceRating}
              onChange={setPerformanceRating}
            />
          </div>
        )}

        {/* Step 2: Preferences & Choices */}
        {step === 2 && (
          <div className="space-y-5 py-2">
            {/* Would recommend */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Would you recommend StudentPath to a friend or classmate?
              </Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setWouldRecommend(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    wouldRecommend === true
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Yes, definitely!
                </button>
                <button
                  type="button"
                  onClick={() => setWouldRecommend(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    wouldRecommend === false
                      ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  Not yet
                </button>
              </div>
            </div>

            {/* How often do you use */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                How often do you use StudentPath?
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {USAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHowOften(opt)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      howOften === opt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Most useful feature */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Which feature do you find most useful?
              </Label>
              <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
                {FEATURE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setMostUseful(opt)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      mostUseful === opt
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Least useful feature */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Which feature needs the most improvement?
              </Label>
              <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
                {FEATURE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLeastUseful(opt)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      leastUseful === opt
                        ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Open-ended feedback */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <Sparkles className="w-3.5 h-3.5 inline mr-1 text-primary" />
                What&apos;s the best thing about StudentPath?
              </Label>
              <Textarea
                placeholder="e.g., The AI career plans are really helpful for my placement prep..."
                value={bestThing}
                onChange={(e) => setBestThing(e.target.value)}
                className="resize-none h-20 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                What feature or improvement would you most like to see?
              </Label>
              <Textarea
                placeholder="e.g., I wish there was a mock interview feature..."
                value={missingFeature}
                onChange={(e) => setMissingFeature(e.target.value)}
                className="resize-none h-20 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                How can we make StudentPath better for you?
              </Label>
              <Textarea
                placeholder="Any specific suggestions for improvement..."
                value={improvementSuggestion}
                onChange={(e) => setImprovementSuggestion(e.target.value)}
                className="resize-none h-20 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Anything else you&apos;d like to share?
              </Label>
              <Textarea
                placeholder="Additional comments, bugs you found, or ideas..."
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                className="resize-none h-20 text-sm"
              />
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={submitting}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={() => {
                  if (step === 1 && overallRating === 0) {
                    setError("Please rate your overall experience")
                    return
                  }
                  setError("")
                  setStep(step + 1)
                }}
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
