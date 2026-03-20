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

    // ── Career Gamification Tables ────────────────────────────────────────

    // career_plans: one plan per student per target company/exam
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS career_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        target_id VARCHAR(100) NOT NULL,
        target_name VARCHAR(150) NOT NULL,
        track_type ENUM('placement','higher-studies') DEFAULT 'placement',
        total_xp INT DEFAULT 0,
        current_streak INT DEFAULT 0,
        last_completed_date DATE,
        progress DECIMAL(5,2) DEFAULT 0,
        difficulty_level ENUM('easy','medium','hard') DEFAULT 'medium',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        UNIQUE KEY uq_student_target (student_id, target_id)
      )
    `);

    // Fix is_active default on existing tables — safe to run multiple times
    try {
      await connection.execute(
        `ALTER TABLE career_plans MODIFY COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1`
      );
    } catch (_) { /* ignore — column already correct */ }


    // career_tasks: daily tasks generated from the GPT plan
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS career_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        plan_id INT NOT NULL,
        week_number INT NOT NULL,
        task_date DATE,
        skill_focus VARCHAR(100),
        morning_task TEXT,
        evening_task TEXT,
        difficulty ENUM('easy','medium','hard') DEFAULT 'medium',
        xp INT DEFAULT 40,
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (plan_id) REFERENCES career_plans(id) ON DELETE CASCADE
      )
    `);

    // career_rewards: badges unlocked by XP milestones
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS career_rewards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        plan_id INT NOT NULL,
        badge_name VARCHAR(100) NOT NULL,
        badge_icon VARCHAR(10) DEFAULT '🏆',
        xp_threshold INT NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (plan_id) REFERENCES career_plans(id) ON DELETE CASCADE,
        UNIQUE KEY uq_student_badge (student_id, plan_id, badge_name)
      )
    `);

    // ── Monetization & Usage Tracking Tables ──────────────────────────────

    // subscriptions: Stripe-backed SaaS subscriptions per student
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        plan ENUM('free','pro','college_pro') NOT NULL DEFAULT 'free',
        status ENUM('inactive','active','trialing','past_due','canceled') NOT NULL DEFAULT 'inactive',
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        stripe_price_id VARCHAR(255),
        current_period_start DATETIME NULL,
        current_period_end DATETIME NULL,
        cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
        INDEX idx_student_subscription (student_id),
        UNIQUE KEY uq_stripe_subscription (stripe_subscription_id)
      )
    `);

    // feature_usage: per-student, per-feature rate limiting counters
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS feature_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        feature ENUM('ai_chat','resume_analysis','career_track','recommendation') NOT NULL,
        plan ENUM('free','pro','college_pro') NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        usage_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
        UNIQUE KEY uq_usage_period (student_id, feature, plan, period_start),
        INDEX idx_usage_student (student_id),
        INDEX idx_usage_student_feature (student_id, feature)
      )
    `);

    // coupons: internal mapping of promo codes to discounts
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(64) NOT NULL UNIQUE,
        description VARCHAR(255),
        discount_type ENUM('percentage','fixed') NOT NULL,
        discount_value DECIMAL(10,2) NOT NULL,
        max_redemptions INT DEFAULT NULL,
        times_redeemed INT NOT NULL DEFAULT 0,
        college_id INT NULL,
        valid_from DATETIME NULL,
        valid_until DATETIME NULL,
        stripe_coupon_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
      )
    `);

    // coupon_redemptions: track which student used which coupon
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS coupon_redemptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        coupon_id INT NOT NULL,
        student_id INT NOT NULL,
        stripe_discount_id VARCHAR(255),
        redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
        UNIQUE KEY uq_coupon_student (coupon_id, student_id)
      )
    `);

    // AI usage cost tracking (per-call token and cost logging)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_usage_cost (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NULL,
        feature ENUM('ai_chat','resume_analysis','career_track','recommendation') NOT NULL,
        tokens_used INT NOT NULL DEFAULT 0,
        estimated_cost DECIMAL(10,6) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE SET NULL,
        INDEX idx_ai_usage_student (student_id),
        INDEX idx_ai_usage_feature (feature),
        INDEX idx_ai_usage_created_at (created_at)
      )
    `);

    // ── Internship Tables ─────────────────────────────────────────────────

    // internships: college-posted internship opportunities
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS internships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        logo_url VARCHAR(255),
        role VARCHAR(255) NOT NULL,
        stipend VARCHAR(100),
        duration VARCHAR(100),
        description TEXT,
        eligibility TEXT,
        location VARCHAR(255),
        type ENUM('remote','in-office','hybrid') DEFAULT 'in-office',
        start_date DATE,
        application_deadline DATE,
        apply_process TEXT,
        rounds JSON,
        required_skills JSON,
        perks TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
      )
    `);

    // internship_applications: student applications for internships
    // Drop and recreate to fix FK reference to Students(student_id)
    await connection.execute(`DROP TABLE IF EXISTS internship_experiences`);
    await connection.execute(`DROP TABLE IF EXISTS internship_applications`);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS internship_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        internship_id INT NOT NULL,
        student_id INT NOT NULL,
        status ENUM('applied','under_review','shortlisted','rejected','selected') DEFAULT 'applied',
        cover_letter TEXT,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
        UNIQUE KEY uq_internship_student (internship_id, student_id)
      )
    `);

    // internship_experiences: students sharing their internship journey
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS internship_experiences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        internship_id INT,
        student_id INT NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        duration VARCHAR(100),
        stipend VARCHAR(100),
        how_got_internship TEXT,
        selection_rounds JSON,
        industry_experience TEXT,
        tips_for_applicants TEXT,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        is_currently_interning BOOLEAN DEFAULT FALSE,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE SET NULL,
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE
      )
    `);

    // ── TPO System Tables ─────────────────────────────────────────────────

    // departments: college departments/branches
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        hod_name VARCHAR(255),
        hod_email VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        UNIQUE KEY uq_college_dept_code (college_id, code)
      )
    `);

    // tpo_users: departmental TPO accounts
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tpo_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT NOT NULL,
        department_id INT,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        designation VARCHAR(100),
        permissions JSON,
        invite_token VARCHAR(100),
        invite_expires_at TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      )
    `);

    // department_analytics: placement statistics per department
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS department_analytics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_id INT NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        total_students INT DEFAULT 0,
        placed_students INT DEFAULT 0,
        placement_rate DECIMAL(5,2) DEFAULT 0,
        avg_package DECIMAL(12,2) DEFAULT 0,
        highest_package DECIMAL(12,2) DEFAULT 0,
        total_offers INT DEFAULT 0,
        skill_gaps JSON,
        top_recruiters JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
        UNIQUE KEY uq_dept_period (department_id, period_start, period_end)
      )
    `);

    // tpo_invites: invite tokens for dept_tpo registration
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tpo_invites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT NOT NULL,
        department_id INT,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        designation VARCHAR(100),
        permissions JSON,
        token VARCHAR(100) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        accepted_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      )
    `);

    // ── ALTER existing tables for TPO support ─────────────────────────────

    // Add department_ids to placements (safe to run multiple times)
    try {
      await connection.execute(`
        ALTER TABLE placements ADD COLUMN department_ids JSON DEFAULT NULL
      `);
    } catch (_) { /* column may already exist */ }

    // Add department_ids to internships
    try {
      await connection.execute(`
        ALTER TABLE internships ADD COLUMN department_ids JSON DEFAULT NULL
      `);
    } catch (_) { /* column may already exist */ }

    // Add department_id to students
    try {
      await connection.execute(`
        ALTER TABLE students ADD COLUMN department_id INT DEFAULT NULL
      `);
    } catch (_) { /* column may already exist */ }

    // Add placement_status to students for tracking
    try {
      await connection.execute(`
        ALTER TABLE students ADD COLUMN placement_status ENUM('unplaced', 'placed', 'opted_out') DEFAULT 'unplaced'
      `);
    } catch (_) { /* column may already exist */ }

    // Add backlogs count to students
    try {
      await connection.execute(`
        ALTER TABLE students ADD COLUMN backlogs INT DEFAULT 0
      `);
    } catch (_) { /* column may already exist */ }

    connection.release();
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
