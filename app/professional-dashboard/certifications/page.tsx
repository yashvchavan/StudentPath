"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileBadge, Plus, ShieldCheck, Award, TrendingUp, ExternalLink, Loader2 } from "lucide-react";
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

export default function CertificationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [certs, setCerts] = useState<{ title: string; issuer?: string; date?: string; verified: boolean; url?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", issuer: "", date: "" });
  const [file, setFile] = useState<File | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/professionals/profile`);
      const data = await res.json();
      if (data.success && data.data.certifications) {
        try {
          const parsed = JSON.parse(data.data.certifications);
          if (Array.isArray(parsed)) {
            setCerts(parsed);
          } else {
            setCerts([]);
          }
        } catch {
          // Fallback to old comma-separated string format
          const list = data.data.certifications.split(',').map((c: string) => c.trim()).filter(Boolean);
          setCerts(list.map((c: string) => ({ title: c, verified: true })));
        }
      } else {
        setCerts([]);
      }
    } catch {
      setCerts([]);
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
      let documentUrl = "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "certifications");
        
        const uploadRes = await fetch("/api/professionals/upload-document", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.url) {
          documentUrl = uploadData.url;
        }
      }

      const newCert = {
        title: form.title,
        issuer: form.issuer || "Community",
        date: form.date,
        verified: true,
        url: documentUrl
      };

      const updatedCerts = [...certs, newCert];
      
      const res = await fetch("/api/professionals/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId: user.id, updates: { certifications: JSON.stringify(updatedCerts) } })
      });
      
      if (res.ok) {
        setIsOpen(false);
        setForm({ title: "", issuer: "", date: "" });
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
    return <div className="h-full bg-[#050505] flex items-center justify-center"><Loading message="Loading certifications..." /></div>;
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 p-6 rounded-2xl border border-yellow-500/10 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileBadge className="w-8 h-8 text-yellow-500" /> Certifications
          </h1>
          <p className="text-sm text-yellow-400 mt-1 font-medium">Verify your skills and showcase your credentials.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-500/20 px-6">
              <Plus className="w-4 h-4 mr-2" /> Add Certification
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Add New Certification</DialogTitle>
              <DialogDescription className="text-gray-400">Upload your certificate and share verification details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Certification Title *</label>
                <Input required placeholder="E.g. AWS Solutions Architect" className="bg-white/5 border-white/10" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Issuer / Organization</label>
                <Input placeholder="E.g. Amazon Web Services" className="bg-white/5 border-white/10" value={form.issuer} onChange={e => setForm({...form, issuer: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Date Issued</label>
                <Input placeholder="E.g. Oct 2024" className="bg-white/5 border-white/10" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Certificate Image/PDF</label>
                <Input type="file" accept="image/*,.pdf" className="bg-white/5 border-white/10 cursor-pointer" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Certification"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certs.map((cert, idx) => (
          <Card key={idx} className="group overflow-hidden border-white/5 bg-zinc-900/40 backdrop-blur-md hover:bg-zinc-800/80 transition-all hover:shadow-xl hover:-translate-y-1 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-lg flex justify-between items-start">
                <span className="text-white font-bold max-w-[85%]">{cert.title}</span>
                {cert.verified ? (
                  <ShieldCheck className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Award className="w-5 h-5 text-gray-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Status</p>
                <p className="text-sm text-gray-300 font-medium">Verified by CareerOS</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <Badge variant="secondary" className="bg-yellow-500/10 border-yellow-500/20 text-yellow-400">
                  {cert.date || "Active"}
                </Badge>
                {cert.url && (
                  <Button variant="ghost" size="sm" className="h-8 p-0 text-xs text-muted-foreground hover:text-white" asChild>
                    <Link href={cert.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2">
                      View <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="border-2 border-dashed border-white/10 bg-white/5 rounded-2xl flex flex-col items-center justify-center p-8 text-center hover:bg-white/10 transition-colors cursor-pointer group min-h-[220px]">
          <div className="bg-yellow-500/20 border border-yellow-500/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="font-bold text-white mb-2">Advance Your Career</h3>
          <p className="text-xs text-gray-400 max-w-[200px]">Link external accounts or update settings to add verified certifications.</p>
        </div>
      </div>
    </div>
  );
}
