"use client";

import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Star, MessageSquare, User, Calendar, Clock, MapPin, IndianRupee, Mail, GraduationCap, Trash2, Layers } from "lucide-react";
import type { OnCampusProgram, Company } from "@/lib/career-tracks/companies";
import { useAuth } from "@/hooks/use-auth";
import { EnhancedReviewForm } from "./EnhancedReviewForm";
import { AIExtractionTrigger } from "./AIExtractionTrigger";

interface CompanyDetailsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    company: OnCampusProgram | Company | null;
    type: "on-campus" | "off-campus";
    onRefresh?: () => void; // Callback to refresh parent data
}

interface Review {
    id: number;
    student_id: number;
    rating: number;
    comment: string;
    first_name: string;
    last_name: string;
    created_at: string;
    is_anonymous: boolean;
    current_year?: number;
    program?: string;
    email?: string;
    // Enhanced review fields
    interview_experience?: string;
    questions_asked?: string;
    preparation_tips?: string;
    offer_received?: boolean;
    salary_offered?: string;
    rounds_cleared?: number;
    would_recommend?: boolean;
}

export function CompanyDetailsSheet({ isOpen, onClose, company, type, onRefresh }: CompanyDetailsSheetProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

    const toggleReviewExpansion = (reviewId: number) => {
        setExpandedReviews(prev => {
            const newSet = new Set(prev);
            if (newSet.has(reviewId)) {
                newSet.delete(reviewId);
            } else {
                newSet.add(reviewId);
            }
            return newSet;
        });
    };

    // Fetch reviews when sheet opens
    useEffect(() => {
        if (isOpen && company?.id) {
            fetchReviews();
        }
    }, [isOpen, company?.id]);

    // Auto-trigger AI extraction when reviews reach 3 (only once)
    useEffect(() => {
        const autoTriggerAI = async () => {
            if (reviews.length >= 3 && company?.id) {
                const placementId = typeof company.id === 'string' ? parseInt(company.id) : company.id;

                // Check if AI extraction has already been done recently
                const lastUpdate = (company as any).last_ai_update;
                const shouldTrigger = !lastUpdate ||
                    (new Date().getTime() - new Date(lastUpdate).getTime()) > 24 * 60 * 60 * 1000; // 24 hours

                if (shouldTrigger) {
                    console.log(`[Auto AI] Triggering extraction for ${reviews.length} reviews`);
                    try {
                        await fetch(`/api/career-tracks/companies/${placementId}/extract`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                        });
                        onRefresh?.(); // Refresh parent to show updated data
                    } catch (error) {
                        console.error('[Auto AI] Failed:', error);
                    }
                }
            }
        };

        autoTriggerAI();
    }, [reviews.length, company?.id]);

    const fetchReviews = async () => {
        if (!company?.id) return;

        // Only fetch for on-campus (DB IDs are usually numbers, off-campus might be strings)
        // If IDs are strings like "oc-1", we need to handle that. 
        // The current DB IDs are numbers. The static data uses "oc-1".
        // If we are using real DB data, IDs are numbers.
        // Let's assume real data has numeric IDs or parser handles it.
        // In the parser/API, IDs are returned as numbers from DB.

        setLoadingReviews(true);
        try {
            const res = await fetch(`/api/career-tracks/companies/${company.id}/reviews`);
            const data = await res.json();
            if (data.success) {
                setReviews(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleDeleteReview = async (reviewId: number) => {
        if (!company?.id) return;
        if (!confirm("Are you sure you want to delete this review?")) return;

        try {
            const res = await fetch(`/api/career-tracks/companies/${company.id}/reviews?reviewId=${reviewId}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (data.success) {
                toast({ title: "Deleted", description: "Review deleted successfully" });
                setReviews(prev => prev.filter(r => r.id !== reviewId));
            } else {
                toast({ title: "Error", description: data.error || "Failed to delete review", variant: "destructive" });
            }
        } catch (error) {
            console.error("Error deleting review", error);
            toast({ title: "Error", description: "Failed to delete review", variant: "destructive" });
        }
    };

    if (!company) return null;

    // Helper to get company name safely
    const companyName = type === "on-campus"
        ? (company as OnCampusProgram).companyName
        : (company as Company).name;

    const roleTitle = type === "on-campus"
        ? (company as OnCampusProgram).roleTitle
        : (company as Company).roleType;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-3">
                        <span className="text-4xl">{company.logo}</span>
                        <div>
                            <div>{companyName}</div>
                            <div className="text-sm font-normal text-muted-foreground">{roleTitle}</div>
                        </div>
                    </SheetTitle>
                    <SheetDescription>
                        View details and read student experiences.
                    </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="reviews">Reviews & Experience</TabsTrigger>
                    </TabsList>

                    {/* ── Overview Tab ────────────────────────────────────────── */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Package */}
                        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                            <div className="p-2 bg-green-500/10 rounded-full text-green-500">
                                <IndianRupee className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Package</p>
                                <p className="text-sm font-semibold">
                                    {type === "on-campus" ? (company as OnCampusProgram).package : (company as Company).averagePackage}
                                </p>
                            </div>
                        </div>

                        {type === "on-campus" && (
                            <>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" /> Important Dates
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 border rounded-lg">
                                            <p className="text-xs text-muted-foreground">Drive Date</p>
                                            <p className="font-medium">
                                                {(company as OnCampusProgram).driveDate
                                                    ? new Date((company as OnCampusProgram).driveDate).toLocaleDateString()
                                                    : (company as OnCampusProgram).academicYear || "TBA"}
                                            </p>
                                        </div>
                                        <div className="p-3 border rounded-lg">
                                            <p className="text-xs text-muted-foreground">Register By</p>
                                            <p className="font-medium">
                                                {(company as OnCampusProgram).registrationDeadline
                                                    ? new Date((company as OnCampusProgram).registrationDeadline).toLocaleDateString()
                                                    : "TBA"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Eligibility</h4>
                                    <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                                        {(company as OnCampusProgram).eligibilityCriteria}
                                    </p>
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Required Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {company.requiredSkills.map(skill => (
                                    <Badge key={skill} variant="secondary">{skill}</Badge>
                                ))}
                            </div>
                        </div>

                        {/* Selection Process */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <Layers className="w-4 h-4 text-muted-foreground" /> Selection Process
                            </h4>
                            {(() => {
                                // Get rounds based on type
                                const rounds = type === "on-campus"
                                    ? (company as OnCampusProgram).rounds
                                    : (company as Company).interviewRounds;

                                // Deduplicate rounds based on name and type
                                const uniqueRounds = rounds?.reduce((acc: any[], round: any) => {
                                    const exists = acc.some(r =>
                                        r.name.toLowerCase() === round.name.toLowerCase() &&
                                        r.type === round.type
                                    );
                                    if (!exists) {
                                        acc.push(round);
                                    }
                                    return acc;
                                }, []);

                                return uniqueRounds && uniqueRounds.length > 0 ? (
                                    <div className="space-y-2">
                                        {uniqueRounds.map((round: any, idx: number) => (
                                            <div key={`${round.name}-${round.type}-${idx}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <span className="text-sm font-medium flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">
                                                        {idx + 1}
                                                    </span>
                                                    <span>{round.name}</span>
                                                </span>
                                                <Badge variant="outline" className="ml-auto text-xs">{round.type}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">Details not available</p>;
                            })()}
                        </div>

                    </TabsContent>

                    {/* ── Reviews Tab ─────────────────────────────────────────── */}
                    <TabsContent value="reviews" className="space-y-6">
                        {/* Enhanced Review Form */}
                        <EnhancedReviewForm
                            placementId={typeof company.id === 'string' ? parseInt(company.id) : company.id}
                            onSuccess={fetchReviews}
                        />

                        {/* AI Extraction Trigger */}
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Recent Experiences ({reviews.length})</h4>
                            <AIExtractionTrigger
                                placementId={typeof company.id === 'string' ? parseInt(company.id) : company.id}
                                onSuccess={() => {
                                    fetchReviews();
                                    onRefresh?.(); // Refresh parent to show updated AI data
                                }}
                                variant="ghost"
                                size="sm"
                            />
                        </div>

                        {/* Reviews List */}
                        <div className="space-y-4">

                            {loadingReviews ? (
                                <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>
                            ) : reviews.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">No reviews yet. Be the first to share your experience!</p>
                            ) : (
                                reviews.map((review) => (
                                    <Card key={review.id} className="overflow-hidden">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    {review.is_anonymous ? (
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-primary" />
                                                        </div>
                                                    ) : (
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <button className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                                                                    <User className="w-4 h-4 text-primary" />
                                                                </button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-72" side="right">
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                                            <User className="w-6 h-6 text-primary" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-semibold">{review.first_name} {review.last_name}</p>
                                                                            {review.current_year && (
                                                                                <p className="text-xs text-muted-foreground">Year {review.current_year}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {review.program && (
                                                                        <div className="flex items-center gap-2 text-sm">
                                                                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                                                            <span>{review.program}</span>
                                                                        </div>
                                                                    )}
                                                                    {review.email && (
                                                                        <div className="flex items-center gap-2 text-sm">
                                                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                                                            <span className="text-xs break-all">{review.email}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium leading-none">
                                                            {review.is_anonymous ? "Anonymous Student" : `${review.first_name} ${review.last_name}${review.current_year ? ` (Year ${review.current_year})` : ""}`}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-0.5 bg-yellow-500/10 px-2 py-1 rounded text-yellow-600">
                                                        <span className="text-xs font-bold">{review.rating}</span>
                                                        <Star className="w-3 h-3 fill-current" />
                                                    </div>
                                                    {user && String(user.id) === String(review.student_id) && (
                                                        <button
                                                            onClick={() => handleDeleteReview(review.id)}
                                                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                            title="Delete review"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Review Comment with Read More */}
                                            <div className="space-y-3">
                                                {/* Main Comment */}
                                                <div className="space-y-2">
                                                    <p className="text-sm text-foreground leading-relaxed">
                                                        {expandedReviews.has(review.id) || review.comment.length <= 200
                                                            ? review.comment
                                                            : `${review.comment.substring(0, 200)}...`}
                                                    </p>
                                                </div>

                                                {/* Expanded Details */}
                                                {expandedReviews.has(review.id) && (
                                                    <div className="space-y-3 pt-3 border-t">
                                                        {/* Interview Experience */}
                                                        {(review as any).interview_experience && (
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interview Experience</p>
                                                                <p className="text-sm text-foreground/90 bg-muted/30 p-3 rounded-lg">
                                                                    {(review as any).interview_experience}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Questions Asked */}
                                                        {(review as any).questions_asked && (
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Questions Asked</p>
                                                                <p className="text-sm text-foreground/90 bg-muted/30 p-3 rounded-lg whitespace-pre-wrap">
                                                                    {(review as any).questions_asked}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Preparation Tips */}
                                                        {(review as any).preparation_tips && (
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preparation Tips</p>
                                                                <p className="text-sm text-foreground/90 bg-muted/30 p-3 rounded-lg">
                                                                    {(review as any).preparation_tips}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Additional Details */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {(review as any).offer_received !== null && (
                                                                <div className="space-y-1">
                                                                    <p className="text-xs font-semibold text-muted-foreground">Offer Status</p>
                                                                    <Badge variant={(review as any).offer_received ? "default" : "secondary"}>
                                                                        {(review as any).offer_received ? "✓ Received" : "✗ Not Received"}
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                            {(review as any).salary_offered && (
                                                                <div className="space-y-1">
                                                                    <p className="text-xs font-semibold text-muted-foreground">Salary Offered</p>
                                                                    <p className="text-sm font-medium">{(review as any).salary_offered}</p>
                                                                </div>
                                                            )}
                                                            {(review as any).rounds_cleared && (
                                                                <div className="space-y-1">
                                                                    <p className="text-xs font-semibold text-muted-foreground">Rounds Cleared</p>
                                                                    <p className="text-sm font-medium">{(review as any).rounds_cleared} rounds</p>
                                                                </div>
                                                            )}
                                                            {(review as any).would_recommend !== null && (
                                                                <div className="space-y-1">
                                                                    <p className="text-xs font-semibold text-muted-foreground">Recommendation</p>
                                                                    <Badge variant={(review as any).would_recommend ? "default" : "secondary"}>
                                                                        {(review as any).would_recommend ? "👍 Yes" : "👎 No"}
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Read More Button */}
                                                {(review.comment.length > 200 || (review as any).interview_experience || (review as any).questions_asked) && (
                                                    <button
                                                        onClick={() => toggleReviewExpansion(review.id)}
                                                        className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                                                    >
                                                        {expandedReviews.has(review.id) ? (
                                                            <>Show less ↑</>
                                                        ) : (
                                                            <>Read full review ↓</>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
