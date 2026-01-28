"use client"

import { useState, useEffect } from "react"
import AdminShell from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Database, CheckCircle, XCircle, Loader2, Trash2, Upload, FileText, RefreshCw } from "lucide-react"

interface IngestResponse {
  success: boolean
  message: string
  chunks_processed?: number
  vectors_stored?: number
}

interface HealthStatus {
  status: string
  pinecone_connected?: boolean
  openai_connected?: boolean
}

interface Course {
  id: number
  course_name: string
  year: string
  syllab_doc: string
}

export default function AdminAIPage() {
  const [pdfUrl, setPdfUrl] = useState("")
  const [dept, setDept] = useState("")
  const [year, setYear] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IngestResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [checkingHealth, setCheckingHealth] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [ingesting, setIngesting] = useState<number | null>(null)

  // Check RAG API health on mount
  useEffect(() => {
    checkHealth()
    fetchCourses()
  }, [])

  // Fetch available courses/syllabuses
  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses", { credentials: "include" })
      const data = await res.json()
      if (data.courses) setCourses(data.courses)
    } catch (err) {
      console.error("Error fetching courses:", err)
    }
  }

  // Check RAG API health
  const checkHealth = async () => {
    setCheckingHealth(true)
    try {
      const res = await fetch("/api/rag-chat", {
        method: "GET",
        credentials: "include",
      })
      const data = await res.json()
      setHealthStatus(data.rag_api || data)
    } catch (err) {
      console.error("Health check failed:", err)
      setHealthStatus({ status: "unhealthy" })
    } finally {
      setCheckingHealth(false)
    }
  }

  // Ingest syllabus from uploaded course
  const handleIngestFromCourse = async (course: Course) => {
    setIngesting(course.id)
    setResult(null)
    setError(null)

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
        setResult({
          success: true,
          message: `Successfully ingested ${course.course_name} (${course.year})`,
          chunks_processed: data.chunks_processed,
          vectors_stored: data.vectors_stored,
        })
      } else {
        setError(data.error || "Failed to ingest syllabus")
      }
    } catch (err) {
      console.error("Ingest error:", err)
      setError("Network error. Please check if the RAG API is running.")
    } finally {
      setIngesting(null)
    }
  }

  // Ingest syllabus from URL
  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pdf_url: pdfUrl,
          dept,
          year,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setResult(data)
        // Clear form
        setPdfUrl("")
        setDept("")
        setYear("")
      } else {
        setError(data.error || "Failed to ingest syllabus")
      }
    } catch (err) {
      console.error("Ingest error:", err)
      setError("Network error. Please check if the RAG API is running.")
    } finally {
      setLoading(false)
    }
  }

  // Delete syllabus from vector DB
  const handleDelete = async () => {
    if (!dept || !year) {
      alert("Please fill in department and year to delete")
      return
    }

    if (!confirm(`Are you sure you want to delete syllabus for ${dept} ${year}?`)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/ingest?dept=${encodeURIComponent(dept)}&year=${encodeURIComponent(year)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      const data = await res.json()

      if (res.ok) {
        alert("Syllabus deleted successfully from vector database")
        setDept("")
        setYear("")
      } else {
        setError(data.error || "Failed to delete syllabus")
      }
    } catch (err) {
      console.error("Delete error:", err)
      setError("Network error. Please check if the RAG API is running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminShell title="AI & RAG" description="Manage AI-powered syllabus ingestion for student chatbot">
      <div className="space-y-6">
        {/* Health Check Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              RAG API Health Status
            </CardTitle>
            <CardDescription>
              Check connection to Pinecone vector database and OpenAI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkHealth} disabled={checkingHealth} variant="outline">
              {checkingHealth ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Health
                </>
              )}
            </Button>

            {healthStatus && (
              <Alert className={healthStatus.status === "healthy" ? "border-green-500" : "border-red-500"}>
                <AlertDescription className="space-y-2">
                  <div className="flex items-center gap-2">
                    {healthStatus.status === "healthy" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-semibold">
                      Status: {healthStatus.status === "healthy" ? "Healthy" : "Unhealthy"}
                    </span>
                  </div>
                  {healthStatus.pinecone_connected !== undefined && (
                    <div className="text-sm">
                      Pinecone: {healthStatus.pinecone_connected ? "✅ Connected" : "❌ Disconnected"}
                    </div>
                  )}
                  {healthStatus.openai_connected !== undefined && (
                    <div className="text-sm">
                      OpenAI: {healthStatus.openai_connected ? "✅ Connected" : "❌ Disconnected"}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Quick Ingest from Uploaded Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quick Ingest from Uploaded Syllabuses
            </CardTitle>
            <CardDescription>
              Ingest syllabuses that have already been uploaded to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No syllabuses uploaded yet. Go to Courses page to upload syllabuses first.
              </p>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{course.course_name}</p>
                        <p className="text-sm text-muted-foreground">Year: {course.year}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleIngestFromCourse(course)}
                      disabled={ingesting === course.id}
                      size="sm"
                    >
                      {ingesting === course.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Ingesting...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Ingest to Vector DB
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Ingest Card */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Ingest - Syllabus from URL</CardTitle>
            <CardDescription>
              Directly ingest a PDF from a Cloudinary URL into the vector database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIngest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pdf_url">PDF URL (Cloudinary)</Label>
                <Input
                  id="pdf_url"
                  type="url"
                  placeholder="https://res.cloudinary.com/..."
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Paste the Cloudinary URL of the syllabus PDF
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dept">Department</Label>
                  <Select value={dept} onValueChange={setDept} required>
                    <SelectTrigger id="dept">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer">Computer</SelectItem>
                      <SelectItem value="Mechanical">Mechanical</SelectItem>
                      <SelectItem value="Electrical">Electrical</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="ENTC">ENTC</SelectItem>
                      <SelectItem value="Civil">Civil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select value={year} onValueChange={setYear} required>
                    <SelectTrigger id="year">
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
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Ingesting...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Ingest Syllabus
                    </>
                  )}
                </Button>

                <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete from Vector DB
                </Button>
              </div>
            </form>

            {/* Success Message */}
            {result && (
              <Alert className="mt-4 border-green-500">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription>
                  <div className="font-semibold text-green-600">{result.message}</div>
                  <div className="text-sm mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Chunks processed: {result.chunks_processed}</Badge>
                      <Badge variant="secondary">Vectors stored: {result.vectors_stored}</Badge>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert className="mt-4" variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <h4 className="font-semibold mb-2">How the RAG System Works</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li><strong>Upload:</strong> Upload syllabus PDFs in the Courses page</li>
              <li><strong>Ingest:</strong> Use this page to ingest syllabuses into the vector database</li>
              <li><strong>Embeddings:</strong> The system creates semantic embeddings using OpenAI</li>
              <li><strong>Storage:</strong> Vectors are stored in Pinecone for fast retrieval</li>
              <li><strong>Query:</strong> Students can ask questions and get accurate, contextual answers</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
