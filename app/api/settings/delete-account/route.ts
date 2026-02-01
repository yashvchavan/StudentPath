import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import pool from "@/lib/db"
import jwt from "jsonwebtoken"

export async function DELETE(req: NextRequest) {
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

    const { id: student_id, role: userType } = decoded;

    if (!student_id || userType !== 'student') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const { confirmEmail } = body

    connection = await pool.getConnection()

    try {
      // Verify email matches - UPDATED to match your schema
      const [studentRows] = await connection.execute<any[]>(
        `SELECT email FROM Students WHERE student_id = ?`,
        [student_id]
      )

      if (!studentRows || studentRows.length === 0) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 })
      }

      if (studentRows[0].email !== confirmEmail) {
        return NextResponse.json({ error: "Email does not match" }, { status: 400 })
      }

      await connection.beginTransaction()

      // Delete all related data (CASCADE should handle most of this)
      // but we'll be explicit for clarity

      // Delete user settings
      await connection.execute(
        `DELETE FROM user_settings WHERE student_id = ?`,
        [student_id]
      )

      // Delete chat conversations and messages (if these tables exist)
      try {
        await connection.execute(
          `DELETE FROM chat_messages WHERE conversation_id IN 
           (SELECT conversation_id FROM chat_conversations WHERE student_id = ?)`,
          [student_id]
        )

        await connection.execute(
          `DELETE FROM chat_conversations WHERE student_id = ?`,
          [student_id]
        )
      } catch (err) {
        console.log("Chat tables may not exist, skipping...")
      }

      // Delete enrollments (if this table exists)
      try {
        await connection.execute(
          `DELETE FROM enrollments WHERE student_id = ?`,
          [student_id]
        )
      } catch (err) {
        console.log("Enrollments table may not exist, skipping...")
      }

      // Delete progress tracking (if this table exists)
      try {
        await connection.execute(
          `DELETE FROM progress WHERE student_id = ?`,
          [student_id]
        )
      } catch (err) {
        console.log("Progress table may not exist, skipping...")
      }

      // Set is_active to false instead of deleting (soft delete)
      await connection.execute(
        `UPDATE Students SET is_active = 0, updated_at = NOW() WHERE student_id = ?`,
        [student_id]
      )

      // OR if you want hard delete, use this instead:
      // await connection.execute(
      //   `DELETE FROM Students WHERE student_id = ?`,
      //   [student_id]
      // )

      await connection.commit()

      // Clear the authentication cookie
      cookieStore.delete("auth_session")
      cookieStore.delete("studentData")

      return NextResponse.json({
        success: true,
        message: "Account deleted successfully"
      })

    } catch (error) {
      await connection.rollback()
      throw error
    }

  } catch (error: any) {
    console.error("❌ Error deleting account:", error)
    return NextResponse.json(
      { error: "Failed to delete account", details: error.message },
      { status: 500 }
    )
  } finally {
    if (connection) connection.release();
  }
}