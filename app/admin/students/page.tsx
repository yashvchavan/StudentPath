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
  UserPlus,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  AlertCircle
} from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Student {
  student_id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  department?: string
  college?: string
  program?: string
  current_year?: number
  current_semester?: number
  current_gpa?: number
  gender?: string
  enrollment_year?: number
  date_of_birth?: string
  location_preference?: string
  industry_focus?: string
  intensity_level?: string
  is_active?: boolean
  created_at: string
  updated_at?: string
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const itemsPerPage = 10

  // Fetch students from API
  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true)
        setError(null)
        
        const res = await fetch("/api/student/list", { 
          cache: "no-store",
          credentials: 'include', // Important: Include cookies
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        const data = await res.json()
        
        if (!res.ok) {
          throw new Error(data.error || `HTTP error! status: ${res.status}`)
        }
        
        if (data.success) {
          // Convert current_gpa to number and is_active to boolean
          const processed: Student[] = data.students.map((s: any) => ({
            ...s,
            current_gpa: s.current_gpa !== null ? Number(s.current_gpa) : null,
            current_year: s.current_year !== null ? Number(s.current_year) : undefined,
            current_semester: s.current_semester !== null ? Number(s.current_semester) : undefined,
            is_active: s.is_active === 1 || s.is_active === true,
          }))
          setStudents(processed)
          setFilteredStudents(processed)
          console.log(`Loaded ${processed.length} students`)
        } else {
          throw new Error(data.error || "Failed to fetch students")
        }
      } catch (err) {
        console.error("Failed to fetch students:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch students")
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...students]

    if (searchTerm) {
      filtered = filtered.filter(
        s =>
          `${s.first_name ?? ""} ${s.last_name ?? ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.student_id.toString().includes(searchTerm)
      )
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(s => s.department === departmentFilter)
    }

    if (yearFilter !== "all") {
      filtered = filtered.filter(s => s.current_year?.toString() === yearFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(s =>
        statusFilter === "active" ? s.is_active : !s.is_active
      )
    }

    setFilteredStudents(filtered)
    setCurrentPage(1)
  }, [searchTerm, departmentFilter, yearFilter, statusFilter, students])

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const displayedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Get unique departments for filter
  const departments = [...new Set(students.map(s => s.department).filter(Boolean))]

  if (loading) {
    return (
      <AdminShell title="Student Management" description="Search, filter, and manage student records.">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading students...</p>
          </div>
        </div>
      </AdminShell>
    )
  }

  if (error) {
    return (
      <AdminShell title="Student Management" description="Search, filter, and manage student records.">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error loading students:</strong> {error}
            <br />
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </AdminShell>
    )
  }

  return (
    <AdminShell title="Student Management" description="Search, filter, and manage student records.">
      <div className="mb-4">
        <Badge variant="outline" className="text-sm">
          Managing students for your college
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
            <div className="text-2xl font-bold">{filteredStudents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStudents.filter(s => s.is_active).length}
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
              {filteredStudents.filter(s => {
                const studentDate = new Date(s.created_at)
                const now = new Date()
                return studentDate.getMonth() === now.getMonth() && 
                       studentDate.getFullYear() === now.getFullYear()
              }).length}
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
                <SelectItem key={dept} value={dept ?? "unknown"}>
                  {dept ?? "Unknown"}
                </SelectItem>
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
                      <div className="font-medium">{student.department ?? "N/A"}</div>
                      <div className="text-sm text-muted-foreground">
                        Year {student.current_year ?? "N/A"} • GPA: {student.current_gpa !== null && student.current_gpa !== undefined ? student.current_gpa.toFixed(2) : "N/A"}
                      </div>
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
            {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
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