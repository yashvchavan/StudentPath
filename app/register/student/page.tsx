"use client";

import { Suspense } from "react";
import StudentRegisterPageContent from "./student-register-content";

export default function StudentRegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentRegisterPageContent />
    </Suspense>
  );
}
