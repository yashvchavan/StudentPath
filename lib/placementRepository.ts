import pool from "@/lib/db";
import { PlacementRow } from "@/lib/placementParser";

export interface Placement extends PlacementRow {
  id: number;
  college_id: number;
  logo_url?: string;
  created_at: Date;
  updated_at: Date;
  extracted_skills?: string[];
  extracted_rounds?: Array<{ name: string; type: string }>;
  difficulty_level?: "Easy" | "Medium" | "Hard";
  total_rounds?: number;
  ai_confidence_score?: number;
  last_ai_update?: Date;
}

export interface Review {
  id: number;
  placement_id: number;
  student_id: number;
  student_name: string;
  rating: number;
  comment: string;
  created_at: Date;
}

export async function insertPlacements(collegeId: number, placements: PlacementRow[], fileUrl: string) {
  const connection = await pool.getConnection();
  let inserted = 0;
  let skipped = 0;

  try {
    await connection.beginTransaction();

    for (const p of placements) {
      // Check for duplicate: same college, company, role, and academic year
      const [existing]: any = await connection.execute(
        `SELECT id FROM placements 
         WHERE college_id = ? AND company_name = ? AND role = ? AND academic_year = ?
         LIMIT 1`,
        [collegeId, p.company_name, p.role || "", p.academic_year || null]
      );

      if (existing.length > 0) {
        skipped++;
        continue; // Skip duplicate
      }

      await connection.execute(
        `INSERT INTO placements (
          college_id, company_name, package, eligibility, drive_date, 
          remarks, students_registered, students_selected, location, 
          role, file_url, academic_year
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          collegeId,
          p.company_name,
          p.package,
          p.eligibility,
          p.drive_date || null,
          p.remarks || "",
          p.students_registered || 0,
          p.students_selected || 0,
          p.location || "",
          p.role || "",
          fileUrl,
          p.academic_year || null
        ]
      );
      inserted++;
    }

    await connection.commit();
    return { inserted, skipped };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getPlacements(collegeId?: number): Promise<Placement[]> {
  const connection = await pool.getConnection();
  try {
    let query = `SELECT 
      id, college_id, company_name, logo_url, role, package, description,
      eligibility, location, drive_date, deadline, apply_link,
      students_registered, students_selected, remarks, file_url,
      academic_year, created_at, updated_at,
      extracted_skills, extracted_rounds, difficulty_level,
      total_rounds, ai_confidence_score, last_ai_update
    FROM placements`;
    const params: any[] = [];

    if (collegeId) {
      query += ` WHERE college_id = ?`;
      params.push(collegeId);
    }

    query += ` ORDER BY academic_year DESC, id DESC`;

    const [rows]: any = await connection.execute(query, params);
    return rows;
  } finally {
    connection.release();
  }
}

export async function getPlacementById(id: number): Promise<Placement | null> {
  const [rows]: any = await pool.execute("SELECT * FROM placements WHERE id = ?", [id]);
  return rows[0] || null;
}

export async function updatePlacement(id: number, data: Partial<Placement>) {
  // Dynamic update query
  const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
  if (keys.length === 0) return;

  const setClause = keys.map(k => `${k} = ?`).join(", ");
  const values = keys.map(k => (data as any)[k]);
  values.push(id);

  await pool.execute(`UPDATE placements SET ${setClause} WHERE id = ?`, values);
}

export async function addReview(placementId: number, studentId: number, rating: number, comment: string) {
  await pool.execute(
    "INSERT INTO placement_reviews (placement_id, student_id, rating, comment) VALUES (?, ?, ?, ?)",
    [placementId, studentId, rating, comment]
  );
}

export async function getReviews(placementId: number): Promise<Review[]> {
  const [rows]: any = await pool.execute(`
    SELECT r.*, s.first_name, s.last_name 
    FROM placement_reviews r
    JOIN students s ON r.student_id = s.id
    WHERE r.placement_id = ?
    ORDER BY r.created_at DESC
  `, [placementId]);

  return rows.map((r: any) => ({
    ...r,
    student_name: `${r.first_name} ${r.last_name}`
  }));
}

export async function updateAIExtractedData(
  placementId: number,
  data: {
    extracted_skills?: string[];
    extracted_rounds?: Array<{ name: string; type: string }>;
    difficulty_level?: "Easy" | "Medium" | "Hard";
    total_rounds?: number;
    ai_confidence_score?: number;
  }
) {
  await pool.execute(
    `UPDATE placements 
     SET extracted_skills = ?, 
         extracted_rounds = ?, 
         difficulty_level = ?, 
         total_rounds = ?, 
         ai_confidence_score = ?,
         last_ai_update = NOW()
     WHERE id = ?`,
    [
      JSON.stringify(data.extracted_skills || []),
      JSON.stringify(data.extracted_rounds || []),
      data.difficulty_level || null,
      data.total_rounds || null,
      data.ai_confidence_score || null,
      placementId,
    ]
  );
}

export async function getReviewsForAI(placementId: number) {
  const [rows]: any = await pool.execute(
    `SELECT rating, comment, interview_experience, questions_asked, 
            preparation_tips, overall_experience
     FROM placement_reviews
     WHERE placement_id = ?
     ORDER BY created_at DESC`,
    [placementId]
  );
  return rows;
}
