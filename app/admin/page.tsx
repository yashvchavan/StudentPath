"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminShell from "@/components/admin-shell";
import {
  Building,
  Users,
  GraduationCap,
  Copy,
  Check,
  BarChart3,
  Settings,
  UserPlus,
  BookOpen,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CollegeData {
  id: number;
  name: string;
  email: string;
  token: string;
  totalStudents?: number;
  activeStudents?: number;
  programs?: string[];
  recentRegistrations?: any[];
}

interface TokenUsage {
  usageCount: number;
  maxUsage: number;
  remaining: number;
  isActive: boolean;
}

export default function AdminDashboard() {
  const [copied, setCopied] = useState(false);
  const [collegeData, setCollegeData] = useState<CollegeData | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    usageCount: 0,
    maxUsage: 1000,
    remaining: 1000,
    isActive: true
  });
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCollegeData();
  }, []);

  const fetchCollegeData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Helper function to get data from cookies
      const getCollegeDataFromCookies = () => {
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';');
          const collegeDataCookie = cookies.find(cookie =>
            cookie.trim().startsWith('collegeData=')
          );

          if (collegeDataCookie) {
            try {
              const cookieValue = collegeDataCookie.split('=')[1];
              return JSON.parse(decodeURIComponent(cookieValue));
            } catch (error) {
              console.error('Error parsing cookie:', error);
            }
          }
        }
        return null;
      };

      // Try localStorage first, then cookies
      let storedCollegeData = localStorage.getItem('collegeData');
      let college = null;

      if (storedCollegeData) {
        college = JSON.parse(storedCollegeData);
        console.log('📱 College data from localStorage:', college);
      } else {
        college = getCollegeDataFromCookies();
        console.log('🍪 College data from cookies:', college);
      }

      if (!college) {
        setError('No college data found. Please log in again.');
        router.push('/college-login');
        return;
      }
      console.log('📊 Stored college data:', college);

      // Set initial college data from localStorage
      setCollegeData({
        id: college.id,
        name: college.name,
        email: college.email,
        token: college.token,
        totalStudents: 0,
        activeStudents: 0,
        programs: [],
        recentRegistrations: []
      });

      // 🚀 PARALLEL API EXECUTION - Fetch all data simultaneously
      try {
        console.log('🔍 Fetching data in parallel from APIs...');

        const [collegeDataResponse, authResponse] = await Promise.all([
          // API 1: Fetch college statistics
          fetch(`/api/admin/college-data?collegeId=${college.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${college.token}`
            }
          }),
          // API 2: Fetch auth/me data (if needed)
          fetch('/api/auth/me', {
            credentials: 'include'
          }).catch(() => null) // Don't fail if this endpoint errors
        ]);

        // Process college data response
        if (collegeDataResponse.ok) {
          const realData = await collegeDataResponse.json();
          console.log('✅ Real college data received:', realData);

          // Update with real data
          setCollegeData(prev => ({
            ...prev!,
            totalStudents: realData.totalStudents || 0,
            activeStudents: realData.activeStudents || 0,
            programs: realData.programs || [],
            recentRegistrations: realData.recentRegistrations || []
          }));

          setTokenUsage({
            usageCount: realData.tokenUsage?.usageCount || 0,
            maxUsage: realData.tokenUsage?.maxUsage || 1000,
            remaining: realData.tokenUsage?.remaining || 1000,
            isActive: realData.tokenUsage?.isActive !== false
          });

          setRecentRegistrations(realData.recentRegistrations || []);
        } else {
          console.warn('⚠️ College data API call failed, using localStorage data only');
        }

        // Process auth response if available
        if (authResponse && authResponse.ok) {
          const authData = await authResponse.json();
          console.log('✅ Auth data received:', authData);
        }

      } catch (apiError) {
        console.warn('⚠️ API error, using localStorage data:', apiError);
        // Keep using localStorage data if API fails
      }

    } catch (error) {
      console.error('❌ Error fetching college data:', error);
      setError('Failed to load college data');
    } finally {
      setIsLoading(false);
    }
  };

  const copyTokenToClipboard = async () => {
    if (!collegeData?.token) return;

    const tokenUrl = `${window.location.origin}/register/student?token=${collegeData.token}`;
    try {
      await navigator.clipboard.writeText(tokenUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy token:', err);
    }
  };

  const copyTokenOnly = async () => {
    if (!collegeData?.token) return;

    try {
      await navigator.clipboard.writeText(collegeData.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy token:', err);
    }
  };

  if (isLoading) {
    return (
      <AdminShell title="Dashboard" description="Loading your college management system">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-blue-600/30">
              <Building className="w-8 h-8 text-white" />
            </div>
            <p className="text-zinc-400">Loading dashboard...</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  if (error || !collegeData) {
    return (
      <AdminShell title="Dashboard" description="College management system">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'No college data available. Please log in again.'}
          </AlertDescription>
        </Alert>
        <div className="text-center py-12">
          <Button onClick={() => router.push('/college-login')}>
            Go to Login
          </Button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Dashboard" description={`Welcome back, ${collegeData.name}`}>
      {/* College Information - Modern SaaS Design */}
      <div className="mb-8 bg-zinc-900/50 rounded-2xl shadow-xl border border-zinc-800/50 overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-zinc-800/50">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 flex-shrink-0">
              <Building className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                {collegeData.name}
              </h2>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>Portal Active</span>
                </div>
                <span className="text-zinc-600">•</span>
                <span>{collegeData.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">
          {/* Institution ID */}
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center border border-purple-600/30">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-0.5">Institution ID</p>
                  <p className="text-sm font-mono font-semibold text-white">{collegeData.token}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0 hover:bg-purple-600/20 text-zinc-400 hover:text-purple-400 transition-colors"
                onClick={copyTokenOnly}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Student Registration Portal */}
          <div className="bg-gradient-to-br from-blue-950/40 to-indigo-950/40 rounded-xl p-5 border border-blue-900/50">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-white">Student Registration Link</h3>
                  <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-zinc-400">
                  Share this link with students to register for your institution
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800">
                <code className="text-xs font-mono text-zinc-300 break-all block">
                  {`${typeof window !== 'undefined' ? window.location.origin : 'localhost:3000'}/register/student?token=${collegeData.token}`}
                </code>
              </div>

              <Button
                onClick={copyTokenToClipboard}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-600/30"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Registration Link
                  </>
                )}
              </Button>
            </div>

            {/* Info Note */}
            <div className="mt-4 flex items-start gap-2 text-xs text-blue-400">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Keep this link secure. Only share with authorized students who should register for your institution.</p>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div>
        {/* Stats Overview - Modern SaaS Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Total Students */}
          <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-lg hover:shadow-blue-600/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-600/30">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Total Students</p>
                <p className="text-2xl font-bold text-white">
                  {collegeData.totalStudents || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">All-time enrollment</p>
          </div>

          {/* Active Students */}
          <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-lg hover:shadow-emerald-600/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-emerald-600/20 rounded-lg flex items-center justify-center border border-emerald-600/30">
                <GraduationCap className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Active Students</p>
                <p className="text-2xl font-bold text-white">
                  {collegeData.activeStudents || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">Currently enrolled</p>
          </div>

          {/* Programs */}
          <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-lg hover:shadow-purple-600/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-purple-600/20 rounded-lg flex items-center justify-center border border-purple-600/30">
                <BookOpen className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Programs</p>
                <p className="text-2xl font-bold text-white">
                  {collegeData.programs?.length || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">Available courses</p>
          </div>

          {/* This Month */}
          <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-lg hover:shadow-emerald-600/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-emerald-600/20 rounded-lg flex items-center justify-center border border-emerald-600/30">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">This Month</p>
                <p className="text-2xl font-bold text-white">
                  {tokenUsage.usageCount}
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">New registrations</p>
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-xl border-zinc-800/50 bg-zinc-900/30 hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="border-b border-zinc-800/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-white text-lg">
                <UserPlus className="w-5 h-5" />
                Recent Student Registrations
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Latest students who registered using your token
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {recentRegistrations.length > 0 ? (
                  recentRegistrations.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-600/30">
                          {student.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="font-medium text-white">{student.name || student.student_name}</p>
                          <p className="text-sm text-zinc-400">{student.program || student.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-emerald-600/30 bg-emerald-600/20 text-emerald-400 font-medium">
                        {student.date || student.created_at?.split('T')[0] || 'Recent'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-zinc-500">
                    <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No recent registrations</p>
                    <p className="text-sm mt-1">Students will appear here once they register with your token</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-zinc-800/50 bg-zinc-900/30 hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="border-b border-zinc-800/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-white text-lg">
                <BarChart3 className="w-5 h-5" />
                Token Usage Analytics
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Track how your registration token is being used
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-950/30 rounded-lg border border-blue-900/50 hover:border-blue-800/50 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Token Usage</p>
                      <p className="text-sm text-zinc-400">Students registered this month</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-blue-600/30 bg-blue-600/20 text-blue-400 font-bold text-lg px-4 py-1">
                    {tokenUsage.usageCount}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-emerald-950/30 rounded-lg border border-emerald-900/50 hover:border-emerald-800/50 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-600/30">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Remaining Usage</p>
                      <p className="text-sm text-zinc-400">Available registrations</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-emerald-600/30 bg-emerald-600/20 text-emerald-400 font-bold text-lg px-4 py-1">
                    {tokenUsage.remaining}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-950/30 rounded-lg border border-purple-900/50 hover:border-purple-800/50 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/30">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Token Status</p>
                      <p className="text-sm text-zinc-400">Current token status</p>
                    </div>
                  </div>
                  <Badge className={`${tokenUsage.isActive ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-red-600 text-white border-red-600'} font-bold px-4 py-1`}>
                    {tokenUsage.isActive ? '✓ Active' : '✗ Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="border-zinc-800/50 bg-zinc-900/30 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-zinc-800/50 pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Quickly navigate to key management areas
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Manage Students */}
                <Button
                  variant="ghost"
                  className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-zinc-800/50 bg-black text-white transition-all duration-300 hover:bg-blue-950/30 hover:border-blue-500/70 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-105 hover:text-white focus:bg-black focus-visible:ring-0 focus-visible:ring-offset-0 active:bg-black data-[state=open]:bg-black"
                  onClick={() => router.push('/admin/students')}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                    <UserPlus className="w-7 h-7 text-white" />
                  </div>
                  <span className="font-semibold text-base">Manage Students</span>
                </Button>

                {/* Manage Programs */}
                <Button
                  variant="ghost"
                  className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-zinc-800/50 bg-black text-white transition-all duration-300 hover:bg-purple-950/30 hover:border-purple-500/70 hover:shadow-xl hover:shadow-purple-500/20 hover:scale-105 hover:text-white focus:bg-black focus-visible:ring-0 focus-visible:ring-offset-0 active:bg-black data-[state=open]:bg-black"
                  onClick={() => router.push('/admin/programs')}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/30">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <span className="font-semibold text-base">Manage Programs</span>
                </Button>

                {/* View Reports */}
                <Button
                  variant="ghost"
                  className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-zinc-800/50 bg-black text-white transition-all duration-300 hover:bg-emerald-950/30 hover:border-emerald-500/70 hover:shadow-xl hover:shadow-emerald-500/20 hover:scale-105 hover:text-white focus:bg-black focus-visible:ring-0 focus-visible:ring-offset-0 active:bg-black data-[state=open]:bg-black"
                  onClick={() => router.push('/admin/analytics')}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <span className="font-semibold text-base">View Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </AdminShell>
  );
}