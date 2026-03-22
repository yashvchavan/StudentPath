"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2, ArrowLeft, AlertCircle } from "lucide-react";

export default function TpoLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login-tpo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        // Store TPO data in localStorage for client-side access
        localStorage.setItem("tpoData", JSON.stringify(data.user));
        localStorage.setItem("collegeData", JSON.stringify({
          id: data.user.collegeId,
          name: data.user.collegeName,
          logo_url: data.user.logoUrl,
        }));
        router.push("/admin");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-purple-400" />
          </div>
          <CardTitle className="text-2xl text-white">TPO Login</CardTitle>
          <CardDescription className="text-zinc-400">
            Sign in to your departmental TPO account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-900/20 border-red-900/50">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@college.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <p className="text-sm text-zinc-500 text-center mb-4">
              For Central TPO / College Admin access:
            </p>
            <Link href="/college-login">
              <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to College Login
              </Button>
            </Link>
          </div>

          <p className="text-xs text-zinc-500 text-center mt-4">
            Don't have an account? Contact your Central TPO to get an invite.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
