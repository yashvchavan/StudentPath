"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Building2, User, Mail, Briefcase } from "lucide-react";
import { toast } from "sonner";

interface InviteData {
  email: string;
  name: string;
  designation: string | null;
  departmentName: string | null;
  collegeName: string;
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setError("No invite token provided");
      setLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(`/api/auth/accept-invite?token=${token}`);
      const data = await res.json();

      if (data.valid) {
        setInviteData(data.invite);
      } else {
        setError(data.error || "Invalid or expired invite");
      }
    } catch (err) {
      setError("Failed to validate invite");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        toast.success("Account created successfully!");
        // Redirect to admin after a short delay
        setTimeout(() => {
          router.push("/admin");
        }, 2000);
      } else {
        toast.error(data.error || "Failed to create account");
      }
    } catch (err) {
      toast.error("Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <p className="text-zinc-400">Validating invite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Invalid Invite</h2>
            <p className="text-zinc-400 text-center mb-6">{error}</p>
            <Button
              variant="outline"
              onClick={() => router.push("/college-login")}
              className="border-zinc-700"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome Aboard!</h2>
            <p className="text-zinc-400 text-center mb-2">
              Your account has been created successfully.
            </p>
            <p className="text-zinc-500 text-sm">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <CardTitle className="text-2xl text-white">Accept Invite</CardTitle>
          <CardDescription className="text-zinc-400">
            Set up your TPO account for {inviteData?.collegeName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Invite Info */}
          <div className="bg-zinc-800/50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-400">Name:</span>
              <span className="text-white font-medium">{inviteData?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-400">Email:</span>
              <span className="text-white">{inviteData?.email}</span>
            </div>
            {inviteData?.designation && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-400">Designation:</span>
                <span className="text-white">{inviteData.designation}</span>
              </div>
            )}
            {inviteData?.departmentName && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-400">Department:</span>
                <Badge variant="outline" className="border-blue-600/50 text-blue-400">
                  {inviteData.departmentName}
                </Badge>
              </div>
            )}
          </div>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                "Create Account & Login"
              )}
            </Button>
          </form>

          <p className="text-xs text-zinc-500 text-center mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
              <p className="text-zinc-400">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
