"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AIPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the professional assistant chat page where the chat UI lives
    router.replace("/professional-dashboard/assistant");
  }, [router]);

  return null;
}
