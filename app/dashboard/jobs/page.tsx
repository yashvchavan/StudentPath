"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, MapPin, Wifi, Briefcase, BookOpen, Filter,
  ChevronDown, ChevronUp, ExternalLink, BookmarkPlus,
  BookmarkCheck, RefreshCw, Calendar, Building2,
  GraduationCap, Zap, SlidersHorizontal, X, CheckCircle2,
  AlertCircle, Clock, TrendingUp, Loader2,
  Code, Monitor, LineChart, Cpu, Star, Users, Building,
  BriefcaseBusiness, Database, Palette, Shield, Terminal
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Job {
  id: number;
  source: string;
  type: "internship" | "fresher" | "experienced";
  job_level: string;
  title: string;
  company: string;
  logo_url: string | null;
  description: string | null;
  location: string;
  is_remote: boolean;
  salary: string | null;
  stipend: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  min_experience: number;
  skills_required: string[];
  category: string | null;
  industry: string | null;
  apply_url: string;
  posted_at: string | null;
  match_score: number | null;
}

interface Pagination {
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

interface FilterState {
  type: string;
  remote: string;
  q: string;
  sort: string;
  location: string;
  skills: string;
  industry: string;
  level: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

function JobLogo({
  src,
  alt,
  industry,
  title,
  sizeClass = "w-12 h-12 rounded-xl",
  iconClass = "w-5 h-5",
}: {
  src: string | null;
  alt: string;
  industry?: string | null;
  title?: string | null;
  sizeClass?: string;
  iconClass?: string;
}) {
  const [error, setError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const Icon = getCategoryIcon(industry || "", title || "");

  return (
    <div
      className={`${sizeClass} border border-border/60 flex items-center justify-center bg-muted/20 flex-shrink-0 overflow-hidden relative group`}
    >
      {src && !error ? (
        <>
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/50" />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-contain p-1.5 bg-white dark:bg-zinc-950 transition-opacity duration-300 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setError(true)}
          />
        </>
      ) : (
        <Icon className={`${iconClass} text-muted-foreground/60 transition-transform group-hover:scale-110`} />
      )}
    </div>
  );
}

function MatchBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color =
    score >= 70 ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
    : score >= 40 ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
    : "bg-red-500/15 text-red-500 border-red-500/30";
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {score}% match
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, string> = {
    remotive: "bg-blue-500/10 text-blue-600",
    himalayas: "bg-purple-500/10 text-purple-600",
    muse: "bg-rose-500/10 text-rose-600",
    college: "bg-emerald-500/10 text-emerald-600",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${map[source] || "bg-muted text-muted-foreground"}`}>
      {source === "muse" ? "The Muse" : source.charAt(0).toUpperCase() + source.slice(1)}
    </span>
  );
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({
  job, saved, onSave, onApply, onView,
}: {
  job: Job;
  saved: boolean;
  onSave: (job: Job) => void;
  onApply: (job: Job) => void;
  onView: (job: Job) => void;
}) {

  return (
    <div className="group border border-border/60 rounded-xl bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Match accent line */}
      {job.match_score !== null && (
        <div
          className="h-0.5 w-full"
          style={{
            background: job.match_score >= 70
              ? "rgb(34 197 94)"
              : job.match_score >= 40
              ? "rgb(234 179 8)"
              : "rgb(239 68 68)",
            opacity: 0.6 + job.match_score / 250,
          }}
        />
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-4 mb-4">
          <JobLogo src={job.logo_url} alt={job.company} industry={job.industry} title={job.title} sizeClass="w-14 h-14 rounded-xl shadow-sm" iconClass="w-6 h-6" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <MatchBadge score={job.match_score} />
                <SourceBadge source={job.source} />
              </div>
            </div>
          </div>
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {job.is_remote && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <Wifi className="w-3 h-3" /> Remote
            </span>
          )}
          {job.location && !job.is_remote && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="w-3 h-3" /> {job.location}
            </span>
          )}
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            job.type === "internship" ? "bg-blue-500/10 text-blue-600"
            : job.type === "fresher" ? "bg-violet-500/10 text-violet-600"
            : "bg-orange-500/10 text-orange-600"
          }`}>
            {job.type === "internship" ? "Internship"
             : job.type === "fresher" ? "Fresher"
             : "Experienced"}
          </span>
          {(job.salary || job.stipend) && (
            <span className="text-[11px] text-muted-foreground">
              💰 {job.type === "internship" ? job.stipend || job.salary : job.salary}
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
            {job.skills_required.slice(0, 6).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[10px] h-5 font-normal">
                {skill}
              </Badge>
            ))}
            {job.skills_required.length > 6 && (
              <span className="text-[10px] text-muted-foreground self-center">+{job.skills_required.length - 6}</span>
            )}
          </div>
        )}

        {/* Actions - Description moved to Modal */}
        <div className="mt-3 text-[11px] text-muted-foreground line-clamp-3 cursor-pointer hover:text-foreground/80 transition-colors mb-2" onClick={() => onView(job)}>
          {job.description ? job.description.replace(/<[^>]*>?/gm, '') : "No description available... Click to see details."}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={() => onApply(job)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Apply Now
          </button>
          <button
            onClick={() => onSave(job)}
            className={`p-2 rounded-lg border transition-colors ${
              saved
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                : "border-border/60 hover:border-primary/40 text-muted-foreground hover:text-primary"
            }`}
            title={saved ? "Saved" : "Save job"}
          >
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onView(job)}
            className="p-2 rounded-lg border border-border/60 hover:border-primary/40 text-muted-foreground hover:text-primary transition-colors"
            title="View full description"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────
function FilterPanel({
  filters, onChange, onClear,
}: {
  filters: FilterState;
  onChange: (key: keyof FilterState, value: string) => void;
  onClear: () => void;
}) {
  const activeCount = Object.values(filters).filter(v => v && v !== "latest").length - 1; // exclude q

  return (
    <div className="border border-border/60 rounded-xl p-4 bg-card space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">{activeCount}</span>
          )}
        </p>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Job Type */}
      <div>
        <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wide">Job Type</p>
        <div className="space-y-1.5">
          {[
            { value: "", label: "All Jobs", icon: Briefcase },
            { value: "internship", label: "Internships", icon: GraduationCap },
            { value: "fresher", label: "Fresher Roles", icon: Zap },
            { value: "experienced", label: "Experienced", icon: TrendingUp },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onChange("type", value)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                filters.type === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Remote Toggle */}
      <div>
        <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wide">Work Mode</p>
        <button
          onClick={() => onChange("remote", filters.remote === "1" ? "" : "1")}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${
            filters.remote === "1"
              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
              : "border border-border/60 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wifi className="w-3.5 h-3.5" />
          Remote Only
          {filters.remote === "1" && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
        </button>
      </div>

      {/* Sort */}
      <div>
        <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wide">Sort By</p>
        <div className="space-y-1">
          {[
            { value: "latest", label: "Latest First" },
            { value: "match", label: "Best Match" },
            { value: "salary", label: "Highest Salary" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange("sort", value)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                filters.sort === value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <p className="text-[11px] text-muted-foreground mb-1.5 uppercase tracking-wide">Location</p>
        <Input
          placeholder="e.g. Bangalore, US..."
          value={filters.location}
          onChange={(e) => onChange("location", e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* Industry */}
      <div>
        <p className="text-[11px] text-muted-foreground mb-1.5 uppercase tracking-wide">Industry</p>
        <Input
          placeholder="e.g. Software, Finance..."
          value={filters.industry}
          onChange={(e) => onChange("industry", e.target.value)}
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JobBoardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [scraping, setScraping] = useState(false);
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const searchRef = useRef<NodeJS.Timeout | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    type: "", remote: "", q: "", sort: "latest",
    location: "", skills: "", industry: "", level: "",
  });

  const buildQuery = useCallback((f: FilterState, page = 1) => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
    p.set("page", String(page));
    p.set("limit", "20");
    return `/api/jobs?${p.toString()}`;
  }, []);

  const fetchJobs = useCallback(async (f: FilterState, page = 1, append = false) => {
    if (page === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(buildQuery(f, page));
      const data = await res.json();
      if (data.success) {
        setJobs(prev => append ? [...prev, ...data.data] : data.data);
        setPagination(data.pagination);
      }
    } catch {
      showToast("error", "Failed to load jobs");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildQuery]);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      if (data.success && data.data) {
        const ids = new Set<number>(data.data.map((app: any) => app.job_id).filter(Boolean));
        setSavedJobIds(ids);
      }
    } catch { /* soft fail */ }
  }, []);

  useEffect(() => { 
    fetchJobs(filters); 
    fetchApplications();
  }, []); // eslint-disable-line

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (key === "q") {
      if (searchRef.current) clearTimeout(searchRef.current);
      searchRef.current = setTimeout(() => fetchJobs(next, 1), 400);
    } else {
      fetchJobs(next, 1);
    }
  };

  const clearFilters = () => {
    const reset: FilterState = { type: "", remote: "", q: "", sort: "latest", location: "", skills: "", industry: "", level: "" };
    setFilters(reset);
    fetchJobs(reset, 1);
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (job: Job) => {
    // Toggle saved state optimistically
    const isSaved = savedJobIds.has(job.id);
    if (isSaved) {
      setSavedJobIds(prev => { const n = new Set(prev); n.delete(job.id); return n; });
      return;
    }
    setSavedJobIds(prev => new Set(prev).add(job.id));
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id,
          job_title: job.title,
          company: job.company,
          apply_url: job.apply_url,
          logo_url: job.logo_url,
          location: job.location,
          salary_range: job.salary || job.stipend,
          status: "saved",
        }),
      });
      showToast("success", `Saved "${job.title}" to applications`);
    } catch {
      setSavedJobIds(prev => { const n = new Set(prev); n.delete(job.id); return n; });
      showToast("error", "Failed to save job");
    }
  };

  const handleApply = async (job: Job) => {
    // Open URL first
    window.open(job.apply_url, "_blank", "noopener,noreferrer");
    // Show confirmation popup when they return
    setApplyingJob(job);
  };

  const confirmApply = async () => {
    if (!applyingJob) return;
    const job = applyingJob;
    if (!savedJobIds.has(job.id)) {
      setSavedJobIds(prev => new Set(prev).add(job.id));
      try {
        await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: job.id,
            job_title: job.title,
            company: job.company,
            apply_url: job.apply_url,
            logo_url: job.logo_url,
            location: job.location,
            status: "applied",
            applied_date: new Date().toISOString().split("T")[0],
          }),
        });
        showToast("success", `Marked "${job.title}" as applied in your applications.`);
      } catch { 
        showToast("error", "Failed to mark as applied."); 
      }
    } else {
      showToast("success", `Marked "${job.title}" as applied in your applications.`);
    }
    setApplyingJob(null);
  };

  const triggerScrape = async () => {
    setScraping(true);
    try {
      const res = await fetch("/api/jobs/refresh", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast("success", `Refreshed! ${data.totalInserted} new jobs added.`);
        fetchJobs(filters, 1);
      } else {
        showToast("error", data.error || "Scrape failed");
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setScraping(false);
    }
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v !== "latest").length - 1;

  return (
    <DashboardLayout currentPage="jobs">
      <div className="space-y-5 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Job Board</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pagination ? `${pagination.total.toLocaleString()} opportunities` : "Loading jobs..."} from Remotive, Himalayas & The Muse
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/applications"
              className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border/60 rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              My Applications
            </Link>
            <button
              onClick={triggerScrape}
              disabled={scraping}
              className="flex items-center gap-1.5 text-xs border border-border/60 rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              {scraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Refresh Jobs
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by job title, company, or skill..."
              value={filters.q}
              onChange={(e) => handleFilterChange("q", e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-sm border rounded-lg px-3 py-2 transition-colors ${
              showFilters || activeFilterCount > 0
                ? "border-primary bg-primary/5 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Type quick filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: "", label: "All", icon: Briefcase },
            { value: "internship", label: "Internships", icon: GraduationCap },
            { value: "fresher", label: "Fresher", icon: Zap },
            { value: "experienced", label: "Experienced", icon: TrendingUp },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleFilterChange("type", value)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filters.type === value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
          <button
            onClick={() => handleFilterChange("remote", filters.remote === "1" ? "" : "1")}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filters.remote === "1"
                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/40"
                : "border-border/60 text-muted-foreground hover:border-primary/40"
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            Remote
          </button>
        </div>

        {/* Layout */}
        <div className="flex gap-5">
          {/* Filter sidebar */}
          {showFilters && (
            <div className="w-56 flex-shrink-0">
              <FilterPanel filters={filters} onChange={handleFilterChange} onClear={clearFilters} />
            </div>
          )}

          {/* Jobs grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Fetching jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-border/60 rounded-xl">
                <Briefcase className="w-10 h-10 text-muted-foreground/40" />
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">No jobs found</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting filters or click "Refresh Jobs" to scrape fresh data</p>
                </div>
                <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      saved={savedJobIds.has(job.id)}
                      onSave={handleSave}
                      onApply={handleApply}
                      onView={setSelectedJob}
                    />
                  ))}
                </div>

                {/* Load more */}
                {pagination?.hasMore && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => fetchJobs(filters, (pagination.page || 1) + 1, true)}
                      disabled={loadingMore}
                      className="flex items-center gap-2 text-sm border border-border/60 rounded-lg px-5 py-2.5 hover:bg-muted/50 transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Load more ({pagination.total - jobs.length} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast notification */}
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
              <p className="text-sm text-muted-foreground mt-2">
                We've opened the application page for <strong>{applyingJob.title}</strong> at <strong>{applyingJob.company}</strong> in a new tab.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Have you completed the application process?
              </p>
            </div>
            <div className="flex border-t border-border/60">
              <button
                onClick={() => setApplyingJob(null)}
                className="flex-1 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                No, maybe later
              </button>
              <div className="w-[1px] bg-border/60" />
              <button
                onClick={confirmApply}
                className="flex-1 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
              >
                Yes, I applied!
              </button>
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
              <button onClick={() => setSelectedJob(null)} className="p-2 bg-muted/30 hover:bg-muted rounded-full">
                <X className="w-4 h-4" />
              </button>
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
    </DashboardLayout>
  );
}
