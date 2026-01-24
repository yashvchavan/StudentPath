"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
// Force this page to always render in dark mode; do not import ThemeToggle here.
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  GraduationCap,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  Target,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { StudentRegistration } from "../student";
import { ActiveSessionBlock, useSessionBlock } from "@/components/ui/active-session-block";

export default function StudentRegisterPageContent() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [collegeToken, setCollegeToken] = useState<string | null>(null);
  const [collegeInfo, setCollegeInfo] = useState<any>(null);
  const [showInvalidTokenDialog, setShowInvalidTokenDialog] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const { isBlocked, isLoading: sessionLoading } = useSessionBlock('student');

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

  // Block access if logged in as another role - MUST be after all hooks
  if (isBlocked) {
    return <ActiveSessionBlock intendedRole="student" pageName="Student Registration" />;
  }

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center text-black dark:text-white">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">Validating Access</h2>
            <p className="text-black dark:text-white">
              Please wait while we verify your registration link...
            </p>
            <div className="mt-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showInvalidTokenDialog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900 dark:to-orange-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center text-black dark:text-white">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">
              Invalid Registration Link
            </h2>
            <p className="text-black dark:text-white mb-6">
              The registration link you're trying to access is invalid or has
              expired. Please contact your college administrator for a valid
              registration link.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => (window.location.href = "/")}
                className="w-full"
              >
                Go to Homepage
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    // Force dark mode on this page by adding the `dark` class at the top-level.
    <div className="dark min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black dark:text-white">Student Registration</h1>
                <p className="text-black dark:text-white">
                  {collegeInfo
                    ? `Registering for ${collegeInfo.name}`
                    : "Complete your registration"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* ThemeToggle removed so the page stays forced in dark mode */}
              <Button
                variant="outline"
                onClick={() => (window.location.href = `/login?token=${collegeToken}`)}
                className="border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Login
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Back to Home
              </Button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* College Info Card */}
        {collegeInfo && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800">
            <CardContent className="p-6 text-black dark:text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-black dark:text-white">
                    {collegeInfo.name}
                  </h3>
                  <p className="text-sm text-black dark:text-white">
                    You are registering as a student for this institution
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Registration Form */}
        <StudentRegistration
          collegeToken={collegeToken}
          collegeInfo={collegeInfo}
        />
      </div>
    </div>
  );
}
