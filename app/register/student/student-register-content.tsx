"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, GraduationCap, AlertCircle } from "lucide-react";
import StudentRegistration from "../student";

export default function StudentRegisterPageContent() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [collegeToken, setCollegeToken] = useState<string | null>(null);
  const [collegeInfo, setCollegeInfo] = useState<any>(null);
  const [showInvalidTokenDialog, setShowInvalidTokenDialog] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setShowInvalidTokenDialog(true);
      setIsValidatingToken(false);
      return;
    }

    setCollegeToken(token);
    validateCollegeToken(token);
  }, [searchParams]);

  const validateCollegeToken = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/validate-token?token=${token}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setCollegeInfo(data.college);
        setIsValidatingToken(false);
      } else {
        setShowInvalidTokenDialog(true);
        setIsValidatingToken(false);
      }
    } catch (error) {
      console.error("Token validation error:", error);
      setShowInvalidTokenDialog(true);
      setIsValidatingToken(false);
    }
  };

  if (isValidatingToken) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
        <span className="ml-2">Validating token...</span>
      </div>
    );
  }

  if (showInvalidTokenDialog) {
    return (
      <div className="flex items-center justify-center h-screen">
        <AlertCircle className="mr-2 text-red-500" />
        <span>Invalid or expired token</span>
      </div>
    );
  }

  return (
    <div>
      <h1>Student Registration</h1>
      <StudentRegistration collegeToken={collegeToken} collegeInfo={collegeInfo} />
    </div>
  );
}
