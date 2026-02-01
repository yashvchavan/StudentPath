import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

import jwt from 'jsonwebtoken';

// ...

// ...
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_session")?.value;

    let tenantId: number | null = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number, role: string };
        const { id, role } = decoded;

        if (role === 'college') {
          tenantId = id;
        } else if (role === 'student') {
          const [studentRows]: any = await pool.query(
            `SELECT college_id FROM Students WHERE student_id = ?`,
            [id]
          );
          if (studentRows && studentRows.length > 0) {
            tenantId = studentRows[0].college_id;
          }
        }
      } catch (e) {
        console.error("Values session check failed", e);
      }
    }

    if (!tenantId) {
      return NextResponse.json({ courses: [] });
    }

    // Fetch all courses for that tenant
    const [courses]: any = await pool.query(
      `SELECT course_id AS id, course_name, year, syllab_doc
       FROM courses_adi
       WHERE tenant_id = ?`,
      [tenantId]
    );

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("❌ Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses
 * Upload a new course syllabus
 * 
 * FormData:
 * - course: Department name (e.g., "Computer")
 * - year: Academic year (e.g., "2024")
 * - file: PDF file to upload
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let tenantId: number | null = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number, role: string };
      if (decoded.role === 'college') {
        tenantId = decoded.id;
      }
    } catch (err) {
      console.error("Session verification failed", err);
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const course = formData.get("course") as string;
    const year = formData.get("year") as string;
    const file = formData.get("file") as File;

    if (!course || !year || !file) {
      return NextResponse.json(
        { error: "Missing required fields: course, year, file" },
        { status: 400 }
      );
    }

    console.log("📤 Uploading syllabus:", { course, year, fileName: file.name });

    // Upload file to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(file, `syllabuses/${course}_${year}`);

    if (!cloudinaryUrl) {
      return NextResponse.json(
        { error: "Failed to upload file to Cloudinary" },
        { status: 500 }
      );
    }

    console.log("✅ Uploaded to Cloudinary:", cloudinaryUrl);

    // Insert course record into database
    const [result]: any = await pool.query(
      `INSERT INTO courses_adi (tenant_id, course_name, year, syllab_doc, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [tenantId, course, year, cloudinaryUrl]
    );

    const courseId = result.insertId;

    console.log("✅ Course saved to database:", courseId);

    return NextResponse.json({
      success: true,
      message: "Course uploaded successfully",
      course: {
        id: courseId,
        course_name: course,
        year: year,
        syllab_doc: cloudinaryUrl
      }
    });
  } catch (error) {
    console.error("❌ Error uploading course:", error);
    return NextResponse.json(
      { error: "Failed to upload course" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses
 * Delete a course syllabus
 * 
 * Query: ?id=<course_id>
 */
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let tenantId: number | null = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number, role: string };
      if (decoded.role === 'college') {
        tenantId = decoded.id;
      }
    } catch (err) {
      console.error("Session verification failed", err);
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("id");

    if (!courseId) {
      return NextResponse.json(
        { error: "Missing required query param: id" },
        { status: 400 }
      );
    }

    // Delete course (only if it belongs to this tenant)
    const [result]: any = await pool.query(
      `DELETE FROM courses_adi WHERE course_id = ? AND tenant_id = ?`,
      [courseId, tenantId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      );
    }

    console.log("✅ Course deleted:", courseId);

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}

/**
 * Upload file to Cloudinary
 * For PDFs, we use 'raw' resource type to ensure they are publicly accessible
 */
async function uploadToCloudinary(file: File, folder: string): Promise<string | null> {
  try {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.error("❌ Cloudinary credentials not configured");
      return null;
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    // Determine resource type - use 'raw' for PDFs and documents to ensure public access
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isDoc = file.type.includes("document") ||
      file.name.toLowerCase().endsWith(".doc") ||
      file.name.toLowerCase().endsWith(".docx");

    // Use 'raw' for documents to ensure public access
    const resourceType = (isPdf || isDoc) ? "raw" : "auto";

    // Generate signature for upload
    // Note: Only include parameters that Cloudinary requires for signature
    // resource_type goes in URL, not in signed params
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;

    // Create signature
    const crypto = await import("crypto");
    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + CLOUDINARY_API_SECRET)
      .digest("hex");

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", dataURI);
    formData.append("folder", folder);
    formData.append("timestamp", timestamp.toString());
    formData.append("api_key", CLOUDINARY_API_KEY);
    formData.append("signature", signature);

    // Use the appropriate endpoint based on resource type
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Cloudinary upload failed:", data);
      return null;
    }

    console.log("✅ Cloudinary upload success:", {
      publicId: data.public_id,
      resourceType: data.resource_type,
      format: data.format,
      url: data.secure_url
    });

    return data.secure_url;
  } catch (error) {
    console.error("❌ Error uploading to Cloudinary:", error);
    return null;
  }
}
