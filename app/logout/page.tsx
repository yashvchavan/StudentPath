"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Logging out...");

  useEffect(() => {
    async function logout() {
      try {
        const res = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include", // send cookies
        });

        const data = await res.json();

        if (data.success) {
          setMessage("Logout successful! Redirecting...");
          setTimeout(() => router.replace("/college-login"), 1000);
        } else {
          console.error("Logout failed:", data.error);
          setMessage("Logout failed. Please try again.");
        }
      } catch (err) {
        console.error("Error logging out:", err);
        setMessage("An error occurred. Please try again.");
      }
    }

    logout();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg text-muted-foreground">{message}</p>
    </div>
  );
}
