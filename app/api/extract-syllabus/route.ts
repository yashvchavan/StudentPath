import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import pool from "@/lib/db"
import FormData from "form-data"
import axios from "axios"

const FLASK_API_URL = "https://studentpath-rag.onrender.com" // Flask server URL

// ---------------------- POST → Send syllabus PDF to Flask ----------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { course_id, year, semester } = body

    if (!course_id || !year || !semester) {
      return NextResponse.json(
        { error: "Missing required fields: course_id, year, semester" },
        { status: 400 }
      )
    }

    // ✅ Get student info from cookie
    const cookieStore = await cookies()
    const studentCookie = cookieStore.get("studentData")?.value

    if (!studentCookie) {
      return NextResponse.json({ error: "Student not authenticated" }, { status: 401 })
    }

    const studentData = JSON.parse(studentCookie)
    const { student_id, isAuthenticated } = studentData

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    console.log(`👤 Student ID ${student_id} requested syllabus extraction for course ${course_id}`)

    // 🔍 Fetch course details associated with this student
    const connection = await pool.getConnection()
    const [rows] = await connection.execute<any[]>(
      `SELECT course_name, year, syllab_doc 
       FROM courses_adi 
       WHERE course_id = ?`,
      [course_id]
    )
    connection.release()

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const course = rows[0]
    const { course_name: stream, syllab_doc: pdfUrl } = course

    console.log(`📚 Processing syllabus for ${stream} - ${year}`)

    // ⬇️ Download the syllabus PDF from Cloudinary or source URL
    const pdfResponse = await axios.get(pdfUrl, { responseType: "arraybuffer" })
    const pdfBuffer = Buffer.from(pdfResponse.data)

    // 🧾 Prepare form data for Flask ingestion
    const formData = new FormData()
    formData.append("file", pdfBuffer, {
      filename: `${stream}_${year}.pdf`,
      contentType: "application/pdf",
    })
    // Use student_id as tenant_id for consistent tracking
    formData.append("tenant_id", student_id.toString())
    formData.append("year", year)
    formData.append("semester", semester)
    formData.append("stream", stream)
    formData.append("course", "Engineering")

    console.log("🚀 Sending syllabus PDF to Flask ingestion API...")

    // 🔗 Send to Flask API
    const flaskResponse = await axios.post(`${FLASK_API_URL}/ingest`, formData, {
      headers: formData.getHeaders(),
      timeout: 300000, // 5 min timeout for PDF parsing
    })

    if (!flaskResponse.data.success) {
      return NextResponse.json(
        { error: "Flask processing failed", details: flaskResponse.data },
        { status: 500 }
      )
    }

    console.log("✅ Flask processing complete!")

    return NextResponse.json({
      success: true,
      student_id,
      user_info: flaskResponse.data.user_info,
      subjects_till_semester: flaskResponse.data.subjects_till_semester,
      total_semesters_parsed: flaskResponse.data.total_semesters_parsed,
      stream,
      year,
      semester,
    })
  } catch (error: any) {
    console.error("❌ Error in extract-syllabus:", error)

    if (error.response) {
      return NextResponse.json(
        { error: "Flask API error", details: error.response.data },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

// ---------------------- GET → Retrieve already processed syllabus info ----------------------
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const studentCookie = cookieStore.get("studentData")?.value

    if (!studentCookie) {
      return NextResponse.json({ error: "Student not authenticated" }, { status: 401 })
    }

    const studentData = JSON.parse(studentCookie)
    const { student_id, isAuthenticated } = studentData

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    console.log(`🔍 Fetching syllabus info for student: ${student_id}`)

    try {
      // 🔗 Call Flask API to get syllabus info
      const flaskResponse = await axios.post(
        `${FLASK_API_URL}/get_user_info`,
        { student_id: student_id.toString() },
        { headers: { "Content-Type": "application/json" }, timeout: 30000 }
      )

      // Check if Flask returned success
      if (!flaskResponse.data.success) {
        console.log(`ℹ️ No syllabus data found for student ${student_id}`)
        return NextResponse.json({
          success: false,
          hasData: false,
          message: "No syllabus uploaded yet. Please upload your course syllabus first.",
          student_id
        }, { status: 200 }) // Return 200 with hasData: false
      }

      return NextResponse.json({
        success: true,
        hasData: true,
        student_id,
        user_info: flaskResponse.data.user_info,
        subjects_by_semester: flaskResponse.data.subjects_by_semester,
      })

    } catch (flaskError: any) {
      // Handle 404 from Flask (no data found)
      if (flaskError.response?.status === 404) {
        console.log(`ℹ️ No syllabus data found for student ${student_id} (404)`)
        return NextResponse.json({
          success: false,
          hasData: false,
          message: "No syllabus uploaded yet. Please upload your course syllabus first.",
          student_id
        }, { status: 200 }) // Return 200 with hasData: false
      }

      // Handle other Flask errors
      throw flaskError
    }

  } catch (error: any) {
    console.error("❌ Error fetching syllabus info:", error)

    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch syllabus info", 
        details: error.message,
        message: "Unable to connect to syllabus service. Please try again later."
      },
      { status: 500 }
    )
  }
}