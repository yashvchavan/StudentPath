import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import pool from "@/lib/db"
import { v2 as cloudinary } from "cloudinary"
import jwt from "jsonwebtoken"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  let connection;
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_session")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (e) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const userId = decoded.id;
    const userType = decoded.role; // 'student' or 'professional'

    if (!userId || !userType) {
      return NextResponse.json({ error: "Invalid session data" }, { status: 401 })
    }

    console.log(`👤 User type: ${userType}, ID: ${userId}`)

    const isStudent = userType === 'student'
    const isProfessional = userType === 'professional'

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

    // Upload to Cloudinary with appropriate folder
    const folderName = isStudent ? "student_avatars" : "professional_avatars"
    const publicId = `${userType}_${userId}`

    console.log(`☁️ Uploading to Cloudinary: ${folderName}/${publicId}`)

    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folderName,
          public_id: publicId,
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

    console.log("✅ Cloudinary upload successful:", uploadResult.secure_url)

    // Update database based on user type
    connection = await pool.getConnection()

    if (isStudent) {
      console.log(`🔄 Updating Students table for student_id: ${userId}`)
      await connection.execute(
        `UPDATE Students SET profile_picture = ?, updated_at = NOW() WHERE student_id = ?`,
        [uploadResult.secure_url, userId]
      )
    } else {
      console.log(`🔄 Updating Professionals table for id: ${userId}`)
      // Professionals table uses 'id' as primary key, not 'professional_id'
      // Also, we need to clear the base64 fields since we're using Cloudinary URL
      await connection.execute(
        `UPDATE professionals 
         SET profile_picture_base64 = ?, 
             profile_picture_mime = ?, 
             updated_at = NOW() 
         WHERE id = ?`,
        [uploadResult.secure_url, 'image/url', userId]
      )
    }

    console.log("✅ Database updated successfully")

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      message: "Avatar uploaded successfully",
      userType: userType
    })

  } catch (error: any) {
    console.error("❌ Error uploading avatar:", error)
    return NextResponse.json(
      { error: "Failed to upload avatar", details: error.message },
      { status: 500 }
    )
  } finally {
    if (connection) connection.release();
  }
}