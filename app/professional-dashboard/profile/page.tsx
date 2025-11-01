"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Loading from "@/components/loading";

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [prof, setProf] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('studentData='));
        if (!cookie) throw new Error('Not authenticated');
        const session = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        const id = session.id;
        const res = await fetch(`/api/professionals/profile?professionalId=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success) {
          setProf(data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  if (isLoading) return <div className="p-6"><Loading message="Loading profile..." /></div>;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg shadow-lg w-full max-w-sm p-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            {prof?.portfolio ? (
              <AvatarImage src={prof.portfolio} alt={`${prof.first_name} ${prof.last_name}`} />
            ) : (
              <AvatarFallback className="bg-yellow-500 text-black font-bold">{(prof?.first_name?.[0] || 'P') + (prof?.last_name?.[0] || '')}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{prof.first_name} {prof.last_name}</h3>
            <p className="text-sm text-gray-400">{prof.designation ?? '—'} • {prof.company ?? '—'}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-300">
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="font-medium">{prof.email}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Experience</div>
            <div className="font-medium">{prof.experience ?? '—'}</div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => window.history.back()}>Close</Button>
        </div>
      </div>
    </div>
  );
}
