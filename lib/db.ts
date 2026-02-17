import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'studentpath',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10, // Increased from 5
  queueLimit: 0,
  connectTimeout: 10000,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

export default pool;

// Database initialization function
export async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();

    // Create colleges table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS colleges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        country VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        city VARCHAR(100) NOT NULL,
        address TEXT,
        website VARCHAR(255),
        established_year INT,
        college_type VARCHAR(100),
        accreditation VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        college_token VARCHAR(50) UNIQUE NOT NULL,
        contact_person VARCHAR(255),
        contact_person_email VARCHAR(255),
        contact_person_phone VARCHAR(20),
        total_students INT,
        programs JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create students table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT,
        student_id VARCHAR(50),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        date_of_birth DATE,
        gender ENUM('male', 'female', 'non-binary', 'prefer-not-to-say'),
        password_hash VARCHAR(255) NOT NULL,
        college VARCHAR(255),
        program VARCHAR(255),
        current_year INT,
        current_semester INT,
        enrollment_year INT,
        current_gpa DECIMAL(3,2),
        academic_interests JSON,
        career_quiz_answers JSON,
        technical_skills JSON,
        soft_skills JSON,
        language_skills JSON,
        primary_goal VARCHAR(255),
        secondary_goal VARCHAR(255),
        timeline VARCHAR(100),
        location_preference VARCHAR(100),
        industry_focus JSON,
        intensity_level ENUM('light', 'moderate', 'intensive') DEFAULT 'moderate',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
      )
    `);

    // Create professionals table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS professionals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        company VARCHAR(255),
        designation VARCHAR(255),
        industry VARCHAR(100),
        experience VARCHAR(50),
        current_salary VARCHAR(50),
        expected_salary VARCHAR(50),
        linkedin VARCHAR(255),
        github VARCHAR(255),
        portfolio VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        skills JSON,
        certifications TEXT,
        career_goals TEXT,
        preferred_learning_style VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create college_tokens table for tracking token usage
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS college_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT NOT NULL,
        token VARCHAR(50) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        usage_count INT DEFAULT 0,
        max_usage INT DEFAULT 1000,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
      )
    `);

    // Create user_settings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_settings (
        settings_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT UNIQUE NOT NULL,
        email_notifications BOOLEAN DEFAULT TRUE,
        push_notifications BOOLEAN DEFAULT TRUE,
        assignment_reminders BOOLEAN DEFAULT TRUE,
        goal_updates BOOLEAN DEFAULT TRUE,
        weekly_reports BOOLEAN DEFAULT FALSE,
        course_updates BOOLEAN DEFAULT TRUE,
        profile_visibility BOOLEAN DEFAULT TRUE,
        progress_sharing BOOLEAN DEFAULT FALSE,
        analytics_opt_in BOOLEAN DEFAULT TRUE,
        theme VARCHAR(20) DEFAULT 'system',
        language VARCHAR(20) DEFAULT 'en',
        timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // Create chat_conversations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_type ENUM('student', 'professional', 'college') NOT NULL,
        title VARCHAR(255) NOT NULL,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user (user_id, user_type)
      )
    `);

    // Create chat_messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        role ENUM('user', 'assistant', 'system') NOT NULL,
        content TEXT NOT NULL,
        tokens_used INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
      )
    `);

    // Create chat_context table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_context (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_type ENUM('student', 'professional', 'college') NOT NULL,
        context_data JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY idx_user_context (user_id, user_type)
      )
    `);

    // Create placements table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS placements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT,
        company_name VARCHAR(255) NOT NULL,
        logo_url VARCHAR(255),
        role VARCHAR(255),
        package VARCHAR(100),
        description TEXT,
        eligibility TEXT,
        location VARCHAR(255),
        drive_date DATE,
        deadline DATE,
        apply_link VARCHAR(255),
        students_registered INT DEFAULT 0,
        students_selected INT DEFAULT 0,
        remarks TEXT,
        file_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
      )
    `);

    // Create placement_reviews table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS placement_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        placement_id INT NOT NULL,
        student_id INT NOT NULL,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (placement_id) REFERENCES placements(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // Create resumes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS resumes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        file_url TEXT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type ENUM('pdf', 'docx') NOT NULL,
        parsed_text LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_resume_student (student_id)
      )
    `);

    // Create resume_analyses table
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
        INDEX idx_analysis_resume (resume_id),
        INDEX idx_analysis_student (student_id),
        INDEX idx_analysis_company (company_id)
      )
    `);

    // Create company_resume_requirements table
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

    connection.release();
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
