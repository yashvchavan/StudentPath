/**
 * resume-tables.js
 * Migration script to create resume-related tables.
 * Run: node scripts/resume-tables.js
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

async function createResumeTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || "3306"),
        ssl: { rejectUnauthorized: false },
    });

    console.log("Connected to database. Creating resume tables...\n");

    // 1. resumes — stores uploaded resume files
    await connection.execute(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      file_url TEXT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_type ENUM('pdf', 'docx') NOT NULL,
      parsed_text LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_student (student_id)
    )
  `);
    console.log("✓ Created 'resumes' table");

    // 2. resume_analyses — each ATS analysis of a resume vs company+role
    await connection.execute(`
    CREATE TABLE IF NOT EXISTS resume_analyses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      resume_id INT NOT NULL,
      student_id INT NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      company_id VARCHAR(100),
      target_role VARCHAR(255) NOT NULL,
      ats_score INT DEFAULT 0,
      section_scores JSON,
      feedback_json JSON,
      rejection_reasons JSON,
      skill_gaps JSON,
      improvement_steps JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_resume (resume_id),
      INDEX idx_student (student_id),
      INDEX idx_company (company_id)
    )
  `);
    console.log("✓ Created 'resume_analyses' table");

    // 3. company_resume_requirements — ATS criteria per company+role
    await connection.execute(`
    CREATE TABLE IF NOT EXISTS company_resume_requirements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id VARCHAR(100) NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL,
      required_skills JSON,
      keywords JSON,
      project_expectations TEXT,
      min_experience_months INT DEFAULT 0,
      preferred_sections JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_company_role (company_id, role)
    )
  `);
    console.log("✓ Created 'company_resume_requirements' table");

    console.log("\n✅ All resume tables created successfully!");
    await connection.end();
}

createResumeTables().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
