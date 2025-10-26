import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const studentCookie = cookieStore.get("studentData")?.value;

    if (!studentCookie) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("⚠️ No studentData cookie found");
      }
      return NextResponse.json({ courses: [] });
    }

    let studentData: any;
    try {
      studentData = JSON.parse(studentCookie);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("❌ Invalid studentData cookie:", studentCookie);
      }
      return NextResponse.json({ courses: [] });
    }

    const studentId = studentData?.student_id;
    if (!studentId) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("⚠️ Missing student_id in cookie");
      }
      return NextResponse.json({ courses: [] });
    }

    // Step 1: Get student's college_token
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

    const collegeToken = studentRows[0].college_token;
    if (!collegeToken) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("⚠️ No college_token linked to student:", studentId);
      }
      return NextResponse.json({ courses: [] });
    }

    // Step 2: Fetch all courses for that tenant/college
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
