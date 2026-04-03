"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  AlertCircle,
  Loader2,
  KeyRound,
  Mail,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  User,
  CheckCircle,
} from "lucide-react";

import { StudentRegistration } from "../student";
import { ActiveSessionBlock, useSessionBlock } from "@/components/ui/active-session-block";

// ── Types ──────────────────────────────────────────────────────────────────
interface ErpPrefillData {
  prn: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  branch: string;
  department: string;
  year: string;
  semester: string;
  division: string;
  rollNo: string;
  gender: string;
  dateOfBirth: string;
}

type RegistrationMode = 'checking' | 'prn-entry' | 'otp-entry' | 'form' | 'manual';

// ── PRN Entry Screen ───────────────────────────────────────────────────────
function PrnEntryScreen({
  collegeName,
  onSubmit,
  isLoading,
  error,
  onManualFallback,
}: {
  collegeName: string;
  onSubmit: (prn: string) => void;
  isLoading: boolean;
  error: string;
  onManualFallback: () => void;
}) {
  const [prn, setPrn] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-indigo-500/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl mb-5 shadow-2xl shadow-indigo-900/50">
            <KeyRound className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Student Registration</h1>
          <p className="text-zinc-400 text-base">
            Enter your PRN to get started
          </p>
        </div>

        {/* College Badge */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/50 rounded-full px-4 py-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-300 font-medium">{collegeName}</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="space-y-2 mb-3">
            <Label className="text-zinc-300 font-medium">PRN Number</Label>
            <p className="text-xs text-zinc-500">Your unique Permanent Registration Number assigned by the college</p>
          </div>
          <Input
            id="prn-input"
            placeholder="e.g. 22110120"
            value={prn}
            onChange={(e) => setPrn(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && prn.trim() && onSubmit(prn.trim())}
            className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500 h-12 text-base rounded-xl"
            autoFocus
            autoComplete="off"
          />

          {error && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/50 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <Button
            className="w-full mt-5 h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-base transition-all hover:shadow-xl hover:shadow-indigo-900/40"
            onClick={() => prn.trim() && onSubmit(prn.trim())}
            disabled={isLoading || !prn.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verifying PRN...
              </>
            ) : (
              <>
                Send OTP
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-center text-xs text-zinc-500 mb-3">
              PRN not found or don&apos;t know your PRN?
            </p>
            <Button
              variant="ghost"
              className="w-full text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl text-sm"
              onClick={onManualFallback}
            >
              Register Manually Instead
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── OTP Verification Screen ────────────────────────────────────────────────
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
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (!otp.trim()) return;
    setIsVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/auth/erp-verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prn, otp: otp.trim(), collegeToken }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'OTP verification failed');
      onVerified(data.studentData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/erp-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prn, collegeToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP');
      setCountdown(60);
      setCanResend(false);
      setOtp('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-indigo-500/20 rounded-full animate-pulse"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 4}s` }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl mb-5 shadow-2xl shadow-emerald-900/50">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
          <p className="text-zinc-400">We&apos;ve sent a 6-digit OTP to</p>
          <p className="text-indigo-300 font-semibold mt-1">{emailHint}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/50 rounded-full px-4 py-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-300 font-medium">{collegeName}</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="mb-1">
            <Label className="text-zinc-300 font-medium">Enter OTP</Label>
          </div>
          {/* OTP Input */}
          <Input
            id="otp-input"
            placeholder="• • • • • •"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && handleVerify()}
            className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500 h-14 text-2xl text-center tracking-[0.5rem] font-bold rounded-xl"
            maxLength={6}
            autoFocus
            inputMode="numeric"
          />
          <p className="text-xs text-zinc-500 mt-2">OTP expires in 10 minutes</p>

          {error && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/50 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <Button
            className="w-full mt-5 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-base transition-all hover:shadow-xl hover:shadow-emerald-900/50"
            onClick={handleVerify}
            disabled={isVerifying || otp.length !== 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 mr-2" />
                Verify OTP
              </>
            )}
          </Button>

          <div className="mt-5 flex items-center justify-between">
            <Button
              variant="ghost"
              className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl text-sm px-3"
              onClick={onBack}
            >
              ← Change PRN
            </Button>
            <Button
              variant="ghost"
              className="text-zinc-400 hover:text-indigo-300 hover:bg-white/5 rounded-xl text-sm px-3"
              onClick={handleResend}
              disabled={!canResend || isResending}
            >
              {isResending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              {canResend ? 'Resend OTP' : `Resend in ${countdown}s`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data Confirm Screen ────────────────────────────────────────────────────
function DataConfirmScreen({
  data,
  onContinue,
}: {
  data: ErpPrefillData;
  onContinue: () => void;
}) {
  const fields = [
    { label: 'PRN', value: data.prn },
    { label: 'Full Name', value: data.fullName },
    { label: 'Email', value: data.email },
    { label: 'Branch', value: data.branch },
    { label: 'Year', value: data.year ? `Year ${data.year}` : '' },
    { label: 'Phone', value: data.phone },
  ].filter(f => f.value);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl mb-5 shadow-2xl shadow-indigo-900/50">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Identity Verified!</h1>
          <p className="text-zinc-400">We found your records. Please confirm your details below.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">{data.fullName}</p>
              <p className="text-zinc-400 text-sm">{data.email}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {fields.map(f => (
              <div key={f.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">{f.label}</span>
                <span className="text-sm text-zinc-200 font-medium">{f.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-4 mb-6 text-sm text-indigo-300">
            <p>✨ Your basic details are pre-filled. You&apos;ll only need to set up your interests, skills, and goals.</p>
          </div>

          <Button
            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-base"
            onClick={onContinue}
          >
            Continue to Complete Profile
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function StudentRegisterPageContent() {
  const [mode, setMode] = useState<RegistrationMode>('checking');
  const [collegeToken, setCollegeToken] = useState<string | null>(null);
  const [collegeInfo, setCollegeInfo] = useState<any>(null);
  const [hasErpData, setHasErpData] = useState(false);
  const [showInvalidTokenDialog, setShowInvalidTokenDialog] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  // PRN flow state
  const [prn, setPrn] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const [prnError, setPrnError] = useState('');
  const [isPrnLoading, setIsPrnLoading] = useState(false);
  const [prefillData, setPrefillData] = useState<ErpPrefillData | null>(null);

  const { isBlocked, isLoading: sessionLoading } = useSessionBlock('student');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setShowInvalidTokenDialog(true);
      setIsValidatingToken(false);
      return;
    }
    setCollegeToken(token);
    initializePage(token);
  }, [searchParams]);

  const initializePage = async (token: string) => {
    try {
      // Validate token AND check ERP status in parallel
      const [tokenRes, erpRes] = await Promise.all([
        fetch(`/api/auth/validate-token?token=${token}`),
        fetch(`/api/admin/erp/status?token=${token}`),
      ]);

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.valid) {
        setShowInvalidTokenDialog(true);
        setIsValidatingToken(false);
        return;
      }

      setCollegeInfo(tokenData.college);

      if (erpRes.ok) {
        const erpData = await erpRes.json();
        setHasErpData(erpData.hasErpData === true);
        setMode(erpData.hasErpData ? 'prn-entry' : 'manual');
      } else {
        setMode('manual');
      }
    } catch (error) {
      console.error('Page init error:', error);
      setShowInvalidTokenDialog(true);
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Block access if logged in as another role
  if (isBlocked) {
    return <ActiveSessionBlock intendedRole="student" pageName="Student Registration" />;
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isValidatingToken || mode === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <p className="text-zinc-400">Verifying registration link...</p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto mt-3 text-indigo-400" />
        </div>
      </div>
    );
  }

  // ── Invalid Token ─────────────────────────────────────────────────────────
  if (showInvalidTokenDialog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Registration Link</h2>
          <p className="text-zinc-400 mb-6">
            This link is invalid or has expired. Contact your college administrator for a valid link.
          </p>
          <div className="space-y-3">
            <Button onClick={() => (window.location.href = '/')} className="w-full">
              Go to Homepage
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── PRN Entry ─────────────────────────────────────────────────────────────
  if (mode === 'prn-entry') {
    const handlePrnSubmit = async (enteredPrn: string) => {
      setIsPrnLoading(true);
      setPrnError('');
      try {
        const res = await fetch('/api/auth/erp-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prn: enteredPrn, collegeToken }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'PRN lookup failed');
        setPrn(enteredPrn);
        setEmailHint(data.emailHint);
        setMode('otp-entry');
      } catch (e: any) {
        setPrnError(e.message);
      } finally {
        setIsPrnLoading(false);
      }
    };

    return (
      <PrnEntryScreen
        collegeName={collegeInfo?.name || 'Your College'}
        onSubmit={handlePrnSubmit}
        isLoading={isPrnLoading}
        error={prnError}
        onManualFallback={() => setMode('manual')}
      />
    );
  }

  // ── OTP Entry ─────────────────────────────────────────────────────────────
  if (mode === 'otp-entry') {
    return (
      <OtpVerifyScreen
        emailHint={emailHint}
        prn={prn}
        collegeName={collegeInfo?.name || 'Your College'}
        collegeToken={collegeToken!}
        onVerified={(data) => {
          setPrefillData(data);
          setMode('form');
        }}
        onBack={() => {
          setPrn('');
          setEmailHint('');
          setPrnError('');
          setMode('prn-entry');
        }}
      />
    );
  }

  // ── Data Confirm → Full Form ───────────────────────────────────────────
  if (mode === 'form' && prefillData && !sessionStorage.getItem('erp_confirmed')) {
    return (
      <DataConfirmScreen
        data={prefillData}
        onContinue={() => {
          sessionStorage.setItem('erp_confirmed', '1');
          // Force re-render
          setMode('checking');
          setTimeout(() => setMode('form'), 10);
        }}
      />
    );
  }

  // ── Full Registration Form (with or without prefill) ──────────────────────
  const isErpMode = mode === 'form' && prefillData !== null;

  return (
    <div className="dark min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black dark:text-white">Student Registration</h1>
                <p className="text-black dark:text-white text-sm">
                  {collegeInfo ? `Registering for ${collegeInfo.name}` : 'Complete your registration'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isErpMode && (
                <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/40 rounded-full px-3 py-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-300 font-medium">ERP Verified</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = `/login?token=${collegeToken}`)}
                className="border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Login
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = '/')}
                className="border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* College Info Card */}
        {collegeInfo && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white">{collegeInfo.name}</h3>
                <p className="text-sm text-black/60 dark:text-white/60">
                  {isErpMode
                    ? '✅ PRN verified — your basic details are pre-filled'
                    : 'You are registering as a student for this institution'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Student Registration Form */}
        <StudentRegistration
          collegeToken={collegeToken}
          collegeInfo={collegeInfo}
          prefillData={prefillData || undefined}
        />
      </div>
    </div>
  );
}
