"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Logging out...");

  useEffect(() => {
    async function logout() {
      // First, determine user type from cookie to redirect appropriately
      let userType = 'student'; // default
      try {
        const studentDataCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("studentData="));
        if (studentDataCookie) {
          const data = JSON.parse(decodeURIComponent(studentDataCookie.split("=")[1]));
          userType = data.userType || (data.student_id ? 'student' : 'professional');
        }

        const collegeDataCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("collegeData="));
        if (collegeDataCookie) {
          userType = 'college';
        }
      } catch (e) {
        console.error("Error determining user type:", e);
      }

      try {
        const res = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include", // send cookies
        });

        await res.json();
      } catch (err) {
        console.error("Error logging out from server:", err);
      }

      // Always clear cookies on client side regardless of server response
      document.cookie = "studentData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
      document.cookie = "collegeData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
      localStorage.removeItem('collegeData');
      localStorage.removeItem('login_token');

      setMessage("Logout successful! Redirecting...");

      // Redirect to appropriate login page based on user type
      const redirectUrl = userType === 'college'
        ? '/college-login'
        : (userType === 'professional' ? '/professional-login' : '/login');

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
    }

    logout();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg text-gray-300">{message}</p>
      </div>
    </div>
  );
}
