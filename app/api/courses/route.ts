import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

export async function GET() {
  try {
    const cookieStore = await cookies();

    // Check for both student and admin (college) cookies
    const studentCookie = cookieStore.get("studentData")?.value;
    const collegeCookie = cookieStore.get("collegeData")?.value;

    let collegeToken: string | null = null;

    // Handle admin/college authentication
    if (collegeCookie) {
      try {
        const collegeData = JSON.parse(collegeCookie);
        collegeToken = collegeData?.token;

        if (!collegeToken) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("⚠️ No college token in collegeData cookie");
          }
          return NextResponse.json({ courses: [] });
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("❌ Invalid collegeData cookie:", err);
        }
        return NextResponse.json({ courses: [] });
      }
    }
    // Handle student authentication
    else if (studentCookie) {
      try {
        const studentData = JSON.parse(studentCookie);
        const studentId = studentData?.student_id;

        if (!studentId) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("⚠️ Missing student_id in cookie");
          }
          return NextResponse.json({ courses: [] });
        }

        // Get student's college_token
        const [studentRows]: any = await pool.query(
          `SELECT college_token FROM Students WHERE student_id = ?`,
          [studentId]
        );

        if (!studentRows || studentRows.length === 0) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("⚠️ Student not found:", studentId);
          }
          return NextResponse.json({ courses: [] });
        }

        collegeToken = studentRows[0].college_token;
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("❌ Invalid studentData cookie:", err);
        }
        return NextResponse.json({ courses: [] });
      }
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.warn("⚠️ No authentication cookie found");
      }
      return NextResponse.json({ courses: [] });
    }

    if (!collegeToken) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("⚠️ No college_token available");
      }
      return NextResponse.json({ courses: [] });
    }

    // Fetch all courses for that tenant/college
    const [courses]: any = await pool.query(
      `SELECT course_id AS id, course_name, year, syllab_doc
       FROM courses_adi
       WHERE tenant_id = (SELECT id FROM colleges WHERE college_token = ?)`,
      [collegeToken]
    );

    return NextResponse.json({ courses });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("❌ Error fetching courses:", error);
    }
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
    const collegeCookie = cookieStore.get("collegeData")?.value;

    // Verify admin authentication
    if (!collegeCookie) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    let collegeData;
    try {
      collegeData = JSON.parse(collegeCookie);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid session data" },
        { status: 401 }
      );
    }

    const collegeToken = collegeData?.token;
    if (!collegeToken) {
      return NextResponse.json(
        { error: "Invalid session: missing college token" },
        { status: 401 }
      );
    }

    // Get tenant ID from college token
    const [collegeRows]: any = await pool.query(
      `SELECT id FROM colleges WHERE college_token = ?`,
      [collegeToken]
    );

    if (!collegeRows || collegeRows.length === 0) {
      return NextResponse.json(
        { error: "College not found" },
        { status: 404 }
      );
    }

    const tenantId = collegeRows[0].id;

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
    const collegeCookie = cookieStore.get("collegeData")?.value;

    // Verify admin authentication
    if (!collegeCookie) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    let collegeData;
    try {
      collegeData = JSON.parse(collegeCookie);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid session data" },
        { status: 401 }
      );
    }

    const collegeToken = collegeData?.token;
    if (!collegeToken) {
      return NextResponse.json(
        { error: "Invalid session: missing college token" },
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

    // Get tenant ID from college token
    const [collegeRows]: any = await pool.query(
      `SELECT id FROM colleges WHERE college_token = ?`,
      [collegeToken]
    );

    if (!collegeRows || collegeRows.length === 0) {
      return NextResponse.json(
        { error: "College not found" },
        { status: 404 }
      );
    }

    const tenantId = collegeRows[0].id;

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
