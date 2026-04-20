import type { PoolConnection } from 'mysql2/promise'

async function columnExists(connection: PoolConnection, table: string, column: string): Promise<boolean> {
  const [rows]: any = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND column_name = ?`,
    [table, column]
  )
  return Number(rows?.[0]?.total || 0) > 0
}

async function ensureColumn(connection: PoolConnection, table: string, column: string, definition: string) {
  if (!(await columnExists(connection, table, column))) {
    await connection.execute(`ALTER TABLE ${table} ADD COLUMN ${definition}`)
  }
}

async function ensureNullableColumn(connection: PoolConnection, table: string, column: string, definition: string) {
  if (await columnExists(connection, table, column)) {
    return
  }
  await connection.execute(`ALTER TABLE ${table} ADD COLUMN ${definition}`)
}

export async function ensureProfessionalSchema(connection: PoolConnection) {
  await ensureColumn(connection, 'professionals', 'projects', 'projects JSON NULL')
  await ensureColumn(connection, 'professionals', 'profile_picture_base64', 'profile_picture_base64 LONGTEXT NULL')
  await ensureColumn(connection, 'professionals', 'profile_picture_mime', 'profile_picture_mime VARCHAR(100) NULL')
  await ensureColumn(connection, 'professionals', 'level', 'level VARCHAR(50) NULL')
}

export async function ensureResumeSchema(connection: PoolConnection) {
  await ensureNullableColumn(connection, 'resumes', 'professional_id', 'professional_id INT NULL')
  await ensureNullableColumn(connection, 'resume_analyses', 'professional_id', 'professional_id INT NULL')

  // Make student_id nullable on resume tables so professional rows can be saved cleanly.
  try { await connection.execute('ALTER TABLE resumes MODIFY COLUMN student_id INT NULL') } catch { /* ignore */ }
  try { await connection.execute('ALTER TABLE resume_analyses MODIFY COLUMN student_id INT NULL') } catch { /* ignore */ }
}
