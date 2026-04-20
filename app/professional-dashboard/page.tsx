"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, Briefcase, Users, Code, MapPin } from "lucide-react";
import Loading from "@/components/loading";
import { useAuth } from "@/hooks/use-auth";

interface ProfData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  designation?: string;
  industry?: string;
  experience?: string;
  current_salary?: string;
  expected_salary?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  skills?: string[];
  certifications?: string;
  career_goals?: string;
  preferred_learning_style?: string;
  stats?: {
    activeProjects: number;
    connections: number;
    notifications: number;
    skillsCount: number;
  };
}

export default function DashboardPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [prof, setProf] = useState<ProfData | null>(null);
  const [appCount, setAppCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated || !user) return;

      try {
        // We can just rely on data from the /api/auth/me endpoint for basic info,
        // or fetch full profile if needed. The /api/professionals/profile endpoint
        // should be updated to use auth_session if not already. 
        // Assuming /api/professionals/profile needs refactoring or we can use the user object
        // if it contains enough info. But usually /me returns basic info.
        // Let's assume we need to fetch full profile.

        // HOWEVER, the previous implementation passed ID in query param.
        // Secure way: Endpoint reads ID from cookie.
        // Let's try fetching without ID, assuming endpoint is smart, 
        // OR pass the ID from the authenticated user object.

        const res = await fetch(`/api/professionals/profile?professionalId=${user.id}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.data) {
            setProf(data.data);
          }
        } else {
          // Fallback to user object from useAuth if API fails or isn't updated yet
          setProf({
            id: Number(user.id),
            first_name: String(user.name ?? '').split(' ')[0] || 'Professional',
            last_name: String(user.name ?? '').split(' ').slice(1).join(' ') || '',
            email: user.email,
            // defaults
          } as ProfData);
        }
      } catch (err) {
        console.error('Error loading professional profile', err);
      } finally {
        setLoadingData(false);
      }
    };

    if (!authLoading) {
      if (isAuthenticated && user) {
        fetchProfile();
        // Also fetch application count
        fetch('/api/applications')
          .then(r => r.json())
          .then(d => {
            const count = typeof d?.stats?.total === 'number'
              ? d.stats.total
              : Array.isArray(d?.data)
                ? d.data.length
                : Array.isArray(d?.applications)
                  ? d.applications.length
                  : 0;
            setAppCount(count);
          })
          .catch(() => {});
      } else {
        setLoadingData(false);
      }
    }
  }, [isAuthenticated, user, authLoading]);

  if (authLoading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loading message="Loading dashboard..." />
      </div>
    );
  }

  if (!isAuthenticated || !prof) {
    return (
      <div>
        <Card className="p-6">
          <CardTitle>Unable to load professional dashboard</CardTitle>
          <p className="text-sm text-gray-400">Please log in again or contact support.</p>
          <div className="mt-4">
            <Button onClick={() => (window.location.href = '/professional-login')}>Sign in</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-8 relative">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px] bg-gradient-to-br from-yellow-500 to-yellow-600 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-10 blur-[120px] bg-gradient-to-br from-yellow-400 to-yellow-600 pointer-events-none" />

      {/* Header Profile Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-10 -translate-y-10 rotate-12 scale-150">
          <Briefcase className="w-64 h-64 text-yellow-500" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-1 shadow-lg shrink-0">
            <div className="w-full h-full bg-zinc-950 rounded-xl flex items-center justify-center">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-yellow-500">
                {prof.first_name?.[0] || ""}{prof.last_name?.[0] || ""}
              </span>
            </div>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
              Welcome back, <span className="text-yellow-400">{prof.first_name}</span>
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-400 font-medium">
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10 shadow-sm">
                <Briefcase className="w-4 h-4 text-yellow-500" />
                {prof.designation || 'Professional'}
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10 shadow-sm">
                <Building className="w-4 h-4 text-yellow-500" />
                {prof.company ?? '—'}
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10 shadow-sm">
                <MapPin className="w-4 h-4 text-yellow-500" />
                {prof.industry ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {[
          { icon: Briefcase, label: "Active Applications", value: appCount, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
          { icon: Users, label: "Connections", value: prof.stats?.connections ?? 0, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
          { icon: Code, label: "Verified Skills", value: prof.stats?.skillsCount ?? (prof.skills?.length || 0), color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
          { icon: Building, label: "Profile Views", value: prof.stats?.notifications ?? 12, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl hover:bg-zinc-800/80 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl">
            <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 opacity-50`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.border} border`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <p className={`text-4xl font-black ${stat.color} mb-1 drop-shadow-sm`}>{stat.value}</p>
              <p className="text-gray-400 font-medium text-sm">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Profile Card */}
        <Card className="lg:col-span-1 border-white/5 bg-zinc-900/30 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-zinc-900/50">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-1.5 bg-yellow-500/10 rounded-lg"><Briefcase className="w-5 h-5 text-yellow-500" /></div>
              Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {[
              { label: "Experience", value: prof.experience, icon: Code },
              { label: "Expected Salary", value: prof.expected_salary, icon: Briefcase },
              { label: "Email", value: prof.email, icon: Users },
              { label: "Phone", value: prof.phone, icon: Building },
            ].map((detail, idx) => (
              <div key={idx} className="group flex flex-col p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <p className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wider mb-1">{detail.label}</p>
                <p className="font-medium text-gray-200">{detail.value || '—'}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Skills Card */}
        <Card className="lg:col-span-1 border-white/5 bg-zinc-900/30 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-zinc-900/50">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-1.5 bg-yellow-500/10 rounded-lg"><Code className="w-5 h-5 text-yellow-500" /></div>
              Core Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2.5">
              {prof.skills && prof.skills.length > 0 ? (
                prof.skills.map((s, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1.5 bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-400 border border-white/10 hover:border-yellow-500/30 transition-all font-medium text-sm">
                    {s}
                  </Badge>
                ))
              ) : (
                <div className="w-full text-center py-8 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">No skills added yet.</p>
                  <Button
                    variant="link"
                    className="text-yellow-400 mt-2 p-0 h-auto"
                    onClick={() => (window.location.href = '/professional-dashboard/skills')}
                  >
                    Add skills to your profile
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Career & Links Card */}
        <Card className="lg:col-span-1 border-white/5 bg-zinc-900/30 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-zinc-900/50">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-1.5 bg-yellow-500/10 rounded-lg"><Users className="w-5 h-5 text-yellow-500" /></div>
              Career Outlook
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
              <p className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wider relative z-10">Learning Preferences</p>
              <p className="font-medium text-gray-200 relative z-10">{prof.preferred_learning_style || 'Not specified'}</p>
            </div>
            
            <div className="mt-6 flex flex-col gap-3">
              <Button
                type="button"
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold shadow-lg shadow-yellow-900/20 py-6 group"
                onClick={() => router.push('/professional-dashboard/jobs')}
              >
                <Briefcase className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> Explore Opportunities
              </Button>
              <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-gray-300 py-6">
                Update Resume Profile
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
