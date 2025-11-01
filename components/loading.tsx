"use client";

import React from "react";
import { Briefcase } from "lucide-react";

export default function Loading({ message = "Loading...", className = "" }: { message?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="relative w-28 h-28 mb-4">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 blur-md opacity-30 animate-pulse" />
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm border border-white/5">
          <div className="animate-spin-slow">
            <Briefcase className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold">{message}</p>
        <p className="text-sm text-gray-400 mt-1">Please wait a moment.</p>
      </div>
    </div>
  );
}
