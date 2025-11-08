"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Loading from "@/components/loading";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [prof, setProf] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          // Check if profile_picture_base64 is a Cloudinary URL or actual base64
          const profilePicture = data.data.profile_picture_base64 || '';
          const isCloudinaryUrl = profilePicture.startsWith('http://') || profilePicture.startsWith('https://');
          
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
            profile_picture: isCloudinaryUrl 
              ? profilePicture 
              : (profilePicture && data.data.profile_picture_mime 
                ? `data:${data.data.profile_picture_mime};base64,${profilePicture}` 
                : ''),
          });
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (key: string, value: any) => setForm((s: any) => ({ ...s, [key]: value }));

  const handleFileUpload = async (file?: File | null) => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      setError(null);
      setSuccess(null);

      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed');
        setIsUploading(false);
        return;
      }

      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File too large. Maximum size is 2MB');
        setIsUploading(false);
        return;
      }

      // Create FormData and append the file
      const formData = new FormData();
      formData.append('avatar', file);

      // Upload to Cloudinary via API
      const res = await fetch('/api/settings/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        // Update the form with the new Cloudinary URL
        handleChange('profile_picture', data.url);
        setSuccess('Profile picture uploaded successfully!');
        
        // Auto-clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const body: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        company: form.company,
        designation: form.designation,
        linkedin: form.linkedin,
        github: form.github,
        portfolio: form.portfolio,
        skills: Array.isArray(form.skills) 
          ? form.skills 
          : (typeof form.skills === 'string' 
            ? form.skills.split(',').map((s:any)=>s.trim()).filter(Boolean) 
            : []),
        certifications: form.certifications,
        career_goals: form.career_goals,
        preferred_learning_style: form.preferred_learning_style,
        profile_picture: form.profile_picture, // Include Cloudinary URL
      };

      const res = await fetch('/api/professionals/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(data.error || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-6"><Loading message="Loading settings..." /></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 border-green-500 bg-green-50 text-green-600">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-28 h-28 ring-2 ring-offset-2 ring-primary/20">
                {form.profile_picture ? (
                  <AvatarImage 
                    src={form.profile_picture} 
                    alt={`${form.firstName} ${form.lastName}`} 
                  />
                ) : (
                  <AvatarFallback className="bg-yellow-500 text-black font-bold text-2xl">
                    {(form.firstName?.[0] || 'P').toUpperCase()}
                    {(form.lastName?.[0] || '').toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="w-full">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">Upload Picture</span>
                      </>
                    )}
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)}
                    className="hidden"
                    disabled={isUploading}
                  />
                </Label>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  JPG, PNG, GIF or WEBP (max 2MB)
                </p>
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
                <Input value={form.email} disabled className="bg-gray-100" />
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
                <Input 
                  value={form.linkedin} 
                  onChange={(e) => handleChange('linkedin', e.target.value)} 
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <Label>GitHub</Label>
                <Input 
                  value={form.github} 
                  onChange={(e) => handleChange('github', e.target.value)} 
                  placeholder="https://github.com/username"
                />
              </div>
              <div>
                <Label>Portfolio URL</Label>
                <Input 
                  value={form.portfolio} 
                  onChange={(e) => handleChange('portfolio', e.target.value)} 
                  placeholder="https://yourportfolio.com"
                />
              </div>
              <div>
                <Label>Skills (comma separated)</Label>
                <Input 
                  value={Array.isArray(form.skills) ? form.skills.join(', ') : form.skills} 
                  onChange={(e) => handleChange('skills', e.target.value.split(',').map((s:any)=>s.trim()).filter(Boolean))} 
                  placeholder="JavaScript, Python, React, etc."
                />
              </div>
              <div>
                <Label>Certifications</Label>
                <Input 
                  value={form.certifications} 
                  onChange={(e) => handleChange('certifications', e.target.value)} 
                  placeholder="AWS Certified, Google Cloud, etc."
                />
              </div>
              <div>
                <Label>Career Goals</Label>
                <Input 
                  value={form.career_goals} 
                  onChange={(e) => handleChange('career_goals', e.target.value)} 
                  placeholder="Your career aspirations"
                />
              </div>
              <div>
                <Label>Preferred Learning Style</Label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={form.preferred_learning_style}
                  onChange={(e) => handleChange('preferred_learning_style', e.target.value)}
                >
                  <option value="">Select learning style</option>
                  <option value="Visual">Visual</option>
                  <option value="Auditory">Auditory</option>
                  <option value="Reading/Writing">Reading/Writing</option>
                  <option value="Kinesthetic">Kinesthetic</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => window.location.reload()}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || isUploading}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}