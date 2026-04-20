"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, MapPin, Wifi, Building2, Filter, SlidersHorizontal,
  ExternalLink, BookmarkPlus, BookmarkCheck, Loader2, ChevronDown,
  ChevronUp, X, CheckCircle2, AlertCircle, RefreshCw, Clock,
  Briefcase, TrendingUp, DollarSign, Users, Star, Zap,
  Code, Monitor, LineChart, Cpu, Database, Palette, Shield, Terminal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Job {
  id: number;
  source: string;
  type: string;
  job_level: string;
  title: string;
  company: string;
  logo_url: string | null;
  location: string;
  is_remote: boolean;
  salary: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  min_experience: number;
  max_experience: number | null;
  skills_required: string[];
  category: string | null;
  industry: string | null;
  apply_url: string;
  posted_at: string | null;
  match_score: number | null;
  company_size: string | null;
  description: string | null;
}

interface Pagination {
  total: number; page: number; totalPages: number; hasMore: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCategoryIcon(industry: string | null, title: string | null) {
  const text = ((industry || "") + " " + (title || "")).toLowerCase();
  if (text.includes("data") || text.includes("analytics")) return Database;
  if (text.includes("design") || text.includes("ui") || text.includes("ux") || text.includes("art")) return Palette;
  if (text.includes("security") || text.includes("cyber")) return Shield;
  if (text.includes("backend") || text.includes("server") || text.includes("infrastructure")) return Terminal;
  if (text.includes("software") || text.includes("developer") || text.includes("engineer")) return Code;
  if (text.includes("finance") || text.includes("accounting")) return LineChart;
  if (text.includes("product") || text.includes("manager")) return Briefcase;
  return Building2;
}

function JobLogo({ src, alt, industry, title, sizeClass = "w-12 h-12 rounded-xl", iconClass = "w-5 h-5" }: { src: string | null; alt: string; industry?: string | null; title?: string | null; sizeClass?: string; iconClass?: string }) {
  const [error, setError] = useState(false);
  const Icon = getCategoryIcon(industry || "", title || "");
  return (
    <div className={`${sizeClass} border border-border/60 flex items-center justify-center bg-muted/20 flex-shrink-0 overflow-hidden`}>
      {src && !error ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="w-full h-full object-contain p-1 bg-white dark:bg-zinc-950" onError={() => setError(true)} />
      ) : (
        <Icon className={`${iconClass} text-muted-foreground/60`} />
      )}
    </div>
  );
}

function MatchBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color = score >= 70 ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/30"
    : score >= 40 ? "text-yellow-600 bg-yellow-500/10 border-yellow-500/30"
    : "text-red-500 bg-red-500/10 border-red-500/30";
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {score}% match
    </span>
  );
}

function levelBadgeColor(level: string) {
  const m: Record<string, string> = {
    junior: "bg-blue-500/10 text-blue-600",
    mid: "bg-violet-500/10 text-violet-600",
    senior: "bg-yellow-500/10 text-yellow-600",
    lead: "bg-rose-500/10 text-rose-600",
    any: "bg-muted text-muted-foreground",
  };
  return m[level] || m.any;
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : days < 7 ? `${days}d ago` : days < 30 ? `${Math.floor(days / 7)}w ago` : `${Math.floor(days / 30)}mo ago`;
}

// ─── Advanced Filter Panel ────────────────────────────────────────────────────
function AdvancedFilterPanel({
  filters, onChange, onClear,
}: {
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}) {
  const activeCount = Object.values(filters).filter(v => v && v !== "latest").length;
  return (
    <div className="w-72 flex-shrink-0 border border-border/60 rounded-xl p-5 bg-card space-y-5 h-fit sticky top-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">{activeCount}</span>
          )}
        </p>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Experience Level */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">Experience Level</p>
        <div className="grid grid-cols-2 gap-1.5">
          {["junior", "mid", "senior", "lead"].map(lvl => (
            <button key={lvl} onClick={() => onChange("level", filters.level === lvl ? "" : lvl)}
              className={`px-2 py-1.5 rounded-lg text-xs capitalize border transition-colors ${
                filters.level === lvl ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}>{lvl}</button>
          ))}
        </div>
      </div>

      {/* Job Type */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">Job Type</p>
        <div className="space-y-1.5">
          {[
            { v: "", l: "All Roles" },
            { v: "experienced", l: "Experienced" },
            { v: "fresher", l: "Fresher / Entry" },
          ].map(({ v, l }) => (
            <button key={v} onClick={() => onChange("type", v)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                filters.type === v ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              }`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Remote */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">Work Mode</p>
        <button onClick={() => onChange("remote", filters.remote === "1" ? "" : "1")}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs border transition-colors ${
            filters.remote === "1" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600" : "border-border/60 text-muted-foreground hover:text-foreground"
          }`}>
          <Wifi className="w-3.5 h-3.5" /> Remote Only
          {filters.remote === "1" && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
        </button>
      </div>

      {/* Salary Range */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">Salary Range (LPA)</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Min</p>
            <Input type="number" placeholder="0" value={filters.salaryMin} onChange={e => onChange("salaryMin", e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Max</p>
            <Input type="number" placeholder="Any" value={filters.salaryMax} onChange={e => onChange("salaryMax", e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      </div>

      {/* Experience (years) */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">Experience (Years)</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Min</p>
            <Input type="number" placeholder="0" value={filters.expMin} onChange={e => onChange("expMin", e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Max</p>
            <Input type="number" placeholder="Any" value={filters.expMax} onChange={e => onChange("expMax", e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      </div>

      {/* Industry */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Industry</p>
        <Input placeholder="e.g. Software, Finance..." value={filters.industry} onChange={e => onChange("industry", e.target.value)} className="h-8 text-xs" />
      </div>

      {/* Location */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Location</p>
        <Input placeholder="e.g. Bangalore, US..." value={filters.location} onChange={e => onChange("location", e.target.value)} className="h-8 text-xs" />
      </div>

      {/* Sort */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">Sort By</p>
        <div className="space-y-1">
          {[
            { v: "latest", l: "Latest First" },
            { v: "match", l: "Best Match" },
            { v: "salary", l: "Highest Salary" },
          ].map(({ v, l }) => (
            <button key={v} onClick={() => onChange("sort", v)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                filters.sort === v ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              }`}>{l}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Professional Job Card (detailed) ─────────────────────────────────────────
function ProJobCard({ job, saved, onSave, onApply, onView }: {
  job: Job; saved: boolean; onSave: (j: Job) => void; onApply: (j: Job) => void; onView: (j: Job) => void;
}) {

  const salaryDisplay = job.salary ||
    (job.salary_min && job.salary_max ? `${job.currency === 'INR' ? '₹' : '$'}${job.salary_min}–${job.salary_max} LPA` :
     job.salary_min ? `${job.currency === 'INR' ? '₹' : '$'}${job.salary_min}+ LPA` : null);

  return (
    <div className="border border-border/60 rounded-xl bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col">
      {/* Match bar */}
      {job.match_score !== null && (
        <div className="h-0.5 w-full" style={{
          background: job.match_score >= 70 ? "rgb(34 197 94)" : job.match_score >= 40 ? "rgb(234 179 8)" : "rgb(239 68 68)",
          opacity: 0.5 + job.match_score / 200,
        }} />
      )}
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <JobLogo src={job.logo_url} alt={job.company} industry={job.industry} title={job.title} sizeClass="w-12 h-12 rounded-xl" iconClass="w-5 h-5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors cursor-pointer" onClick={() => onView(job)}>{job.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> {job.company}
                  {job.company_size && <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{job.company_size}</span>}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                <MatchBadge score={job.match_score} />
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${levelBadgeColor(job.job_level)}`}>{job.job_level}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2.5 mt-3">
          {job.is_remote && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <Wifi className="w-3 h-3" /> Remote
            </span>
          )}
          {!job.is_remote && job.location && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />{job.location}
            </span>
          )}
          {salaryDisplay && (
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> {salaryDisplay}
            </span>
          )}
          {(job.min_experience > 0 || job.max_experience) && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {job.min_experience}{job.max_experience ? `–${job.max_experience}` : "+"} yrs
            </span>
          )}
          {job.industry && (
            <span className="text-[11px] text-muted-foreground">
              {job.industry}
            </span>
          )}
          {job.posted_at && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" /> {timeAgo(job.posted_at)}
            </span>
          )}
        </div>

        {/* Skills */}
        {job.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {job.skills_required.slice(0, 8).map(skill => (
              <Badge key={skill} variant="secondary" className="text-[10px] h-5 font-normal">{skill}</Badge>
            ))}
            {job.skills_required.length > 8 && (
              <span className="text-[10px] text-muted-foreground self-center">+{job.skills_required.length - 8} more</span>
            )}
          </div>
        )}

        {/* Excerpt */}
        <div className="mt-3 text-xs text-muted-foreground line-clamp-3 cursor-pointer hover:text-foreground/80 transition-colors" onClick={() => onView(job)}>
          {job.description ? job.description.replace(/<[^>]*>?/gm, '') : "No description available... Click to see details."}
        </div>



        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-4">
          <button onClick={() => onView(job)}
            className="flex items-center justify-center gap-1.5 text-xs px-3 py-2.5 rounded-lg border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> View
          </button>
          <button onClick={() => onApply(job)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg px-4 py-2.5 hover:bg-primary/90 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Apply Now
          </button>
          <button onClick={() => onSave(job)}
            className={`flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-lg border transition-colors ${
              saved ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600" : "border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40"
            }`}>
            {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
            {saved ? "Saved" : "Save"}
          </button>
          <button onClick={() => onView(job)}
            className="p-2.5 rounded-lg border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors" title="View details">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component (exported for use in professional layout) ─────────────────
export default function ProfessionalJobBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [filters, setFilters] = useState<Record<string, string>>({
    type: "experienced", level: "", remote: "", q: "", sort: "latest",
    location: "", industry: "", salaryMin: "", salaryMax: "",
    expMin: "", expMax: "",
  });

  const buildQuery = (f: Record<string, string>, page = 1) => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
    p.set("page", String(page)); p.set("limit", "18");
    return `/api/jobs?${p.toString()}`;
  };

  const fetchJobs = useCallback(async (f: Record<string, string>, page = 1, append = false) => {
    if (page === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(buildQuery(f, page));
      const data = await res.json();
      if (data.success) {
        setJobs(prev => append ? [...prev, ...data.data] : data.data);
        setPagination(data.pagination);
      }
    } catch { showToast("error", "Failed to load jobs"); }
    finally { setLoading(false); setLoadingMore(false); }
  }, []); // eslint-disable-line

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      if (data.success && data.data) {
        const ids = new Set<number>(data.data.map((app: any) => app.job_id).filter(Boolean));
        setSavedIds(ids);
      }
    } catch { /* soft fail */ }
  }, []);

  useEffect(() => { 
    fetchJobs(filters); 
    fetchApplications();
  }, []); // eslint-disable-line

  const handleFilterChange = (key: string, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    fetchJobs(next, 1);
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (job: Job) => {
    if (savedIds.has(job.id)) { setSavedIds(prev => { const n = new Set(prev); n.delete(job.id); return n; }); return; }
    setSavedIds(prev => new Set(prev).add(job.id));
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id, job_title: job.title, company: job.company,
          apply_url: job.apply_url, logo_url: job.logo_url, location: job.location,
          salary_range: job.salary, status: "saved",
        }),
      });
      showToast("success", `Saved "${job.title}"`);
    } catch { setSavedIds(prev => { const n = new Set(prev); n.delete(job.id); return n; }); }
  };

  const handleApply = async (job: Job) => {
    window.open(job.apply_url, "_blank", "noopener,noreferrer");
    setApplyingJob(job);
  };

  const confirmApply = async () => {
    if (!applyingJob) return;
    const job = applyingJob;
    if (!savedIds.has(job.id)) {
      setSavedIds(prev => new Set(prev).add(job.id));
      try {
        await fetch("/api/applications", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: job.id, job_title: job.title, company: job.company,
            apply_url: job.apply_url, logo_url: job.logo_url, location: job.location,
            salary_range: job.salary, status: "applied",
            applied_date: new Date().toISOString().split("T")[0],
          }),
        });
        showToast("success", `Marked "${job.title}" as applied.`);
      } catch { showToast("error", "Failed to mark as applied."); }
    } else {
      showToast("success", `Marked "${job.title}" as applied.`);
    }
    setApplyingJob(null);
  };

  const triggerScrape = async () => {
    setScraping(true);
    try {
      const res = await fetch("/api/jobs/refresh", { method: "POST" });
      const data = await res.json();
      if (data.success) { showToast("success", `Done! ${data.totalInserted} new jobs added.`); fetchJobs(filters, 1); }
      else showToast("error", data.error || "Failed");
    } catch { showToast("error", "Network error"); }
    finally { setScraping(false); }
  };

  return (
    <div className="min-h-full p-4 md:p-8 space-y-5 pb-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Job Board</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pagination ? `${pagination.total.toLocaleString()} roles` : "Loading..."} — personalized match scores from your profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/professional-dashboard/applications"
            className="flex items-center gap-1.5 text-xs border border-border/60 rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors">
            <Briefcase className="w-3.5 h-3.5" /> My Applications
          </Link>
          <button onClick={triggerScrape} disabled={scraping}
            className="flex items-center gap-1.5 text-xs border border-border/60 rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors disabled:opacity-50">
            {scraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
        </div>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search roles, companies, skills..."
            value={filters.q}
            onChange={e => {
              const next = { ...filters, q: e.target.value };
              setFilters(next);
              clearTimeout((window as any)._jobSearch);
              (window as any)._jobSearch = setTimeout(() => fetchJobs(next, 1), 400);
            }}
            className="pl-10 h-10"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 text-sm border rounded-lg px-3 py-2 transition-colors ${
            showFilters ? "border-primary bg-primary/5 text-primary" : "border-border/60 text-muted-foreground"
          }`}>
          <Filter className="w-4 h-4" /> {showFilters ? "Hide" : "Filters"}
        </button>
      </div>

      {/* Main layout */}
      <div className="flex gap-5">
        {showFilters && (
          <AdvancedFilterPanel filters={filters} onChange={handleFilterChange} onClear={() => {
            const reset = { type: "experienced", level: "", remote: "", q: "", sort: "latest", location: "", industry: "", salaryMin: "", salaryMax: "", expMin: "", expMax: "" };
            setFilters(reset); fetchJobs(reset, 1);
          }} />
        )}

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-border/60 rounded-xl">
              <Briefcase className="w-10 h-10 text-muted-foreground/40" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">No jobs found</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting filters or click Refresh to pull fresh data</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {jobs.map(job => (
                  <ProJobCard key={job.id} job={job} saved={savedIds.has(job.id)} onSave={handleSave} onApply={handleApply} onView={setSelectedJob} />
                ))}
              </div>
              {pagination?.hasMore && (
                <div className="flex justify-center mt-6">
                  <button onClick={() => fetchJobs(filters, (pagination.page || 1) + 1, true)} disabled={loadingMore}
                    className="flex items-center gap-2 text-sm border border-border/60 rounded-lg px-5 py-2.5 hover:bg-muted/50 transition-colors disabled:opacity-50">
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Load more ({pagination.total - jobs.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-2 ${
          toast.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
      {/* Apply Confirmation Popup */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border/60 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Did you apply?</h3>
              <p className="text-sm text-muted-foreground mt-2">We opened <strong>{applyingJob.title}</strong> at <strong>{applyingJob.company}</strong>.</p>
              <p className="text-sm text-muted-foreground mt-1">Have you successfully submitted the application?</p>
            </div>
            <div className="flex border-t border-border/60">
              <button onClick={() => setApplyingJob(null)} className="flex-1 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground">No, cancel</button>
              <div className="w-[1px] bg-border/60" />
              <button onClick={confirmApply} className="flex-1 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5">Yes, I applied</button>
            </div>
          </div>
        </div>
      )}

      {/* Full Description Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6" onClick={() => setSelectedJob(null)}>
          <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl border border-border/60 shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-start flex-shrink-0 bg-muted/10">
              <div>
                <h2 className="text-xl font-bold">{selectedJob.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{selectedJob.company} • {selectedJob.location || 'Remote'}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-2 bg-muted/30 hover:bg-muted rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-li:my-0.5 prose-div:my-1.5 prose-a:text-primary">
              <div className="mb-4 flex flex-wrap gap-2 text-xs">
                 <Badge variant="secondary">💰 {selectedJob.salary || 'Salary not disclosed'}</Badge>
                 <Badge variant="secondary">🎯 {selectedJob.type}</Badge>
              </div>
              <div 
                className="text-sm text-foreground/90 description-html [&>h5]:font-bold [&>h5]:text-sm"
                dangerouslySetInnerHTML={{ __html: selectedJob.description || "No full description provided." }} 
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-3 flex-shrink-0 bg-muted/10">
              <Button variant="outline" onClick={() => setSelectedJob(null)}>Close</Button>
              <Button onClick={() => { setSelectedJob(null); handleApply(selectedJob); }} className="gap-2">
                <ExternalLink className="w-4 h-4" /> Apply Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
