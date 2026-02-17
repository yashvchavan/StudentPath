"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, Sparkles, CheckCircle2, XCircle, Brain, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EnhancedReviewFormProps {
    placementId: number;
    onSuccess: () => void;
}

export function EnhancedReviewForm({ placementId, onSuccess }: EnhancedReviewFormProps) {
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        rating: 5,
        comment: "",
        anonymous: false,
        interviewDate: "",
        offerReceived: undefined as boolean | undefined,
        salaryOffered: "",
        interviewExperience: "",
        questionsAsked: "",
        preparationTips: "",
        overallExperience: "",
        wouldRecommend: undefined as boolean | undefined,
        roundsCleared: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.comment.trim()) {
            toast({
                title: "Error",
                description: "Please provide a review comment",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/career-tracks/companies/${placementId}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    roundsCleared: formData.roundsCleared ? parseInt(formData.roundsCleared) : null,
                }),
            });

            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Success! 🎉",
                    description: "Your review has been submitted. AI is extracting insights...",
                });
                // Reset form
                setFormData({
                    rating: 5,
                    comment: "",
                    anonymous: false,
                    interviewDate: "",
                    offerReceived: undefined,
                    salaryOffered: "",
                    interviewExperience: "",
                    questionsAsked: "",
                    preparationTips: "",
                    overallExperience: "",
                    wouldRecommend: undefined,
                    roundsCleared: "",
                });
                onSuccess();
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to submit review",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            toast({
                title: "Error",
                description: "Failed to submit review",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="border-2 border-primary/10 bg-gradient-to-br from-primary/[0.02] via-transparent to-purple-500/[0.02] shadow-lg">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                            </div>
                            Share Your Interview Experience
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Help fellow students by sharing detailed insights about your interview process
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Rating */}
                    <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/10">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                            Overall Rating *
                        </Label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rating: star })}
                                    className={`${star <= formData.rating
                                        ? "text-yellow-500 scale-110"
                                        : "text-gray-300"
                                        } hover:text-yellow-600 hover:scale-125 transition-all duration-200`}
                                >
                                    <Star className="w-8 h-8 fill-current drop-shadow-sm" />
                                </button>
                            ))}
                            <span className="ml-3 text-base font-bold text-yellow-600 bg-yellow-500/10 px-3 py-1 rounded-full">
                                {formData.rating}/5
                            </span>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Interview Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="interviewDate" className="text-sm">
                                Interview Date
                            </Label>
                            <Input
                                id="interviewDate"
                                type="date"
                                value={formData.interviewDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, interviewDate: e.target.value })
                                }
                                className="bg-background"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="roundsCleared" className="text-sm">
                                Rounds Cleared
                            </Label>
                            <Input
                                id="roundsCleared"
                                type="number"
                                min="0"
                                placeholder="e.g., 3"
                                value={formData.roundsCleared}
                                onChange={(e) =>
                                    setFormData({ ...formData, roundsCleared: e.target.value })
                                }
                                className="bg-background"
                            />
                        </div>
                    </div>

                    {/* Offer Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm">Did you receive an offer?</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formData.offerReceived === true ? "default" : "outline"}
                                    size="sm"
                                    onClick={() =>
                                        setFormData({ ...formData, offerReceived: true })
                                    }
                                    className="flex-1"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Yes
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.offerReceived === false ? "default" : "outline"}
                                    size="sm"
                                    onClick={() =>
                                        setFormData({ ...formData, offerReceived: false })
                                    }
                                    className="flex-1"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    No
                                </Button>
                            </div>
                        </div>

                        {formData.offerReceived && (
                            <div className="space-y-2">
                                <Label htmlFor="salaryOffered" className="text-sm">
                                    Salary Offered (Optional)
                                </Label>
                                <Input
                                    id="salaryOffered"
                                    type="text"
                                    placeholder="e.g., 6 LPA"
                                    value={formData.salaryOffered}
                                    onChange={(e) =>
                                        setFormData({ ...formData, salaryOffered: e.target.value })
                                    }
                                    className="bg-background"
                                />
                            </div>
                        )}
                    </div>

                    <Separator className="my-4" />

                    {/* Detailed Review Sections */}
                    <div className="space-y-1 mb-4">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            Detailed Feedback
                        </h3>
                        <p className="text-xs text-muted-foreground">Share your experience to help others prepare better</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="comment" className="text-sm font-medium">
                                Overall Review *
                            </Label>
                            <Textarea
                                id="comment"
                                placeholder="Share your overall experience with the company and interview process..."
                                value={formData.comment}
                                onChange={(e) =>
                                    setFormData({ ...formData, comment: e.target.value })
                                }
                                className="min-h-[100px] bg-background"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="interviewExperience" className="text-sm">
                                Interview Experience
                            </Label>
                            <Textarea
                                id="interviewExperience"
                                placeholder="Describe the interview rounds, atmosphere, interviewer behavior, etc."
                                value={formData.interviewExperience}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        interviewExperience: e.target.value,
                                    })
                                }
                                className="min-h-[80px] bg-background"
                            />
                            <p className="text-xs text-muted-foreground">
                                e.g., "There were 3 rounds: Aptitude, Technical, HR..."
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="questionsAsked" className="text-sm">
                                Questions Asked
                            </Label>
                            <Textarea
                                id="questionsAsked"
                                placeholder="List the technical/HR questions you were asked..."
                                value={formData.questionsAsked}
                                onChange={(e) =>
                                    setFormData({ ...formData, questionsAsked: e.target.value })
                                }
                                className="min-h-[80px] bg-background"
                            />
                            <p className="text-xs text-muted-foreground">
                                e.g., "DSA questions on arrays, DBMS normalization, HR questions about strengths..."
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="preparationTips" className="text-sm">
                                Preparation Tips
                            </Label>
                            <Textarea
                                id="preparationTips"
                                placeholder="Share tips on how to prepare for this company..."
                                value={formData.preparationTips}
                                onChange={(e) =>
                                    setFormData({ ...formData, preparationTips: e.target.value })
                                }
                                className="min-h-[80px] bg-background"
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Recommendation */}
                    <div className="space-y-2">
                        <Label className="text-sm">Would you recommend this company?</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={formData.wouldRecommend === true ? "default" : "outline"}
                                size="sm"
                                onClick={() =>
                                    setFormData({ ...formData, wouldRecommend: true })
                                }
                                className="flex-1"
                            >
                                👍 Yes
                            </Button>
                            <Button
                                type="button"
                                variant={formData.wouldRecommend === false ? "default" : "outline"}
                                size="sm"
                                onClick={() =>
                                    setFormData({ ...formData, wouldRecommend: false })
                                }
                                className="flex-1"
                            >
                                👎 No
                            </Button>
                        </div>
                    </div>

                    {/* Anonymous Option */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="anonymous"
                            checked={formData.anonymous}
                            onChange={(e) =>
                                setFormData({ ...formData, anonymous: e.target.checked })
                            }
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                            Post anonymously
                        </Label>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                        size="lg"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Submitting Review...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Submit Review & Trigger AI Analysis
                            </>
                        )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-purple-500/5 p-3 rounded-lg border border-purple-500/10">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <span>AI will automatically extract skills, rounds, and difficulty from your review</span>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
