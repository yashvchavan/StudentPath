// app/api/extract-syllabus/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import pool from "@/lib/db"
import FormData from "form-data"
import axios from "axios"

const FLASK_API_URL = "http://127.0.0.1:8000" // Your Flask server URL

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

    // Get tenant_id from cookies
    const cookieStore = await cookies()
    const collegeData = cookieStore.get("collegeData")?.value

    if (!collegeData) {
      return NextResponse.json({ error: "Tenant not found in cookies" }, { status: 401 })
    }

    const { id: tenantId } = JSON.parse(collegeData)

    // Fetch course details from database
    const connection = await pool.getConnection()
    const [rows] = await connection.execute<any[]>(
      `SELECT course_name, year, syllab_doc FROM courses_adi WHERE course_id = ? AND tenant_id = ?`,
      [course_id, tenantId]
    )
    connection.release()

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const course = rows[0]
    const { course_name: stream, syllab_doc: pdfUrl } = course

    console.log(`📚 Processing syllabus for: ${stream} - ${year}`)

    // Download PDF from Cloudinary
    console.log("⬇️ Downloading PDF from Cloudinary...")
    const pdfResponse = await axios.get(pdfUrl, { responseType: "arraybuffer" })
    const pdfBuffer = Buffer.from(pdfResponse.data)

    // Prepare form data for Flask
    const formData = new FormData()
    formData.append("file", pdfBuffer, {
      filename: `${stream}_${year}.pdf`,
      contentType: "application/pdf",
    })
    formData.append("tenant_id", tenantId.toString())
    formData.append("year", year)
    formData.append("semester", semester)
    formData.append("stream", stream)
    formData.append("course", "Engineering") // You can make this dynamic if needed

    console.log("🚀 Sending PDF to Flask for processing...")

    // Send to Flask /ingest endpoint
    const flaskResponse = await axios.post(`${FLASK_API_URL}/ingest`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 300000, // 5 minute timeout for large PDFs
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
      tenant_id: tenantId,
      user_info: flaskResponse.data.user_info,
      subjects_till_semester: flaskResponse.data.subjects_till_semester,
      total_semesters_parsed: flaskResponse.data.total_semesters_parsed,
      stream: stream,
      year: year,
      semester: semester,
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

// GET endpoint to retrieve already processed user info
export async function GET(req: NextRequest) {
  try {
    // Get tenant_id from cookies
    const cookieStore = await cookies()
    const collegeData = cookieStore.get("collegeData")?.value

    if (!collegeData) {
      return NextResponse.json({ error: "Tenant not found in cookies" }, { status: 401 })
    }

    const { id: tenantId } = JSON.parse(collegeData)

    console.log(`🔍 Fetching user info for tenant: ${tenantId}`)

    // Call Flask /get_user_info endpoint
    const flaskResponse = await axios.post(
      `${FLASK_API_URL}/get_user_info`,
      { tenant_id: tenantId.toString() },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    )

    if (!flaskResponse.data.success) {
      return NextResponse.json(
        { error: "No data found for this tenant" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      user_info: flaskResponse.data.user_info,
      subjects_by_semester: flaskResponse.data.subjects_by_semester,
    })
  } catch (error: any) {
    console.error("❌ Error fetching user info:", error)

    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: "No curriculum data found. Please upload a syllabus first." },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch user info", details: error.message },
      { status: 500 }
    )
  }
}