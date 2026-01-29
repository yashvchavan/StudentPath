"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AIPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the professional assistant chat page
    router.replace("/professional-dashboard/assistant");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="animate-pulse text-zinc-500">Redirecting to AI Assistant...</div>
    </div>
  );
}
