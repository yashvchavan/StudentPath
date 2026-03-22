"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Building2,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  TrendingUp,
  UserCheck,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";

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
  tpo: {
    id: number;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    hodName: "",
    hodEmail: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/departments", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments);
      } else {
        toast.error(data.error || "Failed to fetch departments");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Name and code are required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Department created successfully");
        setIsCreateDialogOpen(false);
        setFormData({ name: "", code: "", hodName: "", hodEmail: "" });
        fetchDepartments();
      } else {
        toast.error(data.error || "Failed to create department");
      }
    } catch (error) {
      console.error("Error creating department:", error);
      toast.error("Failed to create department");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedDepartment) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/departments/${selectedDepartment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Department updated successfully");
        setIsEditDialogOpen(false);
        setSelectedDepartment(null);
        setFormData({ name: "", code: "", hodName: "", hodEmail: "" });
        fetchDepartments();
      } else {
        toast.error(data.error || "Failed to update department");
      }
    } catch (error) {
      console.error("Error updating department:", error);
      toast.error("Failed to update department");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/departments/${selectedDepartment.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Department deactivated");
        setIsDeleteDialogOpen(false);
        setSelectedDepartment(null);
        fetchDepartments();
      } else {
        toast.error(data.error || "Failed to delete department");
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error("Failed to delete department");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (dept: Department) => {
    setSelectedDepartment(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      hodName: dept.hodName || "",
      hodEmail: dept.hodEmail || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (dept: Department) => {
    setSelectedDepartment(dept);
    setIsDeleteDialogOpen(true);
  };

  // Filter departments by search
  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalStudents = departments.reduce((sum, d) => sum + d.studentCount, 0);
  const totalPlaced = departments.reduce((sum, d) => sum + d.placedCount, 0);
  const overallPlacementRate = totalStudents > 0 ? Math.round((totalPlaced / totalStudents) * 100) : 0;

  return (
    <AdminShell title="Departments" description="Manage college departments and assign TPO users">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{departments.length}</p>
                <p className="text-xs text-zinc-400">Total Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalStudents}</p>
                <p className="text-xs text-zinc-400">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalPlaced}</p>
                <p className="text-xs text-zinc-400">Students Placed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{overallPlacementRate}%</p>
                <p className="text-xs text-zinc-400">Placement Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-700 text-white"
          />
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Add a new department to your college
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Computer Science"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Department Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g. CSE"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="bg-zinc-800 border-zinc-700"
                />
                <p className="text-xs text-zinc-500">Alphanumeric only, will be uppercased</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hodName">HOD Name</Label>
                <Input
                  id="hodName"
                  placeholder="e.g. Dr. John Smith"
                  value={formData.hodName}
                  onChange={(e) => setFormData({ ...formData, hodName: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hodEmail">HOD Email</Label>
                <Input
                  id="hodEmail"
                  type="email"
                  placeholder="e.g. hod.cse@college.edu"
                  value={formData.hodEmail}
                  onChange={(e) => setFormData({ ...formData, hodEmail: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-zinc-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Department
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Departments Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-400">
                {searchQuery ? "No departments found matching your search" : "No departments yet"}
              </p>
              {!searchQuery && (
                <Button
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first department
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Department</TableHead>
                  <TableHead className="text-zinc-400">Code</TableHead>
                  <TableHead className="text-zinc-400">HOD</TableHead>
                  <TableHead className="text-zinc-400">TPO Assigned</TableHead>
                  <TableHead className="text-zinc-400 text-right">Students</TableHead>
                  <TableHead className="text-zinc-400 text-right">Placed</TableHead>
                  <TableHead className="text-zinc-400 text-right">Rate</TableHead>
                  <TableHead className="text-zinc-400 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((dept) => (
                  <TableRow key={dept.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="font-medium text-white">{dept.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                        {dept.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {dept.hodName || <span className="text-zinc-600">Not assigned</span>}
                    </TableCell>
                    <TableCell>
                      {dept.tpo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center">
                            <span className="text-xs text-purple-400 font-medium">
                              {dept.tpo.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm text-zinc-300">{dept.tpo.name}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-sm">No TPO</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">{dept.studentCount}</TableCell>
                    <TableCell className="text-right text-emerald-400">{dept.placedCount}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={`${
                          dept.placementRate >= 70
                            ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/30"
                            : dept.placementRate >= 40
                            ? "bg-amber-600/20 text-amber-400 border-amber-600/30"
                            : "bg-red-600/20 text-red-400 border-red-600/30"
                        }`}
                      >
                        {dept.placementRate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(dept)}
                            className="cursor-pointer text-zinc-300 focus:bg-zinc-800 focus:text-white"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(dept)}
                            className="cursor-pointer text-red-400 focus:bg-red-600/20 focus:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Deactivate
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update department information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Department Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Department Code *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hodName">HOD Name</Label>
              <Input
                id="edit-hodName"
                value={formData.hodName}
                onChange={(e) => setFormData({ ...formData, hodName: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hodEmail">HOD Email</Label>
              <Input
                id="edit-hodEmail"
                type="email"
                value={formData.hodEmail}
                onChange={(e) => setFormData({ ...formData, hodEmail: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-zinc-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Deactivate Department?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will deactivate the department "{selectedDepartment?.name}" and any TPO users
              assigned to it. Students will remain but won't be associated with this department.
              This action can be undone later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
