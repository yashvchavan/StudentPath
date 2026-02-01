"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStudentData } from "../contexts/StudentDataContext";
import { useAuth } from "@/hooks/use-auth";

// ...

export default function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading, role, user } = useAuth();
  const { studentData, isLoading: isDataLoading, error: dataError } = useStudentData();

  useEffect(() => {
    // If auth is loading, wait
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      // Not authenticated, redirect to login
      const loginUrl = "/login?error=" + encodeURIComponent("Please log in to access dashboard");
      router.push(loginUrl);
      return;
    }

    // Role check
    if (role !== 'student') {
      console.log(`User is ${role}, redirecting from student dashboard`);
      if (role === 'professional') {
        router.push('/professional-dashboard');
      } else if (role === 'college') {
        router.push('/admin');
      } else {
        router.push('/login');
      }
      return;
    }

    // Auth is valid and role is student
  }, [isAuthLoading, isAuthenticated, role, router]);

  // Show loading while validating OR while fetching student data
  if (isAuthLoading || isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">
            {isAuthLoading ? "Validating access..." : "Loading your dashboard..."}
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