"use client";

/**
 * PlanGeneratingLoader
 * Animated loading screen shown while GPT generates a career plan.
 * Shows cycling steps with a progress bar.
 */

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Brain, Target, Calendar, Zap, CheckCircle2 } from "lucide-react";

const STEPS = [
    { icon: Brain, label: "Analyzing your skill profile", color: "text-blue-400", bg: "bg-blue-400/10" },
    { icon: Target, label: "Identifying skill gaps", color: "text-orange-400", bg: "bg-orange-400/10" },
    { icon: Sparkles, label: "Curating personalized tasks", color: "text-violet-400", bg: "bg-violet-400/10" },
    { icon: Calendar, label: "Building your weekly schedule", color: "text-green-400", bg: "bg-green-400/10" },
    { icon: Zap, label: "Setting up XP milestones", color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { icon: CheckCircle2, label: "Finalizing your preparation plan", color: "text-emerald-400", bg: "bg-emerald-400/10" },
];

interface PlanGeneratingLoaderProps {
    targetName?: string;
    trackType?: "placement" | "higher-studies";
}

export default function PlanGeneratingLoader({ targetName, trackType = "placement" }: PlanGeneratingLoaderProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Cycle through steps every 2.5s
        const stepInterval = setInterval(() => {
            setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
        }, 2500);

        // Smooth progress bar
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const target = ((currentStep + 1) / STEPS.length) * 95;
                return prev < target ? Math.min(prev + 1, target) : prev;
            });
        }, 80);

        return () => {
            clearInterval(stepInterval);
            clearInterval(progressInterval);
        };
    }, [currentStep]);

    const ActiveIcon = STEPS[currentStep].icon;

    return (
        <Card className="border-primary/20 overflow-hidden">
            {/* Animated top bar */}
            <div className="h-1 bg-muted relative overflow-hidden">
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <CardContent className="p-10">
                <div className="flex flex-col items-center space-y-8">
                    {/* Pulsing icon */}
                    <div className="relative">
                        <div className={`w-20 h-20 rounded-2xl ${STEPS[currentStep].bg} flex items-center justify-center transition-all duration-500`}>
                            <ActiveIcon className={`w-10 h-10 ${STEPS[currentStep].color} transition-all duration-500`} />
                        </div>
                        {/* Ripple rings */}
                        <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-ping" />
                        <div className="absolute -inset-2 rounded-2xl border border-primary/10 animate-pulse" />
                    </div>

                    {/* Text */}
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-foreground">
                            {trackType === "higher-studies" ? "Creating Study Plan" : "Generating Prep Plan"}
                            {targetName && <span className="text-primary"> for {targetName}</span>}
                        </h3>
                        <p className="text-sm text-muted-foreground animate-pulse">
                            {STEPS[currentStep].label}...
                        </p>
                    </div>

                    {/* Step indicators */}
                    <div className="flex items-center gap-2">
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const done = idx < currentStep;
                            const active = idx === currentStep;
                            return (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-500 ${done
                                            ? "bg-green-500/20 border-green-500/50"
                                            : active
                                                ? `${step.bg} border-current ${step.color}`
                                                : "bg-muted/30 border-border"
                                        }`}
                                    title={step.label}
                                >
                                    {done ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Icon className={`w-4 h-4 ${active ? step.color : "text-muted-foreground"}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress text */}
                    <p className="text-xs text-muted-foreground">
                        Step {currentStep + 1} of {STEPS.length} — This usually takes 10–20 seconds
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
