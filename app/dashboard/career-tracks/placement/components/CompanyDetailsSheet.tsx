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
import { Star, MessageSquare, User, Calendar, Clock, MapPin, IndianRupee, Mail, GraduationCap } from "lucide-react";
import type { OnCampusProgram, Company } from "@/lib/career-tracks/companies";
import { useAuth } from "@/hooks/use-auth";

interface CompanyDetailsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    company: OnCampusProgram | Company | null;
    type: "on-campus" | "off-campus";
}

interface Review {
    id: number;
    rating: number;
    comment: string;
    first_name: string;
    last_name: string;
    created_at: string;
    is_anonymous: boolean;
    current_year?: number;
    program?: string;
    email?: string;
}

export function CompanyDetailsSheet({ isOpen, onClose, company, type }: CompanyDetailsSheetProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: "", anonymous: false });
    const [submitting, setSubmitting] = useState(false);

    // Fetch reviews when sheet opens
    useEffect(() => {
        if (isOpen && company?.id) {
            fetchReviews();
        }
    }, [isOpen, company?.id]);

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

    const handleSubmitReview = async () => {
        if (!company?.id) return;
        if (!newReview.comment.trim()) {
            toast({ title: "Error", description: "Please enter a comment", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/career-tracks/companies/${company.id}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newReview),
            });
            const data = await res.json();

            if (data.success) {
                toast({ title: "Success", description: "Review submitted successfully!" });
                setNewReview({ rating: 5, comment: "", anonymous: false });
                fetchReviews(); // Refresh list
            } else {
                toast({ title: "Error", description: data.error || "Failed to submit review", variant: "destructive" });
            }
        } catch (error) {
            console.error("Error submitting review", error);
            toast({ title: "Error", description: "Failed to submit review", variant: "destructive" });
        } finally {
            setSubmitting(false);
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

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Selection Process</h4>
                            <div className="flex flex-col gap-2">
                                {(type === "on-campus" ? (company as OnCampusProgram).rounds : (company as Company).interviewRounds).length > 0 ?
                                    (type === "on-campus" ? (company as OnCampusProgram).rounds : (company as Company).interviewRounds).map((round, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm p-2 border rounded">
                                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                                {i + 1}
                                            </span>
                                            <span>{round.name}</span>
                                            <Badge variant="outline" className="ml-auto text-xs">{round.type}</Badge>
                                        </div>
                                    )) : <p className="text-sm text-muted-foreground">Details not available</p>}
                            </div>
                        </div>

                    </TabsContent>

                    {/* ── Reviews Tab ─────────────────────────────────────────── */}
                    <TabsContent value="reviews" className="space-y-6">
                        {/* Add Review Form */}
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> Share Your Experience
                            </h4>

                            <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                            className={`${star <= newReview.rating ? "text-yellow-500" : "text-gray-300"} hover:text-yellow-600 transition-colors`}
                                        >
                                            <Star className="w-5 h-5 fill-current" />
                                        </button>
                                    ))}
                                    <span className="text-xs text-muted-foreground ml-2">Rating</span>
                                </div>

                                <Textarea
                                    placeholder="Share your interview experience, questions asked, or general feedback..."
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                    className="min-h-[100px] text-sm"
                                />

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newReview.anonymous}
                                            onChange={(e) => setNewReview(prev => ({ ...prev, anonymous: e.target.checked }))}
                                            className="rounded border-gray-300"
                                        />
                                        Post Anonymously
                                    </label>
                                    <Button size="sm" onClick={handleSubmitReview} disabled={submitting}>
                                        {submitting ? "Posting..." : "Post Review"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Reviews List */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">Recent Experiences ({reviews.length})</h4>

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
                                                <div className="flex items-center gap-0.5 bg-yellow-500/10 px-2 py-1 rounded text-yellow-600">
                                                    <span className="text-xs font-bold">{review.rating}</span>
                                                    <Star className="w-3 h-3 fill-current" />
                                                </div>
                                            </div>

                                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                                                {review.comment}
                                            </p>
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
