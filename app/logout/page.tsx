"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Logging out...");

  useEffect(() => {
    async function logout() {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
        });
      } catch (err) {
        console.error("Error logging out from server:", err);
      }

      setMessage("Logout successful! Redirecting...");

      // Small delay for UX
      setTimeout(() => {
        window.location.href = '/login';
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
