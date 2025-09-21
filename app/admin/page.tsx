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

      // Fetch real data from API
      try {
        console.log('🔍 Fetching real college data from API...');
        const response = await fetch(`/api/admin/college-data?collegeId=${college.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${college.token}`
          }
        });

        if (response.ok) {
          const realData = await response.json();
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
          console.warn('⚠️ API call failed, using localStorage data only');
          // Keep using localStorage data if API fails
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
      {/* Combined College Info + Token Card */}
<Card className="mb-8 border border-green-200 dark:border-green-700 shadow-md hover:shadow-lg transition-shadow duration-300 bg-green-50 dark:bg-green-950/20">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-green-800 dark:text-green-200">
      <Building className="w-6 h-6" />
      College Information & Registration Token
    </CardTitle>
    <CardDescription className="text-green-600 dark:text-green-300 text-sm">
      Details about your college account and the student registration token
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div className="flex flex-col">
        <span className="text-xs text-green-700 dark:text-green-300 uppercase mb-1">College Name</span>
        <span className="font-medium text-green-900 dark:text-green-100">{collegeData.name}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-green-700 dark:text-green-300 uppercase mb-1">Email</span>
        <span className="font-medium text-green-900 dark:text-green-100">{collegeData.email}</span>
      </div>
      <div className="flex flex-col sm:col-span-2">
        <span className="text-xs text-green-700 dark:text-green-300 uppercase mb-1">College ID / Token</span>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-white dark:bg-green-900 border border-green-200 dark:border-green-800 px-3 py-2 rounded text-green-900 dark:text-green-100 font-mono text-sm break-all">
            {collegeData.token}
          </code>
          <Button
            size="sm"
            variant="outline"
            className="border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/20"
            onClick={copyTokenOnly}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>

    {/* Student Registration URL */}
    <div>
      <span className="text-xs text-green-700 dark:text-green-300 uppercase mb-1 block">Registration URL</span>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-white dark:bg-green-900 border border-green-200 dark:border-green-800 px-3 py-2 rounded text-green-900 dark:text-green-100 font-mono text-xs break-all">
          {`${typeof window !== 'undefined' ? window.location.origin : 'localhost:3000'}/register/student?token=${collegeData.token}`}
        </code>
        <Button
          size="sm"
          variant="outline"
          onClick={copyTokenToClipboard}
          className="border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/20"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  </CardContent>
</Card>


      {/* Main Content */}
      <div>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-bold">{collegeData.totalStudents || 0}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                  <p className="text-3xl font-bold">{collegeData.activeStudents || 0}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Programs</p>
                  <p className="text-3xl font-bold">{collegeData.programs?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Token Usage</p>
                  <p className="text-3xl font-bold">{tokenUsage.usageCount}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Registrations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Recent Student Registrations
              </CardTitle>
              <CardDescription>
                Latest students who registered using your token
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRegistrations.length > 0 ? (
                  recentRegistrations.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                      <div>
                        <p className="font-medium">{student.name || student.student_name}</p>
                        <p className="text-sm text-muted-foreground">{student.program || student.email}</p>
                      </div>
                      <Badge variant="outline" className="border-green-500/20 text-green-600 dark:text-green-400">
                        {student.date || student.created_at?.split('T')[0] || 'Recent'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent registrations</p>
                    <p className="text-sm">Students will appear here once they register with your token</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Token Usage Analytics
              </CardTitle>
              <CardDescription>
                Track how your registration token is being used
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <div>
                    <p className="font-medium">Token Usage</p>
                    <p className="text-sm text-muted-foreground">Students registered this month</p>
                  </div>
                  <Badge variant="outline" className="border-blue-500/20 text-blue-600 dark:text-blue-400">
                    {tokenUsage.usageCount} students
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <div>
                    <p className="font-medium">Remaining Usage</p>
                    <p className="text-sm text-muted-foreground">Available registrations</p>
                  </div>
                  <Badge variant="outline" className="border-green-500/20 text-green-600 dark:text-green-400">
                    {tokenUsage.remaining} remaining
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <div>
                    <p className="font-medium">Token Status</p>
                    <p className="text-sm text-muted-foreground">Current token status</p>
                  </div>
                  <Badge className={`${tokenUsage.isActive ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/20' : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                    {tokenUsage.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => router.push('/admin/students')}
                >
                  <UserPlus className="w-6 h-6" />
                  <span>Manage Students</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => router.push('/admin/programs')}
                >
                  <BookOpen className="w-6 h-6" />
                  <span>Manage Programs</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => router.push('/admin/analytics')}
                >
                  <BarChart3 className="w-6 h-6" />
                  <span>View Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}