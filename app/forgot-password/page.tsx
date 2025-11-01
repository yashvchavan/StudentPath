"use client"
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Mail, 
  CheckCircle,
  AlertCircle,
  Building,
  GraduationCap,
  User
} from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'student' | 'college' | 'professional'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('login_token');
    setToken(storedToken);
  }, []);


  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, userType }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Forgot password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-gray-900 to-green-900/20">
        <Card className="w-full max-w-md border-0 shadow-2xl backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Email Sent!
            </CardTitle>
            <CardDescription className="text-gray-300">
              Check your email for password reset instructions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <Mail className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-white text-sm">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  The link will expire in 15 minutes for security reasons.
                </p>
              </div>
              
              <div className="text-sm text-gray-400 space-y-2">
                <p>Didn't receive the email?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Check your spam/junk folder</li>
                  <li>• Ensure {email} is correct</li>
                  <li>• Wait a few minutes for delivery</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                  setError('');
                }}
                variant="outline"
                className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              >
                Send Another Email
              </Button>
              
              <Link 
                href={
                  userType === 'college'
                    ? '/college-login'
                    : userType === 'professional'
                    ? '/professional-login'
                    : `/login?token=${token || ''}`
                }
                className="block w-full"
              >
                <Button
                  variant="outline"
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-black via-gray-900 to-green-900/20">
      <Card className="w-full max-w-md border-0 shadow-2xl backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white mb-2">
            Forgot Password?
          </CardTitle>
          <CardDescription className="text-gray-300">
            Enter your email address and we'll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* User Type Selection */}
            <div className="space-y-3">
              <Label className="text-white font-medium">Account Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {/* Student */}
                <button
                  type="button"
                  onClick={() => setUserType('student')}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-center gap-2 ${
                    userType === 'student'
                      ? 'border-green-500 bg-green-500/20 text-white'
                      : 'border-white/20 bg-white/5 text-gray-300 hover:border-green-500/50 hover:bg-green-500/10'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-sm font-medium">Student</span>
                </button>

                {/* College */}
                <button
                  type="button"
                  onClick={() => setUserType('college')}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-center gap-2 ${
                    userType === 'college'
                      ? 'border-green-500 bg-green-500/20 text-white'
                      : 'border-white/20 bg-white/5 text-gray-300 hover:border-green-500/50 hover:bg-green-500/10'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span className="text-sm font-medium">College</span>
                </button>

                {/* Professional */}
                <button
                  type="button"
                  onClick={() => setUserType('professional')}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-center gap-2 ${
                    userType === 'professional'
                      ? 'border-green-500 bg-green-500/20 text-white'
                      : 'border-white/20 bg-white/5 text-gray-300 hover:border-green-500/50 hover:bg-green-500/10'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Professional</span>
                </button>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={
                  userType === 'college'
                    ? 'admin@college.edu'
                    : userType === 'professional'
                    ? 'pro@example.com'
                    : 'student@example.com'
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400 focus:ring-green-400/20"
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full font-semibold py-3 rounded-xl transform hover:scale-[1.02] transition-all duration-300 shadow-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Mail className="w-5 h-5 mr-2" />
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            {/* Back to Login */}
            <div className="text-center">
              <Link 
                href={
                  userType === 'college'
                    ? '/college-login'
                    : userType === 'professional'
                    ? '/professional-login'
                    : `/login?token=${token || ''}`
                }
                className="inline-flex items-center text-sm text-green-400 hover:text-green-300 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Link>
            </div>

            {/* Help Text */}
            <div className="text-center text-xs text-gray-400 space-y-1">
              <p>Having trouble? Contact support at</p>
              <p className="text-green-400">support@studentpath.edu</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
