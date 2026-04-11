"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AdminShell from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Building2, Plus, MoreHorizontal, Pencil, Trash2, Users, TrendingUp,
  UserCheck, Loader2, Search, BookOpen, Upload, FileText, X, Download,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────
interface Department {
  id: number;
  name: string;
  code: string;
  hodName: string | null;
  hodEmail: string | null;
  isActive: boolean;
  studentCount: number;
  placedCount: number;
  placementRate: number;
  tpo: { id: number; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface SyllabusFile {
  id: number;
  department_id: number;
  year: number;
  title: string;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

// ── Syllabus Upload Panel ─────────────────────────────────────────────────
function SyllabusPanel({ dept, onClose }: { dept: Department; onClose: () => void }) {
  const [files, setFiles] = useState<SyllabusFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(1);
  const [syllabusTitle, setSyllabusTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSyllabus = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/departments/${dept.id}/syllabus`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setFiles(data.files || []);
    } catch { setFiles([]); }
    finally { setLoading(false); }
  }, [dept.id]);

  useEffect(() => { fetchSyllabus(); }, [fetchSyllabus]);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) { toast.error("Please select a PDF file"); return; }
    if (!syllabusTitle.trim()) { toast.error("Please enter a title"); return; }
    if (file.type !== "application/pdf") { toast.error("Only PDF files are allowed"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("File must be under 20MB"); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("year", String(selectedYear));
      formData.append("title", syllabusTitle.trim());

      const res = await fetch(`/api/admin/departments/${dept.id}/syllabus`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast.success("Syllabus uploaded successfully");
      setSyllabusTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchSyllabus();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: number) => {
    try {
      const res = await fetch(`/api/admin/departments/${dept.id}/syllabus/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success("Syllabus removed");
      fetchSyllabus();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filesByYear = [1, 2, 3, 4].map(y => ({
    year: y,
    files: files.filter(f => f.year === y),
  }));

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-end">
      <div className="w-full max-w-xl h-full bg-zinc-950 border-l border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Syllabus / Course Material</h2>
            <p className="text-sm text-zinc-500">{dept.name} ({dept.code})</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Form */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 space-y-3">
          <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Upload New Syllabus</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-zinc-500">Year</Label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-zinc-500">Title</Label>
              <Input
                value={syllabusTitle}
                onChange={e => setSyllabusTitle(e.target.value)}
                placeholder="e.g. Semester 3 Syllabus"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 border-dashed rounded-lg cursor-pointer hover:border-zinc-500 transition-colors">
              <FileText className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-400">
                {fileInputRef.current?.files?.[0]?.name || "Choose PDF file (max 20MB)"}
              </span>
              <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={() => {}} />
            </label>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-4 whitespace-nowrap"
            >
              {uploading ? (
                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Uploading</>
              ) : (
                <><Upload className="w-3.5 h-3.5 mr-2" />Upload</>
              )}
            </Button>
          </div>
        </div>

        {/* Files by Year */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            filesByYear.map(({ year, files: yearFiles }) => (
              <div key={year}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-zinc-300">Year {year}</span>
                  <span className="text-xs text-zinc-600">({yearFiles.length} file{yearFiles.length !== 1 ? "s" : ""})</span>
                </div>
                {yearFiles.length === 0 ? (
                  <div className="px-4 py-3 bg-zinc-900 border border-zinc-800 border-dashed rounded-lg text-sm text-zinc-600 text-center">
                    No syllabus uploaded for Year {year}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {yearFiles.map(file => (
                      <div key={file.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg group">
                        <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-200 truncate">{file.title}</p>
                          <p className="text-xs text-zinc-600 truncate">{file.file_name}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="p-1.5 rounded hover:bg-red-600/20 text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [syllabusDept, setSyllabusDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "", hodName: "", hodEmail: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/departments", { credentials: "include" });
      const data = await res.json();
      if (data.success) setDepartments(data.departments);
      else toast.error(data.error || "Failed to fetch departments");
    } catch { toast.error("Failed to fetch departments"); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.code.trim()) { toast.error("Name and code are required"); return; }
    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/departments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Department created");
        setIsCreateDialogOpen(false);
        setFormData({ name: "", code: "", hodName: "", hodEmail: "" });
        fetchDepartments();
      } else toast.error(data.error || "Failed to create department");
    } catch { toast.error("Failed to create department"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!selectedDepartment) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/departments/${selectedDepartment.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Department updated");
        setIsEditDialogOpen(false);
        setSelectedDepartment(null);
        fetchDepartments();
      } else toast.error(data.error || "Failed to update");
    } catch { toast.error("Failed to update"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/departments/${selectedDepartment.id}`, {
        method: "DELETE", credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Department deactivated");
        setIsDeleteDialogOpen(false);
        fetchDepartments();
      } else toast.error(data.error || "Failed");
    } catch { toast.error("Failed"); }
    finally { setSubmitting(false); }
  };

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = departments.reduce((s, d) => s + d.studentCount, 0);
  const totalPlaced = departments.reduce((s, d) => s + d.placedCount, 0);
  const overallRate = totalStudents > 0 ? Math.round((totalPlaced / totalStudents) * 100) : 0;

  return (
    <AdminShell title="Departments" description="Manage departments, assign TPO users, and upload syllabus materials">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Departments", value: departments.length, color: "blue",   Icon: Building2 },
          { label: "Total Students",    value: totalStudents,       color: "emerald", Icon: Users },
          { label: "Students Placed",   value: totalPlaced,         color: "purple",  Icon: UserCheck },
          { label: "Placement Rate",    value: `${overallRate}%`,   color: "amber",   Icon: TrendingUp },
        ].map(({ label, value, color, Icon }) => (
          <Card key={label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 bg-${color}-600/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-zinc-400">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-700 text-white"
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription className="text-zinc-400">Add a new department to your college</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {[
                { id: "name", label: "Department Name *", placeholder: "e.g. Computer Engineering", key: "name" as const },
                { id: "code", label: "Department Code *", placeholder: "e.g. CE", key: "code" as const },
                { id: "hodName", label: "HOD Name", placeholder: "e.g. Dr. Sharma", key: "hodName" as const },
                { id: "hodEmail", label: "HOD Email", placeholder: "hod@college.edu", key: "hodEmail" as const },
              ].map(({ id, label, placeholder, key }) => (
                <div key={id} className="space-y-1.5">
                  <Label htmlFor={id} className="text-sm text-zinc-300">{label}</Label>
                  <Input
                    id={id} placeholder={placeholder}
                    value={formData[key]}
                    onChange={e => setFormData({ ...formData, [key]: key === "code" ? e.target.value.toUpperCase() : e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-zinc-700 text-zinc-300">Cancel</Button>
              <Button onClick={handleCreate} disabled={submitting} className="bg-blue-600 hover:bg-blue-500">
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
              <p className="text-zinc-500 text-sm">{searchQuery ? "No departments match your search" : "No departments yet"}</p>
              {!searchQuery && (
                <Button className="mt-4 bg-blue-600 hover:bg-blue-500 text-sm" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Create first department
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Department</TableHead>
                  <TableHead className="text-zinc-400">HOD</TableHead>
                  <TableHead className="text-zinc-400">TPO</TableHead>
                  <TableHead className="text-zinc-400 text-right">Students</TableHead>
                  <TableHead className="text-zinc-400 text-right">Placed</TableHead>
                  <TableHead className="text-zinc-400 text-right">Rate</TableHead>
                  <TableHead className="text-zinc-400">Syllabus</TableHead>
                  <TableHead className="text-zinc-400 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(dept => (
                  <TableRow key={dept.id} className="border-zinc-800 hover:bg-zinc-800/40">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white text-sm">{dept.name}</p>
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs mt-0.5">{dept.code}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {dept.hodName || <span className="text-zinc-600">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {dept.tpo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center">
                            <span className="text-xs text-purple-400 font-medium">{dept.tpo.name.charAt(0)}</span>
                          </div>
                          <span className="text-zinc-300 text-xs">{dept.tpo.name}</span>
                        </div>
                      ) : <span className="text-zinc-600 text-xs">No TPO</span>}
                    </TableCell>
                    <TableCell className="text-right text-zinc-200 text-sm">{dept.studentCount}</TableCell>
                    <TableCell className="text-right text-emerald-400 text-sm">{dept.placedCount}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={
                        dept.placementRate >= 70 ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/30" :
                        dept.placementRate >= 40 ? "bg-amber-600/20 text-amber-400 border-amber-600/30" :
                                                   "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }>
                        {dept.placementRate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 border-zinc-700 text-zinc-300 hover:text-white hover:border-blue-500 hover:bg-blue-600/10 text-xs"
                        onClick={() => setSyllabusDept(dept)}
                      >
                        <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Syllabus
                      </Button>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700">
                          <DropdownMenuItem
                            onClick={() => { setSelectedDepartment(dept); setFormData({ name: dept.name, code: dept.code, hodName: dept.hodName || "", hodEmail: dept.hodEmail || "" }); setIsEditDialogOpen(true); }}
                            className="cursor-pointer text-zinc-300 focus:bg-zinc-800 focus:text-white"
                          >
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { setSelectedDepartment(dept); setIsDeleteDialogOpen(true); }}
                            className="cursor-pointer text-red-400 focus:bg-red-600/20 focus:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Syllabus Slide Panel */}
      {syllabusDept && <SyllabusPanel dept={syllabusDept} onClose={() => setSyllabusDept(null)} />}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription className="text-zinc-400">Update department information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[
              { id: "edit-name", label: "Department Name *", key: "name" as const },
              { id: "edit-code", label: "Department Code *", key: "code" as const },
              { id: "edit-hod", label: "HOD Name", key: "hodName" as const },
              { id: "edit-hodEmail", label: "HOD Email", key: "hodEmail" as const },
            ].map(({ id, label, key }) => (
              <div key={id} className="space-y-1.5">
                <Label htmlFor={id} className="text-sm text-zinc-300">{label}</Label>
                <Input
                  id={id} value={formData[key]}
                  onChange={e => setFormData({ ...formData, [key]: key === "code" ? e.target.value.toUpperCase() : e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-zinc-700 text-zinc-300">Cancel</Button>
            <Button onClick={handleEdit} disabled={submitting} className="bg-blue-600 hover:bg-blue-500">
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Deactivate Department?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will deactivate "{selectedDepartment?.name}". Students remain but won't be associated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting} className="bg-red-600 hover:bg-red-700">
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
