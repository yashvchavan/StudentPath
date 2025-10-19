// app/api/courses/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import pool from "@/lib/db"
import cloudinary from "@/lib/cloudinary"
import { ResultSetHeader } from "mysql2/promise"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const collegedata = cookieStore.get("collegeData")?.value
    if (!collegedata) return NextResponse.json({ courses: [] })

    const { id: tenantId } = JSON.parse(collegedata)

    const connection = await pool.getConnection()
    const [rows] = await connection.execute(
      `SELECT course_id as id, course_name, year, syllab_doc 
       FROM courses_adi 
       WHERE tenant_id = ?`,
      [tenantId]
    )
    connection.release()

    return NextResponse.json({ courses: rows })
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const course = formData.get("course") as string
    const year = formData.get("year") as string
    const file = formData.get("file") as File

    if (!course || !year || !file) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const collegedata = cookieStore.get("collegeData")?.value
    if (!collegedata) return NextResponse.json({ error: "Tenant not found" }, { status: 400 })
    const { id: tenantId } = JSON.parse(collegedata)

    // Determine file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    // Upload file to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer())
    
    let fileUrl: string
    
    // For PDFs, we'll convert to base64 and store, or use raw type
    if (fileExtension === 'pdf') {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "syllabus_docs",
            resource_type: "raw",
            type: "upload",
            public_id: `${course}_${year}_${Date.now()}`,
          },
          (err, result) => (err ? reject(err) : resolve(result))
        )
        stream.end(buffer)
      })
      
      // For raw files, we need to add Content-Disposition header via signed URL
      // But for simplicity, let's just use the direct URL and handle it differently
      fileUrl = uploadResult.secure_url
    } else {
      // For other file types
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "syllabus_docs",
            resource_type: "auto",
            type: "upload",
            public_id: `${course}_${year}_${Date.now()}`,
          },
          (err, result) => (err ? reject(err) : resolve(result))
        )
        stream.end(buffer)
      })
      fileUrl = uploadResult.secure_url
    }

    // Insert into DB
    const connection = await pool.getConnection()
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO courses_adi (course_name, year, syllab_doc, tenant_id) VALUES (?, ?, ?, ?)`,
      [course, year, fileUrl, tenantId]
    )
    connection.release()

    return NextResponse.json({
      success: true,
      course: { id: result.insertId, course_name: course, year, syllab_doc: fileUrl },
    })
  } catch (error) {
    console.error("Error uploading course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Missing course ID" }, { status: 400 })

    const connection = await pool.getConnection()
    
    // Get the file URL before deleting to remove from Cloudinary
    const [rows] = await connection.execute<any[]>(
      `SELECT syllab_doc FROM courses_adi WHERE course_id = ?`,
      [id]
    )
    
    if (rows.length > 0) {
      const fileUrl = rows[0].syllab_doc
      // Extract public_id from Cloudinary URL
      const urlParts = fileUrl.split('/')
      const fileWithExt = urlParts[urlParts.length - 1]
      const publicIdWithFolder = `syllabus_docs/${fileWithExt.split('.')[0]}`
      
      try {
        await cloudinary.uploader.destroy(publicIdWithFolder, { resource_type: "raw" })
      } catch (err) {
        console.error("Error deleting from Cloudinary:", err)
      }
    }
    
    await connection.execute(`DELETE FROM courses_adi WHERE course_id = ?`, [id])
    connection.release()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting course:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}