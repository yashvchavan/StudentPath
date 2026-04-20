import pool from './lib/db';

async function run() {
  try {
    await pool.execute('ALTER TABLE resumes ADD COLUMN professional_id INT NULL');
    await pool.execute('ALTER TABLE resumes MODIFY COLUMN student_id INT NULL');
    await pool.execute('ALTER TABLE resume_analyses ADD COLUMN professional_id INT NULL');
    await pool.execute('ALTER TABLE resume_analyses MODIFY COLUMN student_id INT NULL');
    console.log("Migration successful.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}
run();
