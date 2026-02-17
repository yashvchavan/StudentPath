"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIExtractionTriggerProps {
    placementId: number;
    onSuccess?: () => void;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
}

export function AIExtractionTrigger({
    placementId,
    onSuccess,
    variant = "outline",
    size = "sm",
}: AIExtractionTriggerProps) {
    const { toast } = useToast();
    const [extracting, setExtracting] = useState(false);

    const handleExtract = async () => {
        setExtracting(true);
        try {
            const res = await fetch(`/api/career-tracks/companies/${placementId}/extract`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();

            if (data.success) {
                toast({
                    title: "AI Extraction Complete! 🎉",
                    description: (
                        <div className="space-y-1 text-sm">
                            <p>✓ Extracted {data.data.skills.length} skills</p>
                            <p>✓ Identified {data.data.rounds.length} common rounds</p>
                            <p>✓ Difficulty: {data.data.difficultyLevel}</p>
                            <p>✓ Confidence: {Math.round(data.data.confidenceScore * 100)}%</p>
                        </div>
                    ),
                });
                onSuccess?.();
            } else {
                toast({
                    title: "Extraction Failed",
                    description: data.error || "Failed to extract AI insights",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error triggering AI extraction:", error);
            toast({
                title: "Error",
                description: "Failed to trigger AI extraction",
                variant: "destructive",
            });
        } finally {
            setExtracting(false);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={variant}
                        size={size}
                        onClick={handleExtract}
                        disabled={extracting}
                        className="gap-2"
                    >
                        {extracting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Extracting...
                            </>
                        ) : (
                            <>
                                <Brain className="w-4 h-4" />
                                Extract AI Insights
                            </>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-xs">
                        Manually trigger AI extraction from student reviews
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
