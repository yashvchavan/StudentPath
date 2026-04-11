import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireCentralTpo } from "@/lib/tpo-auth";

/**
 * DELETE /api/admin/departments/[id]/syllabus/[fileId]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const session = await requireCentralTpo();
    const deptId = parseInt(params.id);
    const fileId = parseInt(params.fileId);
    if (isNaN(deptId) || isNaN(fileId)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    const conn = await pool.getConnection();
    try {
      const [result]: any = await conn.execute(
        "DELETE FROM dept_syllabus WHERE id = ? AND college_id = ?",
        [fileId, session.college_id]
      );
      if (result.affectedRows === 0) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Syllabus deleted" });
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.error("[DELETE syllabus]", error);
    return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 });
  }
}
