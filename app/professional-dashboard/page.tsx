"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Building, Briefcase, Users, Code, Star, MapPin } from "lucide-react";
import Loading from "@/components/loading";

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
  const [isLoading, setIsLoading] = useState(true);
  const [prof, setProf] = useState<ProfData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Check professionalData cookie primarily
        let cookie = document.cookie.split('; ').find(row => row.startsWith('professionalData='));

        // Fallback to studentData for legacy session support
        if (!cookie) {
          cookie = document.cookie.split('; ').find(row => row.startsWith('studentData='));
        }

        if (!cookie) throw new Error('Not authenticated');
        const session = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        const professionalId = session.id;

        const res = await fetch(`/api/professionals/profile?professionalId=${encodeURIComponent(professionalId)}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        if (data && data.success && data.data) {
          setProf(data.data);
        }
      } catch (err) {
        console.error('Error loading professional profile', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loading message="Loading dashboard..." />
      </div>
    );
  }

  if (!prof) {
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
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{prof.first_name} {prof.last_name}</h1>
        <div className="flex items-center gap-3 text-gray-400 mt-1">
          <Building className="w-4 h-4" />
          <span>{prof.company ?? '—'}</span>
          <MapPin className="w-4 h-4 ml-2" />
          <span>{prof.industry ?? '—'}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-yellow-400 text-2xl font-bold">{prof.stats?.activeProjects ?? 0}</p>
          <p className="text-gray-400">Active Projects</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-yellow-400 text-2xl font-bold">{prof.stats?.connections ?? 0}</p>
          <p className="text-gray-400">Connections</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-yellow-400 text-2xl font-bold">{prof.stats?.skillsCount ?? (prof.skills ? prof.skills.length : 0)}</p>
          <p className="text-gray-400">Skills</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-yellow-400 text-2xl font-bold">{prof.stats?.notifications ?? 0}</p>
          <p className="text-gray-400">Notifications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Designation</p>
                <p className="font-medium">{prof.designation ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Experience</p>
                <p className="font-medium">{prof.experience ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Salary</p>
                <p className="font-medium">{prof.current_salary ? `${prof.current_salary}` : '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-medium">{prof.email} {prof.phone ? `• ${prof.phone}` : ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Code className="w-4 h-4" /> Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {prof.skills && prof.skills.length > 0 ? (
                prof.skills.map((s, i) => (
                  <Badge key={i} variant="secondary">{s}</Badge>
                ))
              ) : (
                <p className="text-sm text-gray-400">No skills added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Career</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Goals</p>
                <p className="font-medium">{prof.career_goals ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Preferred Learning</p>
                <p className="font-medium">{prof.preferred_learning_style ?? '—'}</p>
              </div>
              <div className="mt-2">
                <Button variant="ghost" size="sm" onClick={() => alert('Open career path (not implemented)')}>View career path</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
