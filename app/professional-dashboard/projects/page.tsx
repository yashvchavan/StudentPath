"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderGit2, Plus, Github, ExternalLink, Star, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Loading from "@/components/loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ProjectsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", date: "", desc: "", tech: "", repoUrl: "", liveUrl: "" });
  const [file, setFile] = useState<File | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/professionals/profile`);
      const data = await res.json();
      if (data.success && data.data.projects) {
        setProjects(typeof data.data.projects === 'string' ? JSON.parse(data.data.projects) : data.data.projects);
      } else {
        setProjects([]);
      }
    } catch {
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }
    fetchProfile();
  }, [authLoading, isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      let imageUrl = "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "projects");
        
        const uploadRes = await fetch("/api/professionals/upload-document", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.url) {
          imageUrl = uploadData.url;
        }
      }

      const newProject = {
        name: form.name,
        role: form.role,
        date: form.date,
        desc: form.desc,
        tech: form.tech.split(",").map(t => t.trim()).filter(Boolean),
        repoUrl: form.repoUrl,
        liveUrl: form.liveUrl,
        imageUrl
      };

      const updatedProjects = [...projects, newProject];
      
      const res = await fetch("/api/professionals/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId: user.id, updates: { projects: updatedProjects } })
      });
      
      if (res.ok) {
        setIsOpen(false);
        setForm({ name: "", role: "", date: "", desc: "", tech: "", repoUrl: "", liveUrl: "" });
        setFile(null);
        await fetchProfile();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return <div className="h-full bg-[#050505] flex items-center justify-center"><Loading message="Loading projects..." /></div>;
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 p-6 rounded-2xl border border-yellow-500/10 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-8 h-8 text-yellow-500" /> Projects Portfolio
          </h1>
          <p className="text-sm text-yellow-400 mt-1 font-medium">Highlight your key projects, impact, and technology stack.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-500/20 px-6">
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription className="text-gray-400">Add details to showcase your project.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Project Name *</label>
                  <Input required placeholder="E.g. StudentPath" className="bg-white/5 border-white/10" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Your Role *</label>
                  <Input required placeholder="E.g. Lead Developer" className="bg-white/5 border-white/10" value={form.role} onChange={e => setForm({...form, role: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Date/Duration</label>
                  <Input placeholder="E.g. 2023 - Present" className="bg-white/5 border-white/10" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Technologies (comma separated)</label>
                  <Input placeholder="React, Node.js, AWS" className="bg-white/5 border-white/10" value={form.tech} onChange={e => setForm({...form, tech: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Description</label>
                <Textarea placeholder="What did you build?" className="bg-white/5 border-white/10 min-h-[80px]" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Repository URL</label>
                  <Input placeholder="GitHub link" className="bg-white/5 border-white/10" value={form.repoUrl} onChange={e => setForm({...form, repoUrl: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Live URL</label>
                  <Input placeholder="Deployed link" className="bg-white/5 border-white/10" value={form.liveUrl} onChange={e => setForm({...form, liveUrl: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Project Screenshot / Image (Optional)</label>
                <Input type="file" accept="image/*" className="bg-white/5 border-white/10 cursor-pointer" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((proj, idx) => (
          <Card key={idx} className="group overflow-hidden border-white/5 bg-zinc-900/40 backdrop-blur-md hover:bg-zinc-800/80 transition-all hover:shadow-xl hover:-translate-y-1 relative">
            {proj.imageUrl && (
              <div className="h-32 w-full border-b border-white/5 overflow-hidden relative">
                <img src={proj.imageUrl} alt={proj.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
              </div>
            )}
            {!proj.imageUrl && (
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Github className="w-24 h-24 text-white" />
              </div>
            )}
            <CardHeader className="pb-3 border-b border-white/5 relative z-10">
              <CardTitle className="text-xl flex justify-between items-start">
                <div>
                  <span className="text-white font-bold">{proj.name || 'Unnamed Project'}</span>
                  <p className="text-xs text-yellow-500/80 mt-1 font-semibold">{proj.role || 'Contributor'}</p>
                </div>
                <Badge variant="outline" className="border-white/10 text-white/60">
                  {proj.date || 'Ongoing'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 flex flex-col gap-4 relative z-10">
              <p className="text-gray-300 text-sm leading-relaxed">{proj.desc || 'No description available'}</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {(proj.tech || []).map((t: string) => (
                  <Badge key={t} variant="secondary" className="bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                    {t}
                  </Badge>
                ))}
              </div>
              
              <div className="flex border-t border-white/5 pt-4 mt-2 gap-3">
                {proj.repoUrl && (
                  <Button variant="outline" size="sm" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-gray-300" onClick={() => window.open(proj.repoUrl, "_blank")}>
                    <Github className="w-4 h-4 mr-2" /> Repository
                  </Button>
                )}
                {proj.liveUrl && (
                  <Button variant="outline" size="sm" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-gray-300" onClick={() => window.open(proj.liveUrl, "_blank")}>
                    <ExternalLink className="w-4 h-4 mr-2" /> Live Demo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-2 border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center p-8 text-center hover:bg-white/5 transition-colors cursor-pointer group min-h-[250px]">
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="font-bold text-white mb-2 text-lg">Showcase Your Work</h3>
          <p className="text-sm text-gray-400 max-w-[280px]">Great projects demonstrate your skills in action. Connect GitHub to auto-sync your best work.</p>
          <Button variant="secondary" className="mt-6 bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold">
            <Github className="w-4 h-4 mr-2" /> Add Project
          </Button>
        </Card>
      </div>
    </div>
  );
}
