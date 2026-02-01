"use client"

import { useEffect, useState } from "react"
import AdminShell from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash, X, ExternalLink, Download, BookOpen, Database, Loader2, CheckCircle, Upload } from "lucide-react"

interface Course {
  id: number
  course_name: string
  year: string
  syllab_doc: string
  isIngested?: boolean
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [showForm, setShowForm] = useState(false)
  const [extracting, setExtracting] = useState<number | null>(null)
  const [ingesting, setIngesting] = useState<number | null>(null)
  const [userInfo, setUserInfo] = useState<string>("")

  const [courseName, setCourseName] = useState("")
  const [year, setYear] = useState<Date | undefined>()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoIngest, setAutoIngest] = useState(true)

  // Year and semester for extraction
  const [extractYear, setExtractYear] = useState("")
  const [extractSemester, setExtractSemester] = useState("")

  // Ingest result
  const [ingestResult, setIngestResult] = useState<{
    success: boolean
    message: string
    courseId?: number
    chunks?: number
    vectors?: number
  } | null>(null)

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

  // 🔹 Ingest syllabus to Vector DB (Pinecone)
  const handleIngestToVectorDB = async (course: Course) => {
    setIngesting(course.id)
    setIngestResult(null)

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pdf_url: course.syllab_doc,
          dept: course.course_name,
          year: course.year,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setIngestResult({
          success: true,
          message: `Successfully ingested ${course.course_name} (${course.year}) to Vector DB`,
          courseId: course.id,
          chunks: data.chunks_processed,
          vectors: data.vectors_stored,
        })
      } else {
        setIngestResult({
          success: false,
          message: data.error || "Failed to ingest syllabus",
          courseId: course.id,
        })
      }
    } catch (err) {
      console.error("Ingest error:", err)
      setIngestResult({
        success: false,
        message: "Network error. Please check if the RAG API is running.",
        courseId: course.id,
      })
    } finally {
      setIngesting(null)
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
        const errorMessage = data.message || data.error || "Failed to extract syllabus"
        alert(`❌ ${errorMessage}`)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to extract syllabus. Network error or server is down.")
    } finally {
      setExtracting(null)
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
        const uploadedCourse = data.course

        // Auto-ingest to vector DB if enabled
        if (autoIngest && uploadedCourse?.syllab_doc) {
          setIngestResult({
            success: true,
            message: `Course uploaded! Now ingesting to Vector DB...`,
          })

          // Trigger vector DB ingestion
          const ingestRes = await fetch("/api/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              pdf_url: uploadedCourse.syllab_doc,
              dept: courseName,
              year: year.getFullYear().toString(),
            }),
          })

          const ingestData = await ingestRes.json()

          if (ingestRes.ok && ingestData.success) {
            setIngestResult({
              success: true,
              message: `Course uploaded and ingested to Vector DB!`,
              chunks: ingestData.chunks_processed,
              vectors: ingestData.vectors_stored,
            })
          } else {
            setIngestResult({
              success: false,
              message: `Course uploaded but vector ingestion failed: ${ingestData.error || "Unknown error"}`,
            })
          }
        } else {
          alert("Course uploaded successfully!")
        }

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
  const handleDelete = async (id: number, course: Course) => {
    if (!confirm("Are you sure you want to delete this syllabus? This will also remove it from the Vector database.")) return

    try {
      // Delete from regular database
      const res = await fetch(`/api/courses?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()

      if (res.ok) {
        // Also delete from vector DB
        try {
          await fetch(`/api/ingest?dept=${encodeURIComponent(course.course_name)}&year=${encodeURIComponent(course.year)}`, {
            method: "DELETE",
            credentials: "include",
          })
        } catch (e) {
          console.log("Vector DB deletion note:", e)
        }
        fetchCourses()
      } else {
        alert(data.error || "Delete failed")
      }
    } catch (err) {
      console.error(err)
      alert("Delete request failed")
    }
  }

  // 🔹 Helper to open/download PDF via proxy route
  const handleViewSyllabus = (url: string, courseName: string, year: string) => {
    const filename = `${courseName}_${year}_Syllabus.pdf`
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
    <AdminShell title="Courses" description="Courses Management & AI Syllabus Ingestion" showRange>
      {/* User Info Display */}
      {userInfo && (
        <div className="mb-4 p-4 bg-gray-100 border border-gray-200 rounded">
          <h3 className="font-semibold text-sm mb-2 text-gray-900">📚 Current User Info:</h3>
          <p className="text-sm text-gray-900">{userInfo}</p>
        </div>
      )}

      {/* Ingest Result Alert */}
      {ingestResult && (
        <Alert className={`mb-4 ${ingestResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          {ingestResult.success ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <X className="w-4 h-4 text-red-600" />
          )}
          <AlertDescription>
            <div className={`font-semibold ${ingestResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {ingestResult.message}
            </div>
            {ingestResult.chunks !== undefined && (
              <div className="text-sm mt-1 flex gap-2">
                <Badge variant="secondary">Chunks: {ingestResult.chunks}</Badge>
                <Badge variant="secondary">Vectors: {ingestResult.vectors}</Badge>
              </div>
            )}
          </AlertDescription>
        </Alert>
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
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upload New Syllabus</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>Upload a syllabus PDF and optionally ingest it to the AI Vector Database</CardDescription>
          </CardHeader>
          <CardContent>
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
                    <SelectItem value="Civil">Civil</SelectItem>
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
                    {Array.from({ length: 6 }, (_, i) => 2020 + i).map((yr) => (
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

              {/* Auto-ingest toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoIngest"
                  checked={autoIngest}
                  onChange={(e) => setAutoIngest(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="autoIngest" className="text-sm">
                  <span className="font-medium">Auto-ingest to AI Vector DB</span>
                  <span className="text-muted-foreground ml-2">(Enables student chatbot queries)</span>
                </label>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {autoIngest && "& Ingest"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 🔹 Uploaded Courses List */}
      {courses.length === 0 ? (
        <p className="text-sm text-gray-500">No syllabus uploaded yet.</p>
      ) : (
        <>
          {/* Extraction Controls */}
          <Card className="mb-4 bg-gray-50">
            <CardHeader className="py-3">
              <CardTitle className="text-base">Extract Syllabus Data</CardTitle>
              <CardDescription>Select student's year and semester to extract relevant subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div>
                  <label className="block text-sm mb-1">Student Year</label>
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
                  <label className="block text-sm mb-1">Current Semester</label>
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
              </div>
            </CardContent>
          </Card>

          <ul className="space-y-3">
            {courses.map((c) => (
              <li key={c.id} className="flex items-center justify-between border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{c.course_name} ({c.year})</p>
                    {ingestResult?.courseId === c.id && ingestResult.success && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <Database className="w-3 h-3 mr-1" />
                        In Vector DB
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-3 mt-2">
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
                  {/* Ingest to Vector DB Button */}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleIngestToVectorDB(c)}
                    disabled={ingesting === c.id}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {ingesting === c.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Ingesting...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-1" />
                        Ingest to AI
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExtractSyllabus(c.id)}
                    disabled={extracting === c.id || !extractYear || !extractSemester}
                  >
                    <BookOpen className="w-4 h-4 mr-1" />
                    {extracting === c.id ? "Extracting..." : "Extract"}
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(c.id, c)}
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