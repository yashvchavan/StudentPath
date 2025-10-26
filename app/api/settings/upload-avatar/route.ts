// app/api/settings/upload-avatar/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import pool from "@/lib/db"
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const studentCookie = cookieStore.get("studentData")?.value

    if (!studentCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const studentData = JSON.parse(studentCookie)
    const { student_id, isAuthenticated } = studentData

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("avatar") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed" },
        { status: 400 }
      )
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB" },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "student_avatars",
          public_id: `student_${student_id}`,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto" },
            { fetch_format: "auto" }
          ]
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    // Update database - UPDATED to match your schema
    const connection = await pool.getConnection()
    await connection.execute(
      `UPDATE Students SET profile_picture = ?, updated_at = NOW() WHERE student_id = ?`,
      [uploadResult.secure_url, student_id]
    )
    connection.release()

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      message: "Avatar uploaded successfully"
    })

  } catch (error: any) {
    console.error("❌ Error uploading avatar:", error)
    return NextResponse.json(
      { error: "Failed to upload avatar", details: error.message },
      { status: 500 }
    )
  }
}