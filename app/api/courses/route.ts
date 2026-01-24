import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

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
