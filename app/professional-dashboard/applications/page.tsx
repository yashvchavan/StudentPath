"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Alias: /professional-dashboard/applications → /professional-dashboard/productivity
export default function ApplicationsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/professional-dashboard/productivity"); }, [router]);
  return null;
}
