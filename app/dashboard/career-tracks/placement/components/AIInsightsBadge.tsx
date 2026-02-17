"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Brain, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AIInsightsBadgeProps {
    extractedSkills?: string[];
    extractedRounds?: Array<{ name: string; type: string }>;
    difficultyLevel?: "Easy" | "Medium" | "Hard";
    totalRounds?: number;
    confidenceScore?: number;
    lastAIUpdate?: Date | string;
}

export function AIInsightsBadge({
    extractedSkills,
    extractedRounds,
    difficultyLevel,
    totalRounds,
    confidenceScore,
    lastAIUpdate,
}: AIInsightsBadgeProps) {
    const hasAIData = extractedSkills || extractedRounds || difficultyLevel;

    if (!hasAIData) return null;

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "Easy":
                return "bg-green-500/10 text-green-600 border-green-500/20";
            case "Medium":
                return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
            case "Hard":
                return "bg-red-500/10 text-red-600 border-red-500/20";
            default:
                return "";
        }
    };

    const getConfidenceText = (score?: number) => {
        if (!score) return "Low";
        if (score >= 0.8) return "High";
        if (score >= 0.6) return "Medium";
        return "Low";
    };

    return (
        <TooltipProvider>
            <div className="space-y-2">
                {/* AI Badge Indicator */}
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                                <Brain className="w-3 h-3 text-purple-600" />
                                <span className="text-xs font-medium text-purple-600">
                                    AI Insights
                                </span>
                                {confidenceScore && (
                                    <span className="text-[10px] text-purple-600/70">
                                        {Math.round(confidenceScore * 100)}%
                                    </span>
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">
                                Extracted from {extractedSkills?.length || 0} student reviews
                            </p>
                            {lastAIUpdate && (
                                <p className="text-xs text-muted-foreground">
                                    Updated: {new Date(lastAIUpdate).toLocaleDateString()}
                                </p>
                            )}
                        </TooltipContent>
                    </Tooltip>

                    {difficultyLevel && (
                        <Badge variant="outline" className={getDifficultyColor(difficultyLevel)}>
                            {difficultyLevel}
                        </Badge>
                    )}

                    {totalRounds && (
                        <Badge variant="outline" className="text-xs">
                            {totalRounds} Rounds
                        </Badge>
                    )}
                </div>

                {/* AI Extracted Skills */}
                {extractedSkills && extractedSkills.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI-Extracted Skills:
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {extractedSkills.slice(0, 6).map((skill) => (
                                <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="text-xs bg-purple-500/10 text-purple-700 border-purple-500/20"
                                >
                                    {skill}
                                </Badge>
                            ))}
                            {extractedSkills.length > 6 && (
                                <Badge variant="secondary" className="text-xs">
                                    +{extractedSkills.length - 6}
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* AI Extracted Rounds */}
                {extractedRounds && extractedRounds.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Common Rounds:
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {extractedRounds.slice(0, 4).map((round, idx) => (
                                <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs bg-blue-500/5 border-blue-500/20"
                                >
                                    {round.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
