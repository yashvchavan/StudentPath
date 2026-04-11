"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, Search, GraduationCap, Clock, FileText, ChevronDown,
  ChevronRight, AlertCircle, RefreshCw, ExternalLink, Beaker, Layers,
  CheckCircle2, BookMarked, Star,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────
interface Subject {
  code?: string;
  name: string;
  credits?: number;
  type?: string;
  semester?: number;
}

interface SyllabusData {
  success: boolean;
  hasData: boolean;
  isPending?: boolean;
  message?: string;
  student: {
    year?: number;
    semester?: number;
    department?: string;
  };
  syllabus?: {
    id: number;
    title: string;
    fileName: string;
    fileUrl: string;
    parsedAt: string;
  };
  currentSemester?: number;
  currentSubjects?: Subject[];
  allSemesters?: Record<string, Subject[]>;
  previousSemesters?: Record<string, Subject[]>;
  totalSubjectsThisYear?: number;
}

// ── Subject Card ──────────────────────────────────────────────────────────
function SubjectCard({
  subject,
  isCurrent,
  searchHighlight,
}: {
  subject: Subject;
  isCurrent: boolean;
  searchHighlight: string;
}) {
  const typeColors: Record<string, string> = {
    Theory:    "bg-blue-600/15 text-blue-400 border-blue-600/20",
    Practical: "bg-purple-600/15 text-purple-400 border-purple-600/20",
    Project:   "bg-amber-600/15 text-amber-400 border-amber-600/20",
    Elective:  "bg-emerald-600/15 text-emerald-400 border-emerald-600/20",
    Info:      "bg-zinc-700/40 text-zinc-400 border-zinc-700",
  };

  const TypeIcon = subject.type === "Practical" ? Beaker :
                   subject.type === "Project"   ? Star :
                   subject.type === "Elective"  ? Layers : BookOpen;

  const highlight = (text: string) => {
    if (!searchHighlight || !text) return text;
    const idx = text.toLowerCase().indexOf(searchHighlight.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-400/30 text-yellow-300 rounded px-0.5">
          {text.slice(idx, idx + searchHighlight.length)}
        </mark>
        {text.slice(idx + searchHighlight.length)}
      </>
    );
  };

  return (
    <div
      className={`group px-4 py-3 rounded-xl border transition-all duration-150 ${
        isCurrent
          ? "bg-zinc-800/60 border-zinc-700/60 hover:border-blue-500/40 hover:bg-zinc-800"
          : "bg-zinc-900/50 border-zinc-800/40 hover:border-zinc-700 hover:bg-zinc-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isCurrent ? "bg-blue-600/20" : "bg-zinc-800"
        }`}>
          <TypeIcon className={`w-4 h-4 ${isCurrent ? "text-blue-400" : "text-zinc-500"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isCurrent ? "text-zinc-100" : "text-zinc-300"} leading-snug`}>
            {highlight(subject.name) as any}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {subject.code && (
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                {subject.code}
              </span>
            )}
            {subject.type && subject.type !== "Info" && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${typeColors[subject.type] || typeColors.Theory}`}>
                {subject.type}
              </span>
            )}
            {subject.credits && (
              <span className="text-[10px] text-zinc-600">{subject.credits} cr</span>
            )}
          </div>
        </div>
        {isCurrent && (
          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}

// ── Semester Section ──────────────────────────────────────────────────────
function SemesterSection({
  semester, subjects, isCurrentSem, searchQuery,
}: {
  semester: number;
  subjects: Subject[];
  isCurrentSem: boolean;
  searchQuery: string;
}) {
  const [isOpen, setIsOpen] = useState(isCurrentSem);

  const filtered = subjects.filter(s =>
    !searchQuery ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.code || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0 && searchQuery) return null;

  const theoryCount = subjects.filter(s => s.type === "Theory" || !s.type).length;
  const practicalCount = subjects.filter(s => s.type === "Practical").length;
  const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);

  return (
    <div className={`rounded-xl border overflow-hidden ${
      isCurrentSem ? "border-blue-500/30 ring-1 ring-blue-500/10" : "border-zinc-800"
    }`}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-5 py-4 flex items-center justify-between text-left transition-colors ${
          isCurrentSem ? "bg-blue-600/10 hover:bg-blue-600/15" : "bg-zinc-900 hover:bg-zinc-800/60"
        }`}
      >
        <div className="flex items-center gap-3">
          {isCurrentSem ? (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookMarked className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-zinc-500" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isCurrentSem ? "text-white" : "text-zinc-300"}`}>
                Semester {semester}
              </span>
              {isCurrentSem && (
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-[10px] h-4">
                  Current
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {subjects.length} subjects
              {totalCredits > 0 && ` · ${totalCredits} credits`}
              {practicalCount > 0 && ` · ${practicalCount} practical`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            {theoryCount > 0 && (
              <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                {theoryCount} theory
              </span>
            )}
            {practicalCount > 0 && (
              <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                {practicalCount} practical
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Subjects */}
      {isOpen && (
        <div className="p-4 bg-zinc-950 grid gap-2 sm:grid-cols-2">
          {(searchQuery ? filtered : subjects).map((subject, idx) => (
            <SubjectCard
              key={idx}
              subject={subject}
              isCurrent={isCurrentSem}
              searchHighlight={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const [data, setData] = useState<SyllabusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"current" | "all">("current");

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/student/syllabus-subjects", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSyllabus(); }, []);

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout currentPage="courses">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-zinc-500">Loading your courses...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout currentPage="courses">
        <div className="max-w-lg mx-auto mt-16 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-white mb-1">Failed to load courses</h2>
          <p className="text-sm text-zinc-500 mb-4">{error}</p>
          <Button onClick={fetchSyllabus} className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // ── No data ───────────────────────────────────────────────────────────
  if (!data?.hasData) {
    return (
      <DashboardLayout currentPage="courses">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white">My Courses</h1>
            <p className="text-sm text-zinc-500 mt-1">Subjects from your college's uploaded syllabus</p>
          </div>

          {/* Student info pill */}
          {data?.student && (
            <div className="flex flex-wrap gap-2">
              {data.student.department && (
                <Badge variant="outline" className="border-zinc-700 text-zinc-400 gap-1.5">
                  <GraduationCap className="w-3 h-3" /> {data.student.department}
                </Badge>
              )}
              {data.student.year && (
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                  Year {data.student.year}
                </Badge>
              )}
              {data.student.semester && (
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                  Semester {data.student.semester}
                </Badge>
              )}
            </div>
          )}

          {/* Empty state */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="flex flex-col items-center py-16 px-6 text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                {data?.isPending ? (
                  <Clock className="w-7 h-7 text-amber-400" />
                ) : (
                  <BookOpen className="w-7 h-7 text-zinc-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {data?.isPending ? "Syllabus Being Processed" : "No Syllabus Available"}
              </h3>
              <p className="text-sm text-zinc-500 max-w-sm mb-5">
                {data?.message}
              </p>
              {data?.isPending && (
                <Button
                  onClick={fetchSyllabus}
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ── Loaded state ──────────────────────────────────────────────────────
  const currentSem = data.currentSemester || data.student.semester || 1;
  const currentSubjects = data.currentSubjects || [];
  const allSemesters = data.allSemesters || {};
  const semesterKeys = Object.keys(allSemesters).map(Number).sort((a, b) => a - b);

  const allSubjectsFlat = Object.values(allSemesters).flat();
  const searchFiltered = searchQuery
    ? allSubjectsFlat.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.code || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const theoryTotal = allSubjectsFlat.filter(s => s.type === "Theory" || !s.type).length;
  const practicalTotal = allSubjectsFlat.filter(s => s.type === "Practical").length;
  const creditsTotal = allSubjectsFlat.reduce((sum, s) => sum + (s.credits || 0), 0);

  return (
    <DashboardLayout currentPage="courses">
      <div className="space-y-6">
        {/* Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">My Courses</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.student.department && (
                <Badge variant="outline" className="border-zinc-700 text-zinc-400 gap-1.5 text-xs">
                  <GraduationCap className="w-3 h-3" /> {data.student.department}
                </Badge>
              )}
              <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                Year {data.student.year}
              </Badge>
              <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-xs">
                Semester {currentSem} — Active
              </Badge>
            </div>
          </div>
          {data.syllabus && (
            <div className="flex items-center gap-2">
              <a
                href={data.syllabus.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                View Syllabus PDF
                <ExternalLink className="w-3 h-3" />
              </a>
              <Button onClick={fetchSyllabus} variant="ghost" size="sm" className="text-zinc-500 hover:text-white h-8 w-8 p-0">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Stats cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "This Year",  value: data.totalSubjectsThisYear || allSubjectsFlat.length, color: "blue",   icon: BookOpen },
            { label: "Theory",     value: theoryTotal,    color: "zinc",   icon: BookMarked },
            { label: "Practical",  value: practicalTotal, color: "purple", icon: Beaker },
            { label: "Credits",    value: creditsTotal > 0 ? creditsTotal : "—", color: "amber", icon: Star },
          ].map(({ label, value, color, icon: Icon }) => (
            <Card key={label} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className={`w-8 h-8 bg-${color}-600/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 text-${color}-400`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search ── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search subjects by name or code..."
            className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-blue-500"
          />
        </div>

        {/* Search results ── */}
        {searchQuery && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-300">
                {searchFiltered.length} result{searchFiltered.length !== 1 ? "s" : ""} for "{searchQuery}"
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 grid gap-2 sm:grid-cols-2">
              {searchFiltered.length === 0 ? (
                <p className="text-sm text-zinc-600 col-span-2 py-4 text-center">No subjects match your search</p>
              ) : (
                searchFiltered.map((subj, i) => (
                  <SubjectCard
                    key={i}
                    subject={subj}
                    isCurrent={(subj.semester || 0) === currentSem}
                    searchHighlight={searchQuery}
                  />
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs: Current Semester vs All Semesters ── */}
        {!searchQuery && (
          <>
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
              <button
                onClick={() => setActiveTab("current")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "current"
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Current Semester
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "all"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                All Semesters
              </button>
            </div>

            {/* Current semester view ── */}
            {activeTab === "current" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <h2 className="text-base font-semibold text-white">
                    Semester {currentSem} — Your Current Subjects
                  </h2>
                </div>

                {currentSubjects.length === 0 ? (
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-10 text-center">
                      <p className="text-sm text-zinc-500">
                        No subjects found for Semester {currentSem}. Your college may not have uploaded the syllabus for this semester yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {currentSubjects.map((subject, idx) => (
                      <SubjectCard
                        key={idx}
                        subject={subject}
                        isCurrent
                        searchHighlight=""
                      />
                    ))}
                  </div>
                )}

                {/* Previous semesters summary ── */}
                {Object.keys(data.previousSemesters || {}).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-zinc-500 mb-3">
                      Previous Semesters
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(data.previousSemesters || {})
                        .sort(([a], [b]) => Number(b) - Number(a))
                        .map(([sem, subjects]) => (
                          <SemesterSection
                            key={sem}
                            semester={Number(sem)}
                            subjects={subjects}
                            isCurrentSem={false}
                            searchQuery=""
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* All semesters view ── */}
            {activeTab === "all" && (
              <div className="space-y-3">
                {semesterKeys.map(sem => (
                  <SemesterSection
                    key={sem}
                    semester={sem}
                    subjects={allSemesters[String(sem)] || []}
                    isCurrentSem={sem === currentSem}
                    searchQuery=""
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Syllabus source info ── */}
        {data.syllabus && (
          <p className="text-xs text-zinc-700 text-center pt-2">
            Syllabus: {data.syllabus.title} · Parsed {new Date(data.syllabus.parsedAt).toLocaleDateString("en-IN")}
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
