-- Academic Profiles
CREATE TABLE IF NOT EXISTS academic_profiles (
  userId VARCHAR(36) PRIMARY KEY,
  program VARCHAR(100) NOT NULL,
  currentYear VARCHAR(10) NOT NULL,
  currentSemester VARCHAR(10),
  enrollmentYear VARCHAR(4),
  currentGPA DECIMAL(3,2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Academic Interests
CREATE TABLE IF NOT EXISTS academic_interests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  interest VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE KEY unique_user_interest (userId, interest)
);

-- Career Quiz Answers
CREATE TABLE IF NOT EXISTS career_quiz_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  questionId VARCHAR(50) NOT NULL,
  answer VARCHAR(50) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE KEY unique_user_question (userId, questionId)
);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  skillType ENUM('technical', 'soft', 'language') NOT NULL,
  skillName VARCHAR(100) NOT NULL,
  proficiencyLevel INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE KEY unique_user_skill (userId, skillType, skillName)
);

-- Career Goals
CREATE TABLE IF NOT EXISTS career_goals (
  userId VARCHAR(36) PRIMARY KEY,
  primaryGoal VARCHAR(100) NOT NULL,
  secondaryGoal VARCHAR(100),
  timeline VARCHAR(50),
  locationPreference VARCHAR(100),
  intensityLevel VARCHAR(20) DEFAULT 'moderate',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Industry Focus
CREATE TABLE IF NOT EXISTS industry_focus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE KEY unique_user_industry (userId, industry)
);