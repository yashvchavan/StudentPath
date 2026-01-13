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
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Building className="w-8 h-8 text-white" />
            </div>
            <p className="text-muted-foreground">Loading dashboard...</p>
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
      {/* College Information - Human-Centered Design */}
      <div className="mb-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <Building className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {collegeData.name}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span>Portal Active</span>
                </div>
                <span className="text-gray-400">•</span>
                <span>{collegeData.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">
          {/* Institution ID */}
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Institution ID</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">{collegeData.token}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                onClick={copyTokenOnly}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          {/* Student Registration Portal */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Student Registration Link</h3>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Share this link with students to register for your institution
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <code className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all block">
                  {`${typeof window !== 'undefined' ? window.location.origin : 'localhost:3000'}/register/student?token=${collegeData.token}`}
                </code>
              </div>

              <Button
                onClick={copyTokenToClipboard}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
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
            <div className="mt-4 flex items-start gap-2 text-xs text-indigo-700 dark:text-indigo-300">
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
        {/* Stats Overview - Human-Centered Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Total Students */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {collegeData.totalStudents || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">All-time enrollment</p>
          </div>

          {/* Active Students */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {collegeData.activeStudents || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Currently enrolled</p>
          </div>

          {/* Programs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Programs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {collegeData.programs?.length || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Available courses</p>
          </div>

          {/* This Month */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {tokenUsage.usageCount}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">New registrations</p>
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <UserPlus className="w-5 h-5" />
                Recent Student Registrations
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Latest students who registered using your token
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {recentRegistrations.length > 0 ? (
                  recentRegistrations.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {student.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{student.name || student.student_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{student.program || student.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-green-500/30 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-medium">
                        {student.date || student.created_at?.split('T')[0] || 'Recent'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No recent registrations</p>
                    <p className="text-sm mt-1">Students will appear here once they register with your token</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                <BarChart3 className="w-5 h-5" />
                Token Usage Analytics
              </CardTitle>
              <CardDescription className="text-purple-700 dark:text-purple-300">
                Track how your registration token is being used
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Token Usage</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Students registered this month</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-blue-500/30 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-bold text-lg px-4 py-1">
                    {tokenUsage.usageCount}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Remaining Usage</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Available registrations</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-green-500/30 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-bold text-lg px-4 py-1">
                    {tokenUsage.remaining}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Token Status</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current token status</p>
                    </div>
                  </div>
                  <Badge className={`${tokenUsage.isActive ? 'bg-green-500 text-white border-green-600' : 'bg-red-500 text-white border-red-600'} font-bold px-4 py-1`}>
                    {tokenUsage.isActive ? '✓ Active' : '✗ Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="border-2 border-gradient shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
              <CardTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                Quickly navigate to key management areas
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Manage Students */}
                <Button
                  variant="outline"
                  className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-blue-200 dark:border-blue-800 
          bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20
          text-blue-900 dark:text-blue-100 transition-all duration-300
          hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30
          hover:border-blue-400 hover:shadow-xl hover:scale-105 hover:-translate-y-1"
                  onClick={() => router.push('/admin/students')}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <UserPlus className="w-7 h-7 text-white" />
                  </div>
                  <span className="font-semibold text-base">Manage Students</span>
                </Button>

                {/* Manage Programs */}
                <Button
                  variant="outline"
                  className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-purple-200 dark:border-purple-800 
          bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20
          text-purple-900 dark:text-purple-100 transition-all duration-300
          hover:bg-gradient-to-br hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30
          hover:border-purple-400 hover:shadow-xl hover:scale-105 hover:-translate-y-1"
                  onClick={() => router.push('/admin/programs')}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <span className="font-semibold text-base">Manage Programs</span>
                </Button>

                {/* View Reports */}
                <Button
                  variant="outline"
                  className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-orange-200 dark:border-orange-800 
          bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20
          text-orange-900 dark:text-orange-100 transition-all duration-300
          hover:bg-gradient-to-br hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30
          hover:border-orange-400 hover:shadow-xl hover:scale-105 hover:-translate-y-1"
                  onClick={() => router.push('/admin/analytics')}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
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