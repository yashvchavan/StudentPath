"use client"

import { useEffect, useState } from "react"
import AdminShell from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash, X, ExternalLink, Download, BookOpen } from "lucide-react"

interface Course {
  id: number
  course_name: string
  year: string
  syllab_doc: string
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [showForm, setShowForm] = useState(false)
  const [extracting, setExtracting] = useState<number | null>(null)
  const [userInfo, setUserInfo] = useState<string>("")

  const [courseName, setCourseName] = useState("")
  const [year, setYear] = useState<Date | undefined>()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  // Year and semester for extraction
  const [extractYear, setExtractYear] = useState("")
  const [extractSemester, setExtractSemester] = useState("")

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

  // 🔹 Extract syllabus using Flask
  const handleExtractSyllabus = async (courseId: number) => {
    if (!extractYear || !extractSemester) {
      alert("Please select both year and semester for extraction")
      return
    }

    setExtracting(courseId)
    try {
      const res = await fetch("/api/extract-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          year: extractYear,
          semester: extractSemester,
        }),
        credentials: "include",
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setUserInfo(data.user_info)
        alert(`✅ Syllabus extracted successfully!\n\nSubjects found: ${data.subjects_till_semester?.length || 0}\nSemesters parsed: ${data.total_semesters_parsed}`)
      } else {
        // Show detailed error message with troubleshooting steps
        const errorMessage = data.message || data.error || "Failed to extract syllabus";
        alert(`❌ ${errorMessage}`);
      }
    } catch (err) {
      console.error(err)
      alert("Failed to extract syllabus. Network error or server is down.")
    } finally {
      setExtracting(null)
    }
  }

  // 🔹 Fetch existing user info
  const fetchUserInfo = async () => {
    try {
      const res = await fetch("/api/extract-syllabus", {
        method: "GET",
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setUserInfo(data.user_info)
        }
      }
    } catch (err) {
      console.error("Error fetching user info:", err)
    }
  }

  useEffect(() => {
    fetchCourses()
    fetchUserInfo()
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

  // 🔹 Helper to open/download PDF via proxy route
  const handleViewSyllabus = (url: string, courseName: string, year: string) => {
    // Create a proper filename
    const filename = `${courseName}_${year}_Syllabus.pdf`
    // Use our proxy route to serve the PDF with proper headers and filename
    const proxyUrl = `/api/view-pdf?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`
    window.open(proxyUrl, "_blank", "noopener,noreferrer")
  }

  // 🔹 Helper to download PDF
  const handleDownloadSyllabus = (url: string, courseName: string, year: string) => {
    const filename = `${courseName}_${year}_Syllabus.pdf`
    const proxyUrl = `/api/view-pdf?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&download=true`
    window.open(proxyUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <AdminShell title="Courses" description="Courses Management" showRange>
      {/* User Info Display */}
      {userInfo && (
        <div className="mb-4 p-4 bg-gray-100 border border-gray-200 rounded">
          <h3 className="font-semibold text-sm mb-2 text-gray-900">📚 Current User Info:</h3>
          <p className="text-sm text-gray-900">{userInfo}</p>
        </div>
      )}

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
        <>
          {/* Extraction Controls */}
          <div className="mb-4 p-4 border rounded bg-gray-100 border-gray-200">
            <h3 className="font-semibold mb-3 text-gray-900">Extract Syllabus Data</h3>
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm mb-1 text-gray-700">Student Year</label>
                <Select onValueChange={setExtractYear}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First">First Year</SelectItem>
                    <SelectItem value="Second">Second Year</SelectItem>
                    <SelectItem value="Third">Third Year</SelectItem>
                    <SelectItem value="Fourth">Fourth Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700">Current Semester</label>
                <Select onValueChange={setExtractSemester}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {["I", "II", "III", "IV", "V", "VI", "VII", "VIII"].map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-gray-700 flex-1">
                ℹ️ Select student's current year and semester to extract relevant subjects
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {courses.map((c) => (
              <li key={c.id} className="flex items-center justify-between border rounded p-3">
                <div className="flex-1">
                  <p className="font-medium">{c.course_name} ({c.year})</p>
                  <div className="flex gap-3 mt-1">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-blue-600 underline text-sm"
                      onClick={() => handleViewSyllabus(c.syllab_doc, c.course_name, c.year)}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Syllabus
                    </Button>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-green-600 underline text-sm"
                      onClick={() => handleDownloadSyllabus(c.syllab_doc, c.course_name, c.year)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download PDF
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExtractSyllabus(c.id)}
                    disabled={extracting === c.id || !extractYear || !extractSemester}
                  >
                    <BookOpen className="w-4 h-4 mr-1" />
                    {extracting === c.id ? "Extracting..." : "Extract Syllabus"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </AdminShell>
  )
}