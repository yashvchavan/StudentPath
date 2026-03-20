import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getTpoSession, getDepartmentScopeClause } from "@/lib/tpo-auth";

// GET /api/admin/department-analytics - Get analytics by department
export async function GET(req: NextRequest) {
  try {
    const session = await getTpoSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");

    const connection = await pool.getConnection();

    try {
      // Build query based on role
      let departmentFilter = "";
      const params: any[] = [session.college_id];

      if (session.isDeptTPO) {
        // Dept TPO can only see their own department
        departmentFilter = " AND d.id = ?";
        params.push(session.department_id);
      } else if (departmentId) {
        // Central TPO filtering by specific department
        departmentFilter = " AND d.id = ?";
        params.push(parseInt(departmentId));
      }

      // Get department statistics
      const [departments]: any = await connection.execute(
        `SELECT
          d.id,
          d.name,
          d.code,
          COUNT(DISTINCT s.student_id) as total_students,
          COUNT(DISTINCT CASE WHEN s.placement_status = 'placed' THEN s.student_id END) as placed_students,
          COUNT(DISTINCT CASE WHEN s.placement_status = 'unplaced' THEN s.student_id END) as unplaced_students,
          COUNT(DISTINCT CASE WHEN s.placement_status = 'opted_out' THEN s.student_id END) as opted_out_students,
          AVG(s.current_gpa) as avg_gpa,
          AVG(s.backlogs) as avg_backlogs
        FROM departments d
        LEFT JOIN students s ON s.department_id = d.id AND s.is_active = TRUE
        WHERE d.college_id = ? AND d.is_active = TRUE${departmentFilter}
        GROUP BY d.id
        ORDER BY d.name ASC`,
        params
      );

      // Get skill distribution (from technical_skills JSON column)
      const skillParams: any[] = [session.college_id];
      let skillDeptFilter = "";
      if (session.isDeptTPO) {
        skillDeptFilter = " AND s.department_id = ?";
        skillParams.push(session.department_id);
      } else if (departmentId) {
        skillDeptFilter = " AND s.department_id = ?";
        skillParams.push(parseInt(departmentId));
      }

      // Get top skills across students
      const [skillsData]: any = await connection.execute(
        `SELECT s.technical_skills, s.department_id
         FROM students s
         JOIN departments d ON s.department_id = d.id
         WHERE d.college_id = ? AND s.is_active = TRUE AND s.technical_skills IS NOT NULL${skillDeptFilter}`,
        skillParams
      );

      // Aggregate skills
      const skillCounts: Record<string, number> = {};
      for (const row of skillsData) {
        let skills: string[] = [];
        if (row.technical_skills) {
          if (Array.isArray(row.technical_skills)) {
            skills = row.technical_skills;
          } else if (typeof row.technical_skills === "string") {
            try {
              skills = JSON.parse(row.technical_skills);
            } catch {
              skills = [];
            }
          }
        }
        for (const skill of skills) {
          if (skill && typeof skill === "string") {
            const normalizedSkill = skill.trim().toLowerCase();
            skillCounts[normalizedSkill] = (skillCounts[normalizedSkill] || 0) + 1;
          }
        }
      }

      // Sort skills by count and get top 10
      const topSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, count }));

      // Calculate overall stats
      const overallStats = departments.reduce(
        (acc: any, dept: any) => {
          acc.totalStudents += dept.total_students || 0;
          acc.placedStudents += dept.placed_students || 0;
          acc.unplacedStudents += dept.unplaced_students || 0;
          acc.optedOutStudents += dept.opted_out_students || 0;
          return acc;
        },
        { totalStudents: 0, placedStudents: 0, unplacedStudents: 0, optedOutStudents: 0 }
      );

      overallStats.placementRate =
        overallStats.totalStudents > 0
          ? Math.round((overallStats.placedStudents / overallStats.totalStudents) * 100)
          : 0;

      return NextResponse.json({
        success: true,
        analytics: {
          overall: overallStats,
          departments: departments.map((dept: any) => ({
            id: dept.id,
            name: dept.name,
            code: dept.code,
            totalStudents: dept.total_students || 0,
            placedStudents: dept.placed_students || 0,
            unplacedStudents: dept.unplaced_students || 0,
            optedOutStudents: dept.opted_out_students || 0,
            placementRate:
              dept.total_students > 0
                ? Math.round((dept.placed_students / dept.total_students) * 100)
                : 0,
            avgGpa: dept.avg_gpa ? parseFloat(dept.avg_gpa).toFixed(2) : null,
            avgBacklogs: dept.avg_backlogs
              ? parseFloat(dept.avg_backlogs).toFixed(1)
              : "0",
          })),
          topSkills,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[GET /api/admin/department-analytics] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
