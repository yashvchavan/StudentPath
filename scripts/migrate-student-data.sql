-- Migration Script: Backfill student data from separate tables into Students table
-- Run this once to migrate existing data

-- 1. Backfill academic profile data
UPDATE Students s
JOIN academic_profiles ap ON s.student_id = ap.student_id
SET 
  s.program = COALESCE(s.program, ap.program),
  s.current_year = COALESCE(s.current_year, ap.currentYear),
  s.current_semester = COALESCE(s.current_semester, ap.currentSemester),
  s.enrollment_year = COALESCE(s.enrollment_year, ap.enrollmentYear),
  s.current_gpa = COALESCE(s.current_gpa, ap.currentGPA)
WHERE s.program IS NULL OR s.current_year IS NULL;

-- 2. Backfill academic interests (as JSON array)
UPDATE Students s
SET s.academic_interests = (
  SELECT JSON_ARRAYAGG(ai.interest)
  FROM academic_interests ai
  WHERE ai.student_id = s.student_id
)
WHERE s.academic_interests IS NULL
  AND EXISTS (SELECT 1 FROM academic_interests ai WHERE ai.student_id = s.student_id);

-- 3. Backfill career quiz answers (as JSON object)
UPDATE Students s
SET s.career_quiz_answers = (
  SELECT JSON_OBJECTAGG(cqa.questionId, cqa.answer)
  FROM career_quiz_answers cqa
  WHERE cqa.student_id = s.student_id
)
WHERE s.career_quiz_answers IS NULL
  AND EXISTS (SELECT 1 FROM career_quiz_answers cqa WHERE cqa.student_id = s.student_id);

-- 4. Backfill technical skills (as JSON object: name -> level)
UPDATE Students s
SET s.technical_skills = (
  SELECT JSON_OBJECTAGG(sk.skillName, sk.proficiencyLevel)
  FROM skills sk
  WHERE sk.student_id = s.student_id AND sk.skillType = 'technical'
)
WHERE s.technical_skills IS NULL
  AND EXISTS (SELECT 1 FROM skills sk WHERE sk.student_id = s.student_id AND sk.skillType = 'technical');

-- 5. Backfill soft skills (as JSON object: name -> level)
UPDATE Students s
SET s.soft_skills = (
  SELECT JSON_OBJECTAGG(sk.skillName, sk.proficiencyLevel)
  FROM skills sk
  WHERE sk.student_id = s.student_id AND sk.skillType = 'soft'
)
WHERE s.soft_skills IS NULL
  AND EXISTS (SELECT 1 FROM skills sk WHERE sk.student_id = s.student_id AND sk.skillType = 'soft');

-- 6. Backfill language skills (as JSON object: name -> level)
UPDATE Students s
SET s.language_skills = (
  SELECT JSON_OBJECTAGG(sk.skillName, sk.proficiencyLevel)
  FROM skills sk
  WHERE sk.student_id = s.student_id AND sk.skillType = 'language'
)
WHERE s.language_skills IS NULL
  AND EXISTS (SELECT 1 FROM skills sk WHERE sk.student_id = s.student_id AND sk.skillType = 'language');

-- 7. Backfill career goals
UPDATE Students s
JOIN career_goals cg ON s.student_id = cg.student_id
SET 
  s.primary_goal = COALESCE(s.primary_goal, cg.primaryGoal),
  s.secondary_goal = COALESCE(s.secondary_goal, cg.secondaryGoal),
  s.timeline = COALESCE(s.timeline, cg.timeline),
  s.location_preference = COALESCE(s.location_preference, cg.locationPreference),
  s.intensity_level = COALESCE(s.intensity_level, cg.intensityLevel)
WHERE s.primary_goal IS NULL;

-- 8. Backfill industry focus (as JSON array)
UPDATE Students s
SET s.industry_focus = (
  SELECT JSON_ARRAYAGG(inf.industry)
  FROM industry_focus inf
  WHERE inf.student_id = s.student_id
)
WHERE s.industry_focus IS NULL
  AND EXISTS (SELECT 1 FROM industry_focus inf WHERE inf.student_id = s.student_id);

-- Verify migration
SELECT 
  student_id, 
  first_name, 
  last_name,
  program,
  current_year,
  academic_interests,
  technical_skills,
  primary_goal,
  industry_focus
FROM Students 
LIMIT 10;
