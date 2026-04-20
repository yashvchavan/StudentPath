"use client";

import { useEffect, useState, useRef, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Upload, Loader2, User, Briefcase, Link2, Award, Target, Check, X,
  Zap, Code, Github, ExternalLink, Cpu
} from "lucide-react";
import Loading from "@/components/loading";
import { useAuth } from "@/hooks/use-auth";

function SectionHeader({ icon: Icon, title, color = "text-yellow-500" }: { icon: React.ElementType; title: string; color?: string }) {
  return (
    <div className={`flex items-center gap-2 mb-5 pb-3 border-b border-white/[0.06]`}>
      <Icon className={`w-5 h-5 ${color}`} />
      <h2 className="text-[15px] font-bold text-white tracking-wide">{title}</h2>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

const INPUT_CLASS = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 transition-all h-10";

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<any>({
    firstName: '', lastName: '', email: '', phone: '',
    company: '', designation: '', linkedin: '', github: '', leetcode: '', portfolio: '',
    skills: [], certifications: '', career_goals: '', level: '', profile_picture: '',
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) { setIsLoading(false); return; }
    fetch(`/api/professionals/profile?professionalId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const d = data.data;
          const pic = d.profile_picture_base64 || '';
          const isUrl = pic.startsWith('http');
          setForm({
            firstName: d.first_name || '',
            lastName: d.last_name || '',
            email: d.email || '',
            phone: d.phone || '',
            company: d.company || '',
            designation: d.designation || '',
            linkedin: d.linkedin || '',
            github: d.github || '',
            leetcode: d.leetcode || '',
            portfolio: d.portfolio || '',
            skills: Array.isArray(d.skills) ? d.skills : (typeof d.skills === 'string' ? JSON.parse(d.skills || '[]') : []),
            certifications: d.certifications || '',
            career_goals: d.career_goals || '',
            level: d.level || '',
            profile_picture: isUrl ? pic : (pic && d.profile_picture_mime ? `data:${d.profile_picture_mime};base64,${pic}` : ''),
          });
        }
      })
      .catch(() => showToast('error', 'Failed to load profile'))
      .finally(() => setIsLoading(false));
  }, [authLoading, isAuthenticated, user]);

  const handleChange = (key: string, value: any) => {
    setForm((s: any) => ({ ...s, [key]: value }));
    setHasChanges(true);
  };

  // Skills tag management
  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || form.skills.includes(trimmed)) return;
    handleChange('skills', [...form.skills, trimmed]);
    setSkillInput('');
  };

  const removeSkill = (idx: number) => {
    handleChange('skills', form.skills.filter((_: string, i: number) => i !== idx));
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput); }
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('error', 'Max 2MB'); return; }
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const r = await fetch('/api/settings/upload-avatar', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.success) { handleChange('profile_picture', d.url); showToast('success', 'Picture uploaded!'); }
      else showToast('error', d.error || 'Upload failed');
    } catch { showToast('error', 'Upload error'); }
    finally { setIsUploading(false); }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const r = await fetch('/api/professionals/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName, lastName: form.lastName,
          phone: form.phone, company: form.company, designation: form.designation,
          linkedin: form.linkedin, github: form.github, leetcode: form.leetcode,
          portfolio: form.portfolio,
          skills: form.skills,
          certifications: form.certifications, career_goals: form.career_goals,
          level: form.level, profile_picture: form.profile_picture,
        }),
      });
      const d = await r.json();
      if (d.success) {
        showToast('success', 'Profile saved! Skills are being updated...');
        setHasChanges(false);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showToast('error', d.error || 'Save failed');
      }
    } catch { showToast('error', 'Network error'); }
    finally { setIsSaving(false); }
  };

  if (authLoading || isLoading) return (
    <div className="flex items-center justify-center h-full bg-black">
      <Loading message="Loading settings..." />
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-black p-6 custom-scrollbar relative">
      {/* Toast */}
      {toast && (
        <div className={`
          fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl
          border backdrop-blur-md text-sm font-semibold transition-all animate-in slide-in-from-top-2 duration-300
          ${toast.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
            : 'bg-red-950/90 border-red-500/50 text-red-300'}
        `}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 p-6 rounded-2xl border border-yellow-500/10 backdrop-blur-md flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <User className="w-6 h-6 text-yellow-500" />
              </div>
              Account Settings
            </h1>
            <p className="text-sm text-yellow-400/70 ml-14 mt-1">Manage your profile, links and skills</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              disabled={isSaving}
              className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSaving || isUploading || !hasChanges}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-500/25 disabled:opacity-50"
            >
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : <><Check className="w-4 h-4 mr-2" /> Save Changes</>}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
          {/* LEFT: Profile Picture */}
          <div className="space-y-6">
            <div className="bg-zinc-950 border border-white/[0.06] rounded-2xl p-6">
              <SectionHeader icon={User} title="Profile Picture" />
              <div className="flex flex-col items-center gap-5">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 rounded-full blur-md" />
                  <Avatar className="relative w-28 h-28 ring-2 ring-yellow-500/30 ring-offset-2 ring-offset-zinc-950">
                    {form.profile_picture
                      ? <AvatarImage src={form.profile_picture} alt="Profile" className="object-cover" />
                      : <AvatarFallback className="bg-gradient-to-br from-yellow-600 to-yellow-700 text-white font-black text-3xl">
                          {(form.firstName?.[0] || 'P').toUpperCase()}{(form.lastName?.[0] || '').toUpperCase()}
                        </AvatarFallback>
                    }
                  </Avatar>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/10 hover:border-yellow-500/50 hover:bg-yellow-500/5 text-gray-400 hover:text-yellow-400 transition-all text-sm font-medium"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploading ? 'Uploading…' : 'Upload Photo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => handleFileUpload(e.target.files?.[0] ?? null)}
                />
                <p className="text-[11px] text-gray-600 text-center">JPG, PNG or WEBP · max 2MB</p>
              </div>
            </div>

            {/* Experience Level */}
            <div className="bg-zinc-950 border border-white/[0.06] rounded-2xl p-6">
              <SectionHeader icon={Zap} title="Experience Level" />
              <div className="space-y-2">
                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleChange('level', lvl)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all
                      ${form.level === lvl
                        ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'
                        : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    {lvl}
                    {form.level === lvl && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Form fields */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-zinc-950 border border-white/[0.06] rounded-2xl p-6">
              <SectionHeader icon={User} title="Basic Information" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="First Name">
                  <Input value={form.firstName} onChange={e => handleChange('firstName', e.target.value)} placeholder="First name" className={INPUT_CLASS} />
                </FormField>
                <FormField label="Last Name">
                  <Input value={form.lastName} onChange={e => handleChange('lastName', e.target.value)} placeholder="Last name" className={INPUT_CLASS} />
                </FormField>
                <FormField label="Email">
                  <Input value={form.email} disabled className="bg-white/[0.02] border-white/[0.05] text-gray-500 cursor-not-allowed h-10" />
                </FormField>
                <FormField label="Phone">
                  <Input value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+1 (555) 000-0000" className={INPUT_CLASS} />
                </FormField>
                <FormField label="Current Company">
                  <Input value={form.company} onChange={e => handleChange('company', e.target.value)} placeholder="Company name" className={INPUT_CLASS} />
                </FormField>
                <FormField label="Job Title / Designation">
                  <Input value={form.designation} onChange={e => handleChange('designation', e.target.value)} placeholder="Senior Engineer, PM, etc." className={INPUT_CLASS} />
                </FormField>
              </div>
            </div>

            {/* Professional Links */}
            <div className="bg-zinc-950 border border-white/[0.06] rounded-2xl p-6">
              <SectionHeader icon={Link2} title="Professional Links" color="text-yellow-400" />
              <div className="space-y-4">
                {[
                  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username', icon: Briefcase },
                  { key: 'github',   label: 'GitHub',   placeholder: 'https://github.com/username',   icon: Github },
                  { key: 'leetcode', label: 'LeetCode', placeholder: 'https://leetcode.com/u/username', icon: Code },
                  { key: 'portfolio',label: 'Portfolio', placeholder: 'https://yoursite.com',          icon: ExternalLink },
                ].map(({ key, label, placeholder, icon: Icon }) => (
                  <FormField key={key} label={label}>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        value={form[key]}
                        onChange={e => handleChange(key, e.target.value)}
                        placeholder={placeholder}
                        className={`${INPUT_CLASS} pl-10`}
                      />
                    </div>
                  </FormField>
                ))}
              </div>
              <p className="text-[11px] text-yellow-400/60 mt-4 flex items-center gap-1.5">
                <Cpu className="w-3 h-3" /> GitHub & LeetCode URLs auto-sync your Skill Tracker when saved.
              </p>
            </div>

            {/* Skills */}
            <div className="bg-zinc-950 border border-white/[0.06] rounded-2xl p-6">
              <SectionHeader icon={Award} title="Skills" color="text-yellow-400" />
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder="Type a skill and press Enter..."
                    className={INPUT_CLASS}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addSkill(skillInput)}
                    className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 shrink-0 px-4"
                  >
                    Add
                  </Button>
                </div>

                {form.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.skills.map((skill: string, idx: number) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 px-3 py-1 text-[12px] font-semibold gap-1.5 hover:bg-yellow-500/20 transition-colors"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(idx)}
                          className="text-yellow-300/60 hover:text-red-400 transition-colors ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-gray-600 italic">No skills added. Type above to add.</p>
                )}
              </div>
            </div>

            {/* Career */}
            <div className="bg-zinc-950 border border-white/[0.06] rounded-2xl p-6">
              <SectionHeader icon={Target} title="Career & Certifications" color="text-emerald-400" />
              <div className="space-y-4">
                <FormField label="Career Goals">
                  <textarea
                    value={form.career_goals}
                    onChange={e => handleChange('career_goals', e.target.value)}
                    placeholder="Describe your career aspirations and objectives..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 transition-all resize-none"
                  />
                </FormField>
                <FormField label="Certifications">
                  <Input
                    value={form.certifications}
                    onChange={e => handleChange('certifications', e.target.value)}
                    placeholder="AWS Certified, Google Cloud Professional, etc."
                    className={INPUT_CLASS}
                  />
                </FormField>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom save bar */}
        {hasChanges && (
          <div className="sticky bottom-4 flex items-center justify-between gap-4 bg-zinc-900/95 border border-yellow-500/20 backdrop-blur-md rounded-2xl p-4 shadow-2xl shadow-yellow-500/10 animate-in slide-in-from-bottom-2">
            <p className="text-sm text-yellow-400 font-semibold">You have unsaved changes</p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={isSaving} className="border-white/10 text-gray-300 hover:bg-white/5">
                Discard
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={isSaving || isUploading} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : <><Check className="w-4 h-4 mr-2" /> Save Changes</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}