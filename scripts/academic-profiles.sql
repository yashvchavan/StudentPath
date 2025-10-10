CREATE TABLE IF NOT EXISTS academic_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    program VARCHAR(255) NOT NULL,
    currentYear INT NOT NULL,
    currentSemester VARCHAR(50),
    enrollmentYear INT,
    currentGPA DECIMAL(3,2),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user (userId),
    FOREIGN KEY (userId) REFERENCES Students(student_id)
);