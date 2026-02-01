"use client"

import { useEffect, useState } from "react"
import AdminShell from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash, X, ExternalLink, Download, Database, Loader2, CheckCircle, Upload, FileText, Calendar } from "lucide-react"

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
  const [ingesting, setIngesting] = useState<number | null>(null)

  const [courseName, setCourseName] = useState("")
  const [year, setYear] = useState<Date | undefined>()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoIngest, setAutoIngest] = useState(true)

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
    <AdminShell
      title="Courses"
      description="Courses Management & AI Syllabus Ingestion"
      rightContent={
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-900/30"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload New Syllabus
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Ingest Result Alert */}
        {ingestResult && (
          <Alert className={`border-2 ${ingestResult.success ? 'border-emerald-500/50 bg-emerald-950/30' : 'border-red-500/50 bg-red-950/30'}`}>
            {ingestResult.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <X className="w-5 h-5 text-red-400" />
            )}
            <AlertDescription>
              <div className={`font-semibold text-base ${ingestResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
                {ingestResult.message}
              </div>
              {ingestResult.chunks !== undefined && (
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700">
                    Chunks: {ingestResult.chunks}
                  </Badge>
                  <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700">
                    Vectors: {ingestResult.vectors}
                  </Badge>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* 🔹 Upload Form */}
        {showForm && (
          <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-zinc-100">Upload New Syllabus</CardTitle>
                  <CardDescription className="text-zinc-400 mt-1">
                    Upload a syllabus PDF and optionally ingest it to the AI Vector Database
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Course Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Course Department</label>
                  <Select onValueChange={setCourseName}>
                    <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select course department" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="Mechanical" className="text-zinc-100 focus:bg-zinc-700">Mechanical Engineering</SelectItem>
                      <SelectItem value="Electrical" className="text-zinc-100 focus:bg-zinc-700">Electrical Engineering</SelectItem>
                      <SelectItem value="Computer" className="text-zinc-100 focus:bg-zinc-700">Computer Engineering</SelectItem>
                      <SelectItem value="IT" className="text-zinc-100 focus:bg-zinc-700">Information Technology</SelectItem>
                      <SelectItem value="ENTC" className="text-zinc-100 focus:bg-zinc-700">Electronics & Telecommunication</SelectItem>
                      <SelectItem value="Civil" className="text-zinc-100 focus:bg-zinc-700">Civil Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Selector */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Academic Year</label>
                  <Select onValueChange={(val) => setYear(new Date(parseInt(val), 0, 1))}>
                    <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {Array.from({ length: 6 }, (_, i) => 2020 + i).map((yr) => (
                        <SelectItem key={yr} value={yr.toString()} className="text-zinc-100 focus:bg-zinc-700">
                          {yr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Syllabus Document</label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.json"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 file:bg-zinc-700 file:text-zinc-100 file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md hover:file:bg-zinc-600"
                  />
                  <p className="text-xs text-zinc-500 mt-2">Supported formats: PDF, DOC, DOCX, JSON</p>
                </div>

                {/* Auto-ingest toggle */}
                <div className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <input
                    type="checkbox"
                    id="autoIngest"
                    checked={autoIngest}
                    onChange={(e) => setAutoIngest(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-zinc-600 bg-zinc-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900"
                  />
                  <label htmlFor="autoIngest" className="text-sm cursor-pointer">
                    <span className="font-semibold text-zinc-200 block">Auto-ingest to AI Vector Database</span>
                    <span className="text-zinc-400 mt-1 block">Automatically process and index this syllabus for AI-powered student queries</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-900/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {autoIngest && "& Ingest to AI"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 🔹 Uploaded Courses List */}
        {courses.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900/30">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-zinc-700 mb-4" />
              <p className="text-lg font-medium text-zinc-400">No syllabuses uploaded yet</p>
              <p className="text-sm text-zinc-500 mt-1">Upload your first course syllabus to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {courses.map((c) => (
              <Card
                key={c.id}
                className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm hover:bg-zinc-900/70 transition-all duration-200 hover:shadow-lg hover:shadow-blue-900/10"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Course Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-900/30 rounded-lg border border-blue-800/50">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-zinc-100">{c.course_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Academic Year {c.year}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {ingestResult?.courseId === c.id && ingestResult.success && (
                        <Badge className="bg-emerald-900/40 text-emerald-300 border-emerald-700/50">
                          <Database className="w-3 h-3 mr-1.5" />
                          Ingested to Vector DB
                        </Badge>
                      )}

                      {/* Action Links */}
                      <div className="flex gap-4">
                        <Button
                          variant="link"
                          className="p-0 h-auto text-blue-400 hover:text-blue-300 text-sm font-medium"
                          onClick={() => handleViewSyllabus(c.syllab_doc, c.course_name, c.year)}
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          View Syllabus
                        </Button>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                          onClick={() => handleDownloadSyllabus(c.syllab_doc, c.course_name, c.year)}
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Download PDF
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {/* Ingest to Vector DB Button */}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleIngestToVectorDB(c)}
                        disabled={ingesting === c.id}
                        className="bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-900/30"
                      >
                        {ingesting === c.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            Ingesting...
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4 mr-1.5" />
                            Ingest to AI
                          </>
                        )}
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(c.id, c)}
                        className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-900/30"
                      >
                        <Trash className="w-4 h-4 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}