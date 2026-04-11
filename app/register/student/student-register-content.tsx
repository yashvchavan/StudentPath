"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  AlertCircle,
  KeyRound,
  Mail,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  CheckCircle,
  Lock,
} from "lucide-react";

import { StudentRegistration, type ErpPrefillData } from "../student";
import { ActiveSessionBlock, useSessionBlock } from "@/components/ui/active-session-block";

type RegistrationMode = "checking" | "prn-entry" | "otp-entry" | "confirm" | "form" | "manual";

// ── PRN Entry ─────────────────────────────────────────────────────────────
function PrnEntryScreen({
  collegeName,
  collegeToken,
  onSubmit,
  isLoading,
  error,
  onManualFallback,
}: {
  collegeName: string;
  collegeToken: string | null;
  onSubmit: (prn: string) => void;
  isLoading: boolean;
  error: string;
  onManualFallback: () => void;
}) {
  const [prn, setPrn] = useState("");

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Student Registration</h1>
          <p className="text-sm text-zinc-500">
            Enter your PRN to get started with{" "}
            <span className="text-zinc-300">{collegeName}</span>
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">
                PRN / University Roll Number
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <Input
                  value={prn}
                  onChange={(e) => setPrn(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && prn.trim() && onSubmit(prn.trim())}
                  placeholder="Enter your PRN"
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-blue-500 h-11"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11"
              onClick={() => prn.trim() && onSubmit(prn.trim())}
              disabled={isLoading || !prn.trim()}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Looking up...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  Continue <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
            <button
              type="button"
              onClick={onManualFallback}
              className="w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Don't have a PRN? Register manually →
            </button>
            <div className="text-center">
              <span className="text-sm text-zinc-600">Already registered? </span>
              <a
                href={`/login${collegeToken ? `?token=${collegeToken}` : ""}`}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Sign in here
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── OTP Verify ────────────────────────────────────────────────────────────
function OtpVerifyScreen({
  emailHint,
  prn,
  collegeName,
  collegeToken,
  onVerified,
  onBack,
}: {
  emailHint: string;
  prn: string;
  collegeName: string;
  collegeToken: string;
  onVerified: (data: ErpPrefillData) => void;
  onBack: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleVerify = async () => {
    if (!otp.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/erp-verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prn, otp: otp.trim(), collegeToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      onVerified(data.studentData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/erp-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prn, collegeToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resend failed");
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Check Your Email</h1>
          <p className="text-sm text-zinc-500">
            We sent a 6-digit OTP to{" "}
            <span className="text-zinc-300 font-medium">{emailHint}</span>
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">OTP Code</Label>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="Enter 6-digit code"
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-blue-500 h-11 text-center text-lg tracking-widest"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {sent && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4" /> New OTP sent to your email.
            </div>
          )}

          <Button
            className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11"
            onClick={handleVerify}
            disabled={loading || otp.length < 4}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Verify OTP
              </span>
            )}
          </Button>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Change PRN
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              Resend OTP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data Confirm ──────────────────────────────────────────────────────────
function DataConfirmScreen({
  data,
  onContinue,
}: {
  data: ErpPrefillData;
  onContinue: () => void;
}) {
  const fields = [
    { label: "PRN",         value: data.prn },
    { label: "Name",        value: data.fullName },
    { label: "Email",       value: data.email },
    { label: "Branch",      value: data.branch || data.department },
    { label: "Year",        value: data.year ? `Year ${data.year}` : "" },
    { label: "Division",    value: data.division },
    { label: "Phone",       value: data.phone },
    { label: "College",     value: data.city ? `${data.city}, ${data.state}` : "" },
  ].filter((f) => f.value);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-4">
            <CheckCircle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Identity Verified</h1>
          <p className="text-sm text-zinc-500">
            Your ERP record was found. Confirm your details below.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="space-y-2 mb-6">
            {fields.map((f) => (
              <div key={f.label} className="flex justify-between items-center py-2 border-b border-zinc-800/60 last:border-0">
                <span className="text-xs text-zinc-600 uppercase tracking-wide">{f.label}</span>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-zinc-600" />
                  <span className="text-sm text-zinc-200 font-medium">{f.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg px-3 py-2.5 text-xs text-blue-400 mb-5">
            These details are pre-filled from your institution's ERP and cannot be edited.
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11"
            onClick={onContinue}
          >
            Continue to Registration <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────
export default function StudentRegisterPageContent() {
  const [mode, setMode] = useState<RegistrationMode>("checking");
  const [collegeToken, setCollegeToken] = useState<string | null>(null);
  const [collegeInfo, setCollegeInfo] = useState<any>(null);
  const [hasErpData, setHasErpData] = useState(false);
  const [showInvalidToken, setShowInvalidToken] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const [prn, setPrn] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [prnError, setPrnError] = useState("");
  const [isPrnLoading, setIsPrnLoading] = useState(false);
  const [prefillData, setPrefillData] = useState<ErpPrefillData | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const { isBlocked, isLoading: sessionLoading } = useSessionBlock("student");
  const searchParams = useSearchParams();
  const router = useRouter();

  // Init on mount
  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setShowInvalidToken(true);
      setInitializing(false);
      return;
    }
    setCollegeToken(token);

    Promise.all([
      fetch(`/api/auth/validate-token?token=${token}`),
      fetch(`/api/admin/erp/status?token=${token}`),
    ]).then(async ([tokenRes, erpRes]) => {
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.valid) {
        setShowInvalidToken(true);
        return;
      }
      setCollegeInfo(tokenData.college);
      if (erpRes.ok) {
        const erpData = await erpRes.json();
        setHasErpData(erpData.hasErpData === true);
        setMode(erpData.hasErpData ? "prn-entry" : "manual");
      } else {
        setMode("manual");
      }
    }).catch(() => {
      setShowInvalidToken(true);
    }).finally(() => {
      setInitializing(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isBlocked) {
    return <ActiveSessionBlock intendedRole="student" pageName="Student Registration" />;
  }

  if (sessionLoading || initializing) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Verifying registration link...</p>
        </div>
      </div>
    );
  }

  if (showInvalidToken) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-600/20 border border-red-600/30 rounded-2xl mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid Registration Link</h2>
          <p className="text-sm text-zinc-500 mb-6">
            This link is invalid or has expired. Contact your college administrator for a valid link.
          </p>
          <Button onClick={() => (window.location.href = "/")} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white">
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  // PRN Entry
  if (mode === "prn-entry") {
    const handlePrnSubmit = async (enteredPrn: string) => {
      setIsPrnLoading(true);
      setPrnError("");
      try {
        const res = await fetch("/api/auth/erp-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prn: enteredPrn, collegeToken }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "PRN lookup failed");
        setPrn(enteredPrn);
        setEmailHint(data.emailHint);
        setMode("otp-entry");
      } catch (e: any) {
        setPrnError(e.message);
      } finally {
        setIsPrnLoading(false);
      }
    };

    return (
      <PrnEntryScreen
        collegeName={collegeInfo?.name || "Your College"}
        collegeToken={collegeToken}
        onSubmit={handlePrnSubmit}
        isLoading={isPrnLoading}
        error={prnError}
        onManualFallback={() => setMode("manual")}
      />
    );
  }

  // OTP Entry
  if (mode === "otp-entry") {
    return (
      <OtpVerifyScreen
        emailHint={emailHint}
        prn={prn}
        collegeName={collegeInfo?.name || "Your College"}
        collegeToken={collegeToken!}
        onVerified={(data) => {
          setPrefillData(data);
          setMode("confirm");
        }}
        onBack={() => {
          setPrn("");
          setEmailHint("");
          setPrnError("");
          setMode("prn-entry");
        }}
      />
    );
  }

  // Data Confirm
  if (mode === "confirm" && prefillData && !confirmed) {
    return (
      <DataConfirmScreen
        data={prefillData}
        onContinue={() => {
          setConfirmed(true);
          setMode("form");
        }}
      />
    );
  }

  // Full Registration Form
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">Student Registration</h1>
              <p className="text-xs text-zinc-500">
                {collegeInfo?.name || "Complete your registration"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {prefillData && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1">
                <ShieldCheck className="w-3 h-3" /> ERP Verified
              </span>
            )}
            <a
              href={`/login${collegeToken ? `?token=${collegeToken}` : ""}`}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Sign in
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {collegeInfo && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="w-8 h-8 bg-blue-600/20 border border-blue-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{collegeInfo.name}</p>
              <p className="text-xs text-zinc-500">
                {prefillData ? "✓ Your ERP record was verified" : "Manual registration — enter your details below"}
              </p>
            </div>
          </div>
        )}

        <StudentRegistration
          collegeToken={collegeToken}
          collegeInfo={collegeInfo}
          prefillData={prefillData || undefined}
        />
      </div>
    </div>
  );
}
