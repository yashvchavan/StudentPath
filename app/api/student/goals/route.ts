import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

function getStudentId(token: string): number | null {
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; role: string };
    return d.role === "student" ? d.id : null;
  } catch { return null; }
}

// GET — fetch all goals for the student
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const studentId = getStudentId(token);
  if (!studentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conn = await pool.getConnection();
  try {
    // Ensure table exists
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS student_goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category ENUM('Academic','Career','Skill','Project','Other') DEFAULT 'Other',
        status ENUM('planning','in-progress','completed','paused') DEFAULT 'planning',
        progress INT DEFAULT 0,
        deadline VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_student (student_id)
      )
    `);

    const [rows]: any = await conn.execute(
      "SELECT * FROM student_goals WHERE student_id = ? ORDER BY status ASC, created_at DESC",
      [studentId]
    );
    return NextResponse.json({ success: true, goals: rows });
  } finally { conn.release(); }
}

// POST — create goal
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const studentId = getStudentId(token);
  if (!studentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, category, deadline } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS student_goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category ENUM('Academic','Career','Skill','Project','Other') DEFAULT 'Other',
        status ENUM('planning','in-progress','completed','paused') DEFAULT 'planning',
        progress INT DEFAULT 0,
        deadline VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_student (student_id)
      )
    `);
    const [result]: any = await conn.execute(
      "INSERT INTO student_goals (student_id, title, description, category, deadline) VALUES (?, ?, ?, ?, ?)",
      [studentId, title.trim(), description || null, category || "Other", deadline || null]
    );
    const [rows]: any = await conn.execute("SELECT * FROM student_goals WHERE id = ?", [result.insertId]);
    return NextResponse.json({ success: true, goal: rows[0] });
  } finally { conn.release(); }
}

// PATCH — update progress/status
export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const studentId = getStudentId(token);
  if (!studentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, title, description, category, status, progress, deadline } = body;
  if (!id) return NextResponse.json({ error: "Goal ID required" }, { status: 400 });

  const conn = await pool.getConnection();
  try {
    await conn.execute(
      `UPDATE student_goals SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        status = COALESCE(?, status),
        progress = COALESCE(?, progress),
        deadline = COALESCE(?, deadline)
       WHERE id = ? AND student_id = ?`,
      [title || null, description ?? null, category || null, status || null, progress ?? null, deadline || null, id, studentId]
    );
    const [rows]: any = await conn.execute("SELECT * FROM student_goals WHERE id = ? AND student_id = ?", [id, studentId]);
    if (!rows.length) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    return NextResponse.json({ success: true, goal: rows[0] });
  } finally { conn.release(); }
}

// DELETE — remove goal
export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const studentId = getStudentId(token);
  if (!studentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Goal ID required" }, { status: 400 });

  const conn = await pool.getConnection();
  try {
    await conn.execute("DELETE FROM student_goals WHERE id = ? AND student_id = ?", [id, studentId]);
    return NextResponse.json({ success: true });
  } finally { conn.release(); }
}
