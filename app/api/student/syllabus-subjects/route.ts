import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/**
 * GET /api/student/syllabus-subjects
 * 
 * Returns all subjects for the authenticated student based on:
 * - Their department (program field in Students table)
 * - Their current year
 * - Their current semester
 * 
 * Data comes from the parsed_subjects JSON stored in dept_syllabus table
 * when admin uploaded the syllabus PDF.
 */
export async function GET(req: NextRequest) {
  let connection;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let studentId: number | null = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: number;
        role: string;
      };
      if (decoded.role === "student") {
        studentId = decoded.id;
      }
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    connection = await pool.getConnection();

    // Fetch student's academic profile
    const [studentRows]: any = await connection.execute(
      `SELECT 
        s.student_id,
        s.first_name,
        s.last_name,
        s.program,
        s.current_year,
        s.current_semester,
        s.college_id,
        s.department_id,
        d.name as department_name,
        d.id as dept_id
       FROM Students s
       LEFT JOIN departments d ON s.department_id = d.id
       WHERE s.student_id = ?`,
      [studentId]
    );

    if (!studentRows || studentRows.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const student = studentRows[0];
    const year = student.current_year;
    const semester = student.current_semester;
    const deptId = student.dept_id;
    const programName = student.department_name || student.program;

    if (!year) {
      return NextResponse.json({
        success: false,
        hasData: false,
        message: "Your academic year is not set. Please complete your profile.",
        student: { year: null, semester, department: programName },
      });
    }

    // Try to find syllabus for student's department + year
    // First try by department_id (linked), then fallback to college-level match by program name
    let syllabusRows: any[] = [];

    if (deptId) {
      const [rows]: any = await connection.execute(
        `SELECT id, year, title, file_name, file_url, parsed_subjects, parsing_status, parsed_at
         FROM dept_syllabus
         WHERE department_id = ? AND year = ? AND parsing_status = 'done'
         ORDER BY uploaded_at DESC
         LIMIT 1`,
        [deptId, year]
      );
      syllabusRows = rows;
    }

    // Fallback: try matching by program name across college
    if (syllabusRows.length === 0 && student.college_id) {
      const [rows]: any = await connection.execute(
        `SELECT ds.id, ds.year, ds.title, ds.file_name, ds.file_url, ds.parsed_subjects, ds.parsing_status, ds.parsed_at
         FROM dept_syllabus ds
         JOIN departments d ON ds.department_id = d.id
         WHERE d.college_id = ? AND ds.year = ? AND ds.parsing_status = 'done'
           AND (
             d.name LIKE ? OR
             d.code LIKE ?
           )
         ORDER BY ds.uploaded_at DESC
         LIMIT 1`,
        [
          student.college_id,
          year,
          `%${(programName || "").split(" ")[0]}%`,
          `%${(programName || "").split(" ")[0].substring(0, 3).toUpperCase()}%`,
        ]
      );
      syllabusRows = rows;
    }

    if (syllabusRows.length === 0) {
      // Check if a syllabus exists but is still processing
      let pendingRows: any[] = [];
      if (deptId) {
        const [rows]: any = await connection.execute(
          `SELECT id, parsing_status FROM dept_syllabus
           WHERE department_id = ? AND year = ?
           ORDER BY uploaded_at DESC LIMIT 1`,
          [deptId, year]
        );
        pendingRows = rows;
      }

      const isPending = pendingRows.length > 0 && pendingRows[0].parsing_status === "pending";

      return NextResponse.json({
        success: false,
        hasData: false,
        isPending,
        message: isPending
          ? "Syllabus is being processed. Please check back shortly."
          : "No syllabus uploaded for your department and year yet. Contact your college to upload the syllabus.",
        student: {
          year,
          semester,
          department: programName,
        },
      });
    }

    const syllabus = syllabusRows[0];

    // Parse the subjects JSON
    let parsedSubjects: any = null;
    try {
      parsedSubjects =
        typeof syllabus.parsed_subjects === "string"
          ? JSON.parse(syllabus.parsed_subjects)
          : syllabus.parsed_subjects;
    } catch {
      parsedSubjects = null;
    }

    if (!parsedSubjects) {
      return NextResponse.json({
        success: false,
        hasData: false,
        message: "Syllabus data could not be read. Please contact your college.",
        student: { year, semester, department: programName },
      });
    }

    // Structure: parsedSubjects = { semesters: { "1": [...subjects], "2": [...] } }
    // or { subjects: [...] } for flat structure
    // or [...subjects] for array

    let allSemesters: Record<string, any[]> = {};

    if (parsedSubjects.semesters) {
      allSemesters = parsedSubjects.semesters;
    } else if (Array.isArray(parsedSubjects)) {
      // Flat array — group by semester field if present
      const grouped: Record<string, any[]> = {};
      parsedSubjects.forEach((subj: any) => {
        const semKey = String(subj.semester || semester || 1);
        if (!grouped[semKey]) grouped[semKey] = [];
        grouped[semKey].push(subj);
      });
      allSemesters = grouped;
    } else if (parsedSubjects.subjects) {
      // Single list
      const semKey = String(semester || 1);
      allSemesters = { [semKey]: parsedSubjects.subjects };
    }

    // Current semester subjects (highlight)
    const currentSemKey = String(semester || 1);
    const currentSubjects = allSemesters[currentSemKey] || [];

    // Previous semesters (all semesters < current)
    const previousSemesters: Record<string, any[]> = {};
    Object.entries(allSemesters).forEach(([semKey, subjects]) => {
      if (parseInt(semKey) < parseInt(currentSemKey)) {
        previousSemesters[semKey] = subjects;
      }
    });

    return NextResponse.json({
      success: true,
      hasData: true,
      student: {
        year,
        semester,
        department: programName,
      },
      syllabus: {
        id: syllabus.id,
        title: syllabus.title,
        fileName: syllabus.file_name,
        fileUrl: syllabus.file_url,
        parsedAt: syllabus.parsed_at,
      },
      currentSemester: semester,
      currentSubjects,
      allSemesters,
      previousSemesters,
      totalSubjectsThisYear: Object.values(allSemesters).flat().length,
    });
  } catch (error: any) {
    console.error("[GET /api/student/syllabus-subjects]", error);
    return NextResponse.json(
      { error: "Failed to fetch syllabus subjects", details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
