"use client"

import { useState, useEffect } from "react"
import AdminShell from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  Search, 
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Calendar,
  Mail,
  Phone,
  GraduationCap
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Student {
  student_id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  department: string
  college: string
  program: string
  current_year: number
  current_semester: number
  current_gpa: number
  gender: string
  enrollment_year: number
  date_of_birth: string
  location_preference: string
  industry_focus: string
  intensity_level: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const FAKE_STUDENTS: Student[] = [
  {
    student_id: 1,
    first_name: "Aarav",
    last_name: "Sharma",
    email: "aarav@example.com",
    phone: "9876543210",
    department: "Computer Science",
    college: "Angel Ondricka",
    program: "B.Tech",
    current_year: 2,
    current_semester: 4,
    current_gpa: 8.5,
    gender: "Male",
    enrollment_year: 2022,
    date_of_birth: "2003-05-12",
    location_preference: "Bangalore",
    industry_focus: "AI/ML",
    intensity_level: "High",
    is_active: true,
    created_at: "2024-09-15",
    updated_at: "2024-09-15",
  },
  {
    student_id: 2,
    first_name: "Neha",
    last_name: "Patel",
    email: "neha@example.com",
    phone: "9876543211",
    department: "Electronics",
    college: "Angel Ondricka",
    program: "B.Tech",
    current_year: 3,
    current_semester: 6,
    current_gpa: 7.9,
    gender: "Female",
    enrollment_year: 2021,
    date_of_birth: "2002-11-20",
    location_preference: "Delhi",
    industry_focus: "VLSI",
    intensity_level: "Medium",
    is_active: false,
    created_at: "2024-08-10",
    updated_at: "2024-08-10",
  },
  {
    student_id: 3,
    first_name: "Rohan",
    last_name: "Verma",
    email: "rohan@example.com",
    phone: "9876543212",
    department: "Mechanical",
    college: "Angel Ondricka",
    program: "B.E.",
    current_year: 4,
    current_semester: 8,
    current_gpa: 7.2,
    gender: "Male",
    enrollment_year: 2020,
    date_of_birth: "2001-01-30",
    location_preference: "Mumbai",
    industry_focus: "Automobile",
    intensity_level: "Low",
    is_active: true,
    created_at: "2024-09-01",
    updated_at: "2024-09-01",
  },
  {
    student_id: 4,
    first_name: "Priya",
    last_name: "Deshmukh",
    email: "priya@example.com",
    phone: "9876543213",
    department: "Civil",
    college: "Angel Ondricka",
    program: "B.Tech",
    current_year: 1,
    current_semester: 2,
    current_gpa: 8.8,
    gender: "Female",
    enrollment_year: 2023,
    date_of_birth: "2004-03-22",
    location_preference: "Pune",
    industry_focus: "Infrastructure",
    intensity_level: "High",
    is_active: true,
    created_at: "2024-07-25",
    updated_at: "2024-07-25",
  },
]

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Apply filters on FAKE_STUDENTS
  useEffect(() => {
    let filtered = FAKE_STUDENTS

    if (searchTerm) {
      filtered = filtered.filter(
        s =>
          `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.student_id.toString().includes(searchTerm)
      )
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(s => s.department === departmentFilter)
    }

    if (yearFilter !== "all") {
      filtered = filtered.filter(s => s.current_year.toString() === yearFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(s =>
        statusFilter === "active" ? s.is_active : !s.is_active
      )
    }

    setStudents(filtered)
  }, [searchTerm, departmentFilter, yearFilter, statusFilter])

  const totalPages = Math.ceil(students.length / itemsPerPage)
  const displayedStudents = students.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Get unique departments for filter
  const departments = [...new Set(FAKE_STUDENTS.map(s => s.department))]

  return (
    <AdminShell title="Student Management" description="Search, filter, and manage student records (demo with fake data).">
      
      <div className="mb-4">
        <Badge variant="outline" className="text-sm">
          Managing students for: Angel Ondricka
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name, email, or ID..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="1">Year 1</SelectItem>
              <SelectItem value="2">Year 2</SelectItem>
              <SelectItem value="3">Year 3</SelectItem>
              <SelectItem value="4">Year 4</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Academic Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrolled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
              {displayedStudents.map((student) => (
                <TableRow key={student.student_id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">ID: {student.student_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="w-3 h-3 mr-1" />
                        <span>{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="w-3 h-3 mr-1" />
                          {student.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{student.department}</div>
                      <div className="text-sm text-muted-foreground">
                        Year {student.current_year} • GPA: {student.current_gpa.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">{student.college}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.is_active ? "default" : "secondary"}>
                      {student.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{new Date(student.created_at).toLocaleDateString()}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, students.length)} of {students.length} students
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
  