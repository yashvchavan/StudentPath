"use client"

import { useEffect, useState } from "react"
import AdminShell from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash, X } from "lucide-react"

interface Course {
  id: number
  course_name: string
  year: string
  syllab_doc: string
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [showForm, setShowForm] = useState(false)

  const [courseName, setCourseName] = useState("")
  const [year, setYear] = useState<Date | undefined>()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  // 🔹 Fetch all courses for tenant
  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses", { credentials: "include" })
      const data = await res.json()
      if (data.courses) setCourses(data.courses)
    } catch (err) {
      console.error("Error fetching courses:", err)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  // 🔹 Submit new syllabus
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseName || !year || !file) {
      alert("All fields are required")
      return
    }

    const formData = new FormData()
    formData.append("course", courseName)
    formData.append("year", year.getFullYear().toString())
    formData.append("file", file)

    setLoading(true)
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        body: formData,
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok) {
        alert("Course uploaded successfully!")
        setShowForm(false)
        fetchCourses()
        setCourseName("")
        setYear(undefined)
        setFile(null)
      } else {
        alert(data.error || "Something went wrong")
      }
    } catch (err) {
      console.error(err)
      alert("Upload failed")
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Delete syllabus
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this syllabus?")) return

    try {
      const res = await fetch(`/api/courses?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok) fetchCourses()
      else alert(data.error || "Delete failed")
    } catch (err) {
      console.error(err)
      alert("Delete request failed")
    }
  }

  return (
    <AdminShell title="Course Catalog" description="Manage your syllabuses.">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Uploaded Syllabuses</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Upload New Syllabus
        </Button>
      </div>

      {/* 🔹 Upload Form Dropdown */}
      {showForm && (
        <div className="border rounded p-4 mb-6 relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => setShowForm(false)}
          >
            <X className="w-4 h-4" />
          </Button>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Course Dropdown */}
            <div>
              <label className="block text-sm mb-1">Course</label>
              <Select onValueChange={setCourseName}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Computer">Computer</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="ENTC">ENTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year Selector */}
            <div>
              <label className="block text-sm mb-1">Year</label>
              <Select onValueChange={(val) => setYear(new Date(parseInt(val), 0, 1))}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 26 }, (_, i) => 2000 + i).map((yr) => (
                    <SelectItem key={yr} value={yr.toString()}>
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm mb-1">Upload Syllabus (PDF/Doc/JSON)</label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button type="submit" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </form>
        </div>
      )}

      {/* 🔹 Uploaded Courses List */}
      {courses.length === 0 ? (
        <p className="text-sm text-gray-500">No syllabus uploaded yet.</p>
      ) : (
        <ul className="space-y-3">
          {courses.map((c) => (
            <li key={c.id} className="flex items-center justify-between border rounded p-3">
              <div>
                <p className="font-medium">{c.course_name} ({c.year})</p>
                <a
                  href={`https://docs.google.com/viewer?url=${encodeURIComponent(c.syllab_doc)}&embedded=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  View Syllabus
                </a>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(c.id)}
              >
                <Trash className="w-4 h-4 mr-1" /> Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  )
}
