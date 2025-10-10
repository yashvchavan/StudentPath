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
  const { studentData, isLoading: isDataLoading } = useStudentData();

  useEffect(() => {
    const validateAccess = async () => {
      try {
        // Get student data from cookie
        const studentDataCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("studentData="));

        if (!studentDataCookie) {
          console.error("No studentData cookie found");
          throw new Error("No student data found");
        }

        let cookieData;
        try {
          cookieData = JSON.parse(decodeURIComponent(studentDataCookie.split("=")[1]));
          console.log("Parsed student data:", { 
            hasToken: !!cookieData.token,
            hasCollegeToken: !!cookieData.token,
            isAuthenticated: cookieData.isAuthenticated
          });
        } catch (parseError) {
          console.error("Failed to parse student data:", parseError);
          throw new Error("Invalid student data format");
        }

        if (!cookieData.isAuthenticated) {
          console.error("Student data not marked as authenticated");
          throw new Error("Not authenticated");
        }

        const token = searchParams.get("token") || cookieData.token || cookieData.collegeToken;
        if (!token) {
          console.error("No token available");
          throw new Error("No token found");
        }

        // Store the working token in the student data
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
        // Uncomment to enable redirect
        // window.location.href = "/login?error=" + encodeURIComponent(errorMessage); 
      }
    };

    validateAccess();
  }, [searchParams, router]);

  // Show loading while validating OR while fetching student data
  if (isValidating || isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isValidating ? "Validating access..." : "Loading your dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  // Only render children when both validation is complete AND student data is loaded
  return <>{children}</>;
}