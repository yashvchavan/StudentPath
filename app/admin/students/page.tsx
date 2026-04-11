"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Users, Search, UserPlus, Calendar, Mail, Phone, GraduationCap,
  AlertCircle, Filter, X, ChevronLeft, ChevronRight, SlidersHorizontal,
  TrendingUp, Star, Briefcase, Download,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────
interface Student {
  student_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  department?: string;
  department_name?: string;
  department_id?: number;
  program?: string;
  current_year?: number;
  current_semester?: number;
  current_gpa?: number;
  gender?: string;
  academic_interests?: string;
  skills_list?: string[];
  total_skills?: number;
  primary_goal?: string;
  location_preference?: string;
  intensity_level?: string;
  placement_status?: string;
  placement_status_display?: string;
  profile_completion?: number;
  best_ats_score?: number;
  is_active?: boolean;
  created_at: string;
}

interface Department { id: number; name: string; code: string; }

interface Filters {
  search: string;
  departmentId: string;
  year: string;
  status: string;
  placementStatus: string;
  minGpa: string;
  maxGpa: string;
  skills: string;         // comma-separated skill names to filter by
  interests: string;      // comma-separated interest names
  primaryGoal: string;
  intensityLevel: string;
  minProfileCompletion: string;
}

const INITIAL_FILTERS: Filters = {
  search: "", departmentId: "", year: "", status: "",
  placementStatus: "", minGpa: "", maxGpa: "", skills: "",
  interests: "", primaryGoal: "", intensityLevel: "", minProfileCompletion: "",
};

const COMMON_SKILLS = [
  "Python", "JavaScript", "Java", "C++", "React", "Node.js", "SQL", "Machine Learning",
  "Data Analysis", "Cloud Computing", "Docker", "Git", "TypeScript", "Flutter", "AI/ML",
];

const CAREER_GOALS = [
  "Software Developer", "Data Scientist", "AI/ML Engineer", "Product Manager",
  "DevOps Engineer", "Cybersecurity Analyst", "Business Analyst", "Entrepreneur",
];

// ── Advanced Filter Panel ─────────────────────────────────────────────────
function FilterPanel({
  filters, setFilters, departments, onApply, onReset, activeCount,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  departments: Department[];
  onApply: () => void;
  onReset: () => void;
  activeCount: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSkill = (skill: string) => {
    const current = filters.skills ? filters.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
    const next = current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill];
    setFilters({ ...filters, skills: next.join(", ") });
  };

  const isSkillActive = (skill: string) =>
    filters.skills.split(",").map(s => s.trim()).includes(skill);

  return (
    <div>
      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 gap-2 ${activeCount > 0 ? "border-blue-500 text-blue-400" : ""}`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        Advanced Filters
        {activeCount > 0 && (
          <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0 h-4">{activeCount}</Badge>
        )}
      </Button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="mt-3 p-5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-400" /> Advanced Filters
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Row 1: Dept, Year, Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Department</Label>
              <select
                value={filters.departmentId}
                onChange={e => setFilters({ ...filters, departmentId: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Year</Label>
              <select
                value={filters.year}
                onChange={e => setFilters({ ...filters, year: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Account Status</Label>
              <select
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Placement Status</Label>
              <select
                value={filters.placementStatus}
                onChange={e => setFilters({ ...filters, placementStatus: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="unplaced">Unplaced</option>
                <option value="placed">Placed</option>
                <option value="opted_out">Opted Out</option>
              </select>
            </div>
          </div>

          {/* Row 2: GPA, Profile Completion, Intensity, Goal */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Min GPA</Label>
              <Input
                type="number" step="0.1" min="0" max="10"
                value={filters.minGpa}
                onChange={e => setFilters({ ...filters, minGpa: e.target.value })}
                placeholder="e.g. 7.0"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Max GPA</Label>
              <Input
                type="number" step="0.1" min="0" max="10"
                value={filters.maxGpa}
                onChange={e => setFilters({ ...filters, maxGpa: e.target.value })}
                placeholder="e.g. 10.0"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Intensity Level</Label>
              <select
                value={filters.intensityLevel}
                onChange={e => setFilters({ ...filters, intensityLevel: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Any</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="intensive">Intensive</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Career Goal</Label>
              <select
                value={filters.primaryGoal}
                onChange={e => setFilters({ ...filters, primaryGoal: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Any Goal</option>
                {CAREER_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Skills filter */}
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">Filter by Skills (must have ALL selected)</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SKILLS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSkillActive(skill)
                      ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                      : "bg-zinc-800/60 border-zinc-700/40 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-zinc-500">Or type custom skill names (comma-separated):</Label>
              <Input
                value={filters.skills}
                onChange={e => setFilters({ ...filters, skills: e.target.value })}
                placeholder="e.g. Python, React, Docker"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 h-9 text-sm"
              />
            </div>
          </div>

          {/* Min profile completion */}
          <div className="space-y-1.5 max-w-xs">
            <Label className="text-xs text-zinc-400">Minimum Profile Completion (%)</Label>
            <div className="flex items-center gap-2">
              <input
                type="range" min="0" max="100" step="10"
                value={filters.minProfileCompletion || "0"}
                onChange={e => setFilters({ ...filters, minProfileCompletion: e.target.value })}
                className="flex-1 accent-blue-600"
              />
              <span className="text-sm text-zinc-300 w-8 text-right">{filters.minProfileCompletion || "0"}%</span>
            </div>
          </div>

          {/* Apply / Reset */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onReset}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Reset all filters
            </button>
            <Button onClick={() => { onApply(); setIsOpen(false); }} className="bg-blue-600 hover:bg-blue-500 text-white">
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Profile Completion Bar ─────────────────────────────────────────────────
function CompletionBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500 w-8">{pct}%</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 15;

  const buildQueryString = useCallback((f: Filters) => {
    const params = new URLSearchParams();
    if (f.search)            params.set("search", f.search);
    if (f.departmentId)      params.set("departmentId", f.departmentId);
    if (f.year)              params.set("year", f.year);
    if (f.placementStatus)   params.set("placementStatus", f.placementStatus);
    if (f.minGpa)            params.set("minGpa", f.minGpa);
    if (f.maxGpa)            params.set("maxGpa", f.maxGpa);
    if (f.skills)            params.set("skills", f.skills);
    return params.toString();
  }, []);

  const fetchStudents = useCallback(async (f: Filters) => {
    try {
      setLoading(true);
      setError(null);
      const qs = buildQueryString(f);
      const res = await fetch(`/api/student/list?${qs}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      if (data.success) {
        let rows: Student[] = data.students.map((s: any) => ({
          ...s,
          is_active: s.is_active === 1 || s.is_active === true,
          current_gpa: s.current_gpa !== null ? Number(s.current_gpa) : null,
        }));

        // Client-side post-filter for things not supported server-side
        if (f.status === "active") rows = rows.filter(s => s.is_active);
        if (f.status === "inactive") rows = rows.filter(s => !s.is_active);
        if (f.intensityLevel) rows = rows.filter(s => s.intensity_level === f.intensityLevel);
        if (f.primaryGoal) rows = rows.filter(s => s.primary_goal === f.primaryGoal);
        if (f.minProfileCompletion) {
          const minPct = parseInt(f.minProfileCompletion);
          rows = rows.filter(s => (s.profile_completion || 0) >= minPct);
        }
        if (f.interests) {
          const requiredInterests = f.interests.toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
          rows = rows.filter(s => {
            if (!s.academic_interests) return false;
            const interestStr = s.academic_interests.toLowerCase();
            return requiredInterests.every(i => interestStr.includes(i));
          });
        }

        setStudents(rows);
        setTotal(rows.length);
        setDepartments(data.filters?.availableDepartments || []);
        setCurrentPage(1);
      } else {
        throw new Error(data.error || "Failed to fetch students");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  useEffect(() => { fetchStudents(appliedFilters); }, []);

  const handleApply = () => {
    setAppliedFilters(filters);
    fetchStudents(filters);
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    fetchStudents(INITIAL_FILTERS);
  };

  const handleSearch = (val: string) => {
    const updated = { ...filters, search: val };
    setFilters(updated);
    setAppliedFilters(updated);
    fetchStudents(updated);
  };

  const totalPages = Math.ceil(students.length / ITEMS_PER_PAGE);
  const displayed = students.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const activeFilterCount = Object.entries(appliedFilters).filter(([k, v]) => k !== "search" && v !== "").length;

  // Stats
  const activeCount = students.filter(s => s.is_active).length;
  const placedCount = students.filter(s => s.placement_status === "placed").length;
  const avgGpa = students.filter(s => s.current_gpa).reduce((sum, s, _, arr) => sum + (s.current_gpa || 0) / arr.length, 0);

  const placementBadge = (status?: string) => {
    switch (status) {
      case "placed":    return { label: "Placed",    cls: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30" };
      case "opted_out": return { label: "Opted Out", cls: "bg-zinc-700 text-zinc-400 border-zinc-600" };
      default:          return { label: "Unplaced",  cls: "bg-red-600/20 text-red-400 border-red-600/30" };
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "Name", "Email", "Department", "Year", "GPA", "Skills", "Interests", "Goal", "Placement", "Profile%"];
    const rows = students.map(s => [
      s.student_id, s.full_name, s.email,
      s.department_name || s.program || "",
      s.current_year || "",
      s.current_gpa?.toFixed(2) || "",
      (s.skills_list || []).join("; "),
      s.academic_interests || "",
      s.primary_goal || "",
      s.placement_status || "",
      s.profile_completion || 0,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "students.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell title="Student Management" description="Search, filter, and export student records with advanced criteria">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Shown",    value: total,       Icon: Users,       color: "blue" },
          { label: "Active",         value: activeCount, Icon: UserPlus,    color: "emerald" },
          { label: "Placed",         value: placedCount, Icon: Briefcase,   color: "purple" },
          { label: "Avg GPA",        value: avgGpa > 0 ? avgGpa.toFixed(2) : "N/A", Icon: Star, color: "amber" },
        ].map(({ label, value, Icon, color }) => (
          <Card key={label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 bg-${color}-600/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 text-${color}-400`} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filter + Export */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search by name, email, or ID..."
              value={filters.search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <FilterPanel
              filters={filters} setFilters={setFilters}
              departments={departments}
              onApply={handleApply} onReset={handleReset}
              activeCount={activeFilterCount}
            />
            <Button
              variant="outline"
              onClick={exportCSV}
              disabled={students.length === 0}
              className="border-zinc-700 text-zinc-300 hover:text-white gap-2"
            >
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-zinc-500">Active filters:</span>
            {appliedFilters.departmentId && departments.find(d => String(d.id) === appliedFilters.departmentId) && (
              <FilterChip label={`Dept: ${departments.find(d => String(d.id) === appliedFilters.departmentId)?.name}`}
                onRemove={() => { const f = { ...filters, departmentId: "" }; setFilters(f); setAppliedFilters(f); fetchStudents(f); }} />
            )}
            {appliedFilters.year && <FilterChip label={`Year ${appliedFilters.year}`} onRemove={() => { const f = { ...filters, year: "" }; setFilters(f); setAppliedFilters(f); fetchStudents(f); }} />}
            {appliedFilters.placementStatus && <FilterChip label={`Placement: ${appliedFilters.placementStatus}`} onRemove={() => { const f = { ...filters, placementStatus: "" }; setFilters(f); setAppliedFilters(f); fetchStudents(f); }} />}
            {appliedFilters.minGpa && <FilterChip label={`GPA ≥ ${appliedFilters.minGpa}`} onRemove={() => { const f = { ...filters, minGpa: "" }; setFilters(f); setAppliedFilters(f); fetchStudents(f); }} />}
            {appliedFilters.skills && <FilterChip label={`Skills: ${appliedFilters.skills}`} onRemove={() => { const f = { ...filters, skills: "" }; setFilters(f); setAppliedFilters(f); fetchStudents(f); }} />}
            {appliedFilters.primaryGoal && <FilterChip label={`Goal: ${appliedFilters.primaryGoal}`} onRemove={() => { const f = { ...filters, primaryGoal: "" }; setFilters(f); setAppliedFilters(f); fetchStudents(f); }} />}
            {appliedFilters.intensityLevel && <FilterChip label={`Intensity: ${appliedFilters.intensityLevel}`} onRemove={() => { const f = { ...filters, intensityLevel: "" }; setFilters(f); setAppliedFilters(f); fetchStudents(f); }} />}
            {appliedFilters.minProfileCompletion && parseInt(appliedFilters.minProfileCompletion) > 0 && (
              <FilterChip label={`Profile ≥ ${appliedFilters.minProfileCompletion}%`} onRemove={() => { const f = { ...filters, minProfileCompletion: "" }; setFilters(f); setAppliedFilters(f); fetchStudents(f); }} />
            )}
            <button onClick={handleReset} className="text-xs text-red-400 hover:text-red-300 transition-colors ml-1">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Loading students...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 px-6 py-8 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Error loading students</p>
                <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
                <button onClick={() => fetchStudents(appliedFilters)} className="mt-2 text-xs text-blue-400 hover:text-blue-300">
                  Retry
                </button>
              </div>
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
              <p className="text-zinc-500 text-sm">No students match your filters.</p>
              {activeFilterCount > 0 && (
                <button onClick={handleReset} className="mt-2 text-sm text-blue-400 hover:text-blue-300">
                  Reset all filters →
                </button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Student</TableHead>
                  <TableHead className="text-zinc-400">Contact</TableHead>
                  <TableHead className="text-zinc-400">Dept / Year</TableHead>
                  <TableHead className="text-zinc-400">GPA</TableHead>
                  <TableHead className="text-zinc-400">Skills</TableHead>
                  <TableHead className="text-zinc-400">Placement</TableHead>
                  <TableHead className="text-zinc-400">Profile</TableHead>
                  <TableHead className="text-zinc-400">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map(student => {
                  const p = placementBadge(student.placement_status);
                  return (
                    <TableRow key={student.student_id} className="border-zinc-800 hover:bg-zinc-800/40">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white text-sm">{student.full_name}</p>
                          <p className="text-xs text-zinc-600">#{student.student_id}</p>
                          {!student.is_active && (
                            <Badge className="bg-zinc-700 text-zinc-400 border-zinc-600 text-[10px] h-4 mt-0.5">Inactive</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-zinc-400">
                            <Mail className="w-3 h-3" />{student.email}
                          </div>
                          {student.phone && (
                            <div className="flex items-center gap-1 text-xs text-zinc-600">
                              <Phone className="w-3 h-3" />{student.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-zinc-200">{student.department_name || student.program || "—"}</p>
                          <p className="text-xs text-zinc-500">Year {student.current_year || "?"} · Sem {student.current_semester || "?"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${
                          (student.current_gpa || 0) >= 8 ? "text-emerald-400" :
                          (student.current_gpa || 0) >= 6 ? "text-amber-400" : "text-zinc-400"
                        }`}>
                          {student.current_gpa ? student.current_gpa.toFixed(2) : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs text-zinc-300">{student.total_skills || 0} skills</p>
                          {student.skills_list && student.skills_list.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {student.skills_list.slice(0, 3).map(skill => (
                                <span key={skill} className="text-[10px] px-1.5 py-0.5 bg-blue-600/15 text-blue-400 rounded border border-blue-600/20">
                                  {skill}
                                </span>
                              ))}
                              {(student.skills_list.length > 3) && (
                                <span className="text-[10px] text-zinc-600">+{student.skills_list.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${p.cls}`}>{p.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <CompletionBar pct={student.profile_completion || 0} />
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-zinc-500">
                          {new Date(student.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-zinc-500">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, students.length)} of {students.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="border-zinc-700 text-zinc-300 h-8 w-8 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-zinc-400">{currentPage} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="border-zinc-700 text-zinc-300 h-8 w-8 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

// ── Filter Chip ────────────────────────────────────────────────────────────
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-blue-600/10 border border-blue-600/20 rounded-lg text-xs text-blue-300">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:text-white transition-colors">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}