"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStudentData } from "../contexts/StudentDataContext";

export default function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isValidating, setIsValidating] = useState(true);
  const { studentData, isLoading: isDataLoading, error: dataError } = useStudentData();

  useEffect(() => {
    const validateAccess = async () => {
      try {
        // Get user data from cookie
        const userDataCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("studentData="));

        if (!userDataCookie) {
          console.error("No user data cookie found");
          throw new Error("No user data found");
        }

        let cookieData;
        try {
          cookieData = JSON.parse(decodeURIComponent(userDataCookie.split("=")[1]));
          console.log("Parsed user data:", {
            hasToken: !!cookieData.token,
            hasStudentId: !!cookieData.student_id,
            userType: cookieData.userType,
            isAuthenticated: cookieData.isAuthenticated
          });
        } catch (parseError) {
          console.error("Failed to parse user data:", parseError);
          throw new Error("Invalid user data format");
        }

        if (!cookieData.isAuthenticated) {
          console.error("User not marked as authenticated");
          throw new Error("Not authenticated");
        }

        // Check userType - redirect to appropriate dashboard if not a student
        if (cookieData.userType && cookieData.userType !== 'student') {
          console.log("Non-student user detected, redirecting to appropriate dashboard");
          if (cookieData.userType === 'professional') {
            window.location.href = '/professional-dashboard';
            return;
          } else if (cookieData.userType === 'college') {
            window.location.href = '/admin';
            return;
          }
        }

        // For students, we need student_id and token
        const studentId = cookieData.student_id || cookieData.studentId;
        if (!studentId) {
          console.error("No student_id found in cookie data");
          throw new Error("Invalid student session - missing student ID");
        }

        // Get token from URL or cookie
        const token = searchParams.get("token") || cookieData.token || cookieData.collegeToken;
        if (!token) {
          console.error("No token available");
          throw new Error("No token found");
        }

        // Store the working token in the student data if different
        if (token !== cookieData.token) {
          cookieData.token = token;
          document.cookie = `studentData=${encodeURIComponent(JSON.stringify(cookieData))}; path=/; max-age=86400; SameSite=Strict`;
        }

        // Verify token is still valid with the server
        try {
          const response = await fetch(`/api/auth/validate-token?token=${encodeURIComponent(token)}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });

          // Handle server errors (like connection issues)
          if (response.status === 500) {
            console.warn("Server error during token validation, proceeding with local validation");
            if (cookieData.isAuthenticated && (cookieData.token === token || cookieData.collegeToken === token)) {
              console.log("Falling back to local token validation");
              setIsValidating(false);
              return;
            }
          }

          const data = await response.json();

          if (!response.ok || !data.valid) {
            console.error("Token validation failed:", { status: response.status, data });
            throw new Error("Token validation failed");
          }

          console.log("Access validation successful");
          setIsValidating(false);
        } catch (error) {
          // Handle network errors gracefully
          if (error instanceof TypeError && error.message.includes('fetch')) {
            console.warn("Network error during token validation, proceeding with local validation");
            if (cookieData.isAuthenticated && (cookieData.token === token || cookieData.collegeToken === token)) {
              setIsValidating(false);
              return;
            }
          }
          throw error;
        }
      } catch (error) {
        console.error("Access validation error:", error);
        const errorMessage = error instanceof Error ? error.message : "Authentication failed";
        console.log("Redirecting to login due to error:", errorMessage);
        window.location.href = "/login?error=" + encodeURIComponent(errorMessage);
      }
    };

    validateAccess();
  }, [searchParams, router]);

  // Show loading while validating OR while fetching student data
  if (isValidating || isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">
            {isValidating ? "Validating access..." : "Loading your dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error if data loading failed
  if (dataError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-400 mb-4">{dataError}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Only render children when both validation is complete AND student data is loaded
  return <>{children}</>;
}