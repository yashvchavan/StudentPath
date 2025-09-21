"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Filter, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

interface Course {
  id: number;
  name: string;
  department: string;
  credits: number;
  is_active: boolean;
}

export default function AdminCoursesPage() {
  // Fake courses
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, name: "Computer Networks", department: "CSE", credits: 3, is_active: true },
    { id: 2, name: "Digital Electronics", department: "ECE", credits: 4, is_active: false },
    { id: 3, name: "Thermodynamics", department: "ME", credits: 3, is_active: true },
    { id: 4, name: "Database Systems", department: "CSE", credits: 4, is_active: true },
    { id: 5, name: "Control Systems", department: "ECE", credits: 3, is_active: false },
    { id: 6, name: "Fluid Mechanics", department: "ME", credits: 4, is_active: true },
  ]);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [creditsFilter, setCreditsFilter] = useState("all");

  // Filtered courses
  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || c.department === departmentFilter;
    const matchesCredits = creditsFilter === "all" || c.credits === Number(creditsFilter);
    return matchesSearch && matchesDepartment && matchesCredits;
  });

  // Toggle course active status
  const toggleStatus = (id: number) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, is_active: !c.is_active } : c
      )
    );
  };

  // Delete course
  const deleteCourse = (id: number) => {
    if (confirm("Are you sure you want to delete this course?")) {
      setCourses((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <AdminShell title="Course Catalog" description="Create, edit, and organize courses.">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Input
          placeholder="Search courses"
          className="max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="CSE">CSE</SelectItem>
            <SelectItem value="ECE">ECE</SelectItem>
            <SelectItem value="ME">ME</SelectItem>
          </SelectContent>
        </Select>

        <Select value={creditsFilter} onValueChange={setCreditsFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Credits" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Credits</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
          </SelectContent>
        </Select>

        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Course
        </Button>
      </div>

      {/* Courses Table */}
      <div className="rounded-lg border p-4">
        {filteredCourses.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No courses found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{course.id}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{course.department}</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${
                        course.is_active
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-red-100 text-red-700 border border-red-300"
                      } cursor-pointer`}
                      onClick={() => toggleStatus(course.id)}
                    >
                      {course.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => deleteCourse(course.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminShell>
  );
}
