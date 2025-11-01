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
  const [form, setForm] = useState<any>({});

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
          setForm({
            firstName: data.data.first_name || '',
            lastName: data.data.last_name || '',
            email: data.data.email || '',
            phone: data.data.phone || '',
            company: data.data.company || '',
            designation: data.data.designation || '',
            linkedin: data.data.linkedin || '',
            github: data.data.github || '',
            portfolio: data.data.portfolio || '',
            skills: data.data.skills || [],
            certifications: data.data.certifications || '',
            career_goals: data.data.career_goals || '',
            preferred_learning_style: data.data.preferred_learning_style || '',
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (key: string, value: any) => setForm((s: any) => ({ ...s, [key]: value }));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      // send update request
      const res = await fetch('/api/professionals/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        alert('Profile updated');
        // reload
        window.location.reload();
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (e) {
      console.error(e);
      alert('Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-6"><Loading message="Loading profile..." /></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-28 h-28">
                {prof?.portfolio ? (
                  // treat portfolio as profile picture URL if present
                  // If it's not an image URL, AvatarImage may fail and fallback will show initials
                  <AvatarImage src={prof.portfolio} alt={`${prof.first_name} ${prof.last_name}`} />
                ) : (
                  <AvatarFallback className="bg-yellow-500 text-black font-bold">{(prof?.first_name?.[0] || 'P') + (prof?.last_name?.[0] || '')}</AvatarFallback>
                )}
              </Avatar>

              <div className="w-full">
                <Label>Profile Picture URL</Label>
                <Input value={form.portfolio} onChange={(e) => handleChange('portfolio', e.target.value)} placeholder="https://...jpg" />
                <p className="text-sm text-gray-400 mt-1">You can paste an image URL here. (Uploading is not implemented)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form className="lg:col-span-2 space-y-4" onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First name</Label>
                <Input value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
              </div>
              <div>
                <Label>Last name</Label>
                <Input value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} disabled />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
              </div>
              <div>
                <Label>Company</Label>
                <Input value={form.company} onChange={(e) => handleChange('company', e.target.value)} />
              </div>
              <div>
                <Label>Designation</Label>
                <Input value={form.designation} onChange={(e) => handleChange('designation', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Links & Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>LinkedIn</Label>
                <Input value={form.linkedin} onChange={(e) => handleChange('linkedin', e.target.value)} />
              </div>
              <div>
                <Label>GitHub</Label>
                <Input value={form.github} onChange={(e) => handleChange('github', e.target.value)} />
              </div>
              <div>
                <Label>Skills (comma separated)</Label>
                <Input value={Array.isArray(form.skills) ? form.skills.join(', ') : form.skills} onChange={(e) => handleChange('skills', e.target.value.split(',').map((s:any)=>s.trim()).filter(Boolean))} />
              </div>
              <div>
                <Label>Certifications</Label>
                <Input value={form.certifications} onChange={(e) => handleChange('certifications', e.target.value)} />
              </div>
              <div>
                <Label>Career Goals</Label>
                <Input value={form.career_goals} onChange={(e) => handleChange('career_goals', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
