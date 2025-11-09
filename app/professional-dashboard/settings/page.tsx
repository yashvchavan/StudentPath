"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Loader2, User, Briefcase, Link2, Award, Target, Check, X, Zap } from "lucide-react";
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
  const [hasChanges, setHasChanges] = useState(false);

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
            level: data.data.level || '',
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

  const handleChange = (key: string, value: any) => {
    setForm((s: any) => ({ ...s, [key]: value }));
    setHasChanges(true);
  };

  const handleFileUpload = async (file?: File | null) => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      setSuccess(null);

      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed');
        setIsUploading(false);
        return;
      }

      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File too large. Maximum size is 2MB');
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/settings/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        handleChange('profile_picture', data.url);
        setSuccess('Profile picture uploaded successfully!');
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

  const handleSubmit = async () => {
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
            ? form.skills.split(',').map((s: any) => s.trim()).filter(Boolean)
            : []),
        certifications: form.certifications,
        career_goals: form.career_goals,
        level: form.level,
        profile_picture: form.profile_picture,
      };

      console.log('📤 Submitting update:', body);

      const res = await fetch('/api/professionals/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      console.log('📥 Update response:', data);

      if (data.success) {
        setSuccess('Profile updated successfully!');
        setHasChanges(false);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(data.error || data.details || 'Update failed');
      }
    } catch (err: any) {
      console.error('❌ Update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loading message="Loading settings..." />
    </div>
  );

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with yellow accent */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500 rounded-lg shadow-lg shadow-yellow-500/50">
              <User className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-4xl font-bold text-yellow-500">
              Account Settings
            </h1>
          </div>
          <p className="text-gray-400 ml-14">Manage your profile and professional information</p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-500 animate-in slide-in-from-top duration-300">
            <X className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-yellow-500/10 border-yellow-500 animate-in slide-in-from-top duration-300">
            <Check className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-500 font-medium">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Card */}
          <Card className="bg-zinc-900 border-zinc-800 shadow-2xl shadow-yellow-500/5">
            <CardHeader className="border-b border-zinc-800 bg-gradient-to-r from-yellow-500/10 to-transparent">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <User className="w-5 h-5 text-yellow-500" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-yellow-500 rounded-full blur opacity-20"></div>
                  <Avatar className="relative w-32 h-32 ring-2 ring-yellow-500/50">
                    {form.profile_picture ? (
                      <AvatarImage
                        src={form.profile_picture}
                        alt={`${form.firstName} ${form.lastName}`}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-yellow-500 text-black font-bold text-3xl">
                        {(form.firstName?.[0] || 'P').toUpperCase()}
                        {(form.lastName?.[0] || '').toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>

                <div className="w-full">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-zinc-700 rounded-lg hover:border-yellow-500 hover:bg-yellow-500/5 transition-all duration-300">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
                          <span className="text-sm font-medium text-yellow-500">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-300">
                            Upload New Picture
                          </span>
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
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    JPG, PNG, GIF or WEBP (max 2MB)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-2xl shadow-yellow-500/5">
              <CardHeader className="border-b border-zinc-800 bg-gradient-to-r from-yellow-500/10 to-transparent">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <User className="w-5 h-5 text-yellow-500" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-300">First Name</Label>
                    <Input
                      value={form.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="bg-black border-zinc-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-300">Last Name</Label>
                    <Input
                      value={form.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="bg-black border-zinc-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-300">Email</Label>
                    <Input
                      value={form.email}
                      disabled
                      className="bg-zinc-800 border-zinc-700 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-300">Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="bg-black border-zinc-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-300">Company</Label>
                    <Input
                      value={form.company}
                      onChange={(e) => handleChange('company', e.target.value)}
                      className="bg-black border-zinc-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-300">Designation</Label>
                    <Input
                      value={form.designation}
                      onChange={(e) => handleChange('designation', e.target.value)}
                      className="bg-black border-zinc-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Enter job title"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Links Card */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-2xl shadow-yellow-500/5">
              <CardHeader className="border-b border-zinc-800 bg-gradient-to-r from-yellow-500/10 to-transparent">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Link2 className="w-5 h-5 text-yellow-500" />
                  Professional Links
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">LinkedIn Profile</Label>
                  <Input
                    value={form.linkedin}
                    onChange={(e) => handleChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="bg-black border-zinc-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">GitHub Profile</Label>
                  <Input
                    value={form.github}
                    onChange={(e) => handleChange('github', e.target.value)}
                    placeholder="https://github.com/username"
                    className="bg-black border-zinc-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">Portfolio Website</Label>
                  <Input
                    value={form.portfolio}
                    onChange={(e) => handleChange('portfolio', e.target.value)}
                    placeholder="https://yourportfolio.com"
                    className="bg-black border-zinc-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Skills & Development Card */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-2xl shadow-yellow-500/5">
              <CardHeader className="border-b border-zinc-800 bg-gradient-to-r from-yellow-500/10 to-transparent">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Briefcase className="w-5 h-5 text-yellow-500" />
                  Skills & Development
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">Skills</Label>
                  <Input
                    value={Array.isArray(form.skills) ? form.skills.join(', ') : form.skills}
                    onChange={(e) => handleChange('skills', e.target.value.split(',').map((s: any) => s.trim()).filter(Boolean))}
                    placeholder="JavaScript, Python, React, Node.js, etc."
                    className="bg-black border-zinc-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                  <p className="text-xs text-gray-500">Separate skills with commas</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    Certifications
                  </Label>
                  <Input
                    value={form.certifications}
                    onChange={(e) => handleChange('certifications', e.target.value)}
                    placeholder="AWS Certified, Google Cloud Professional, etc."
                    className="bg-black border-zinc-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Target className="w-4 h-4 text-yellow-500" />
                    Career Goals
                  </Label>
                  <Input
                    value={form.career_goals}
                    onChange={(e) => handleChange('career_goals', e.target.value)}
                    placeholder="Your career aspirations and objectives"
                    className="bg-black border-zinc-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Experience Level
                  </Label>
                  <select
                    className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-black text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    value={form.level}
                    onChange={(e) => handleChange('level', e.target.value)}
                  >
                    <option value="" className="bg-zinc-900">Select level</option>
                    <option value="Beginner" className="bg-zinc-900">Beginner - Just starting out</option>
                    <option value="Intermediate" className="bg-zinc-900">Intermediate - Some experience</option>
                    <option value="Advanced" className="bg-zinc-900">Advanced - Expert level</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.reload()}
                disabled={isSaving}
                className="w-full sm:w-auto border-zinc-700 bg-zinc-900 text-gray-300 hover:bg-zinc-800 hover:text-white transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving || isUploading || !hasChanges}
                className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-black font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}