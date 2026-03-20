const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkStudentDepartments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'StudentPath',
  });

  try {
    console.log('\n=== Checking Students Table Department Data ===\n');

    // Check total vs students with department_id
    const [stats] = await connection.execute(`
      SELECT
        COUNT(*) as total_students,
        COUNT(department_id) as students_with_dept_id,
        COUNT(program) as students_with_program
      FROM Students
    `);

    console.log('Student Statistics:');
    console.log(`- Total students: ${stats[0].total_students}`);
    console.log(`- Students with department_id: ${stats[0].students_with_dept_id}`);
    console.log(`- Students with program: ${stats[0].students_with_program}`);

    // Show sample students
    console.log('\nSample Students (first 10):');
    const [students] = await connection.execute(`
      SELECT student_id, first_name, last_name, program, department_id
      FROM Students
      ORDER BY student_id
      LIMIT 10
    `);

    students.forEach(student => {
      console.log(`- Student ${student.student_id}: ${student.first_name} ${student.last_name}`);
      console.log(`  Program: ${student.program || 'NULL'}`);
      console.log(`  Department ID: ${student.department_id || 'NULL'}`);
      console.log();
    });

    // Show available departments
    console.log('Available Departments:');
    const [departments] = await connection.execute(`
      SELECT id, name, code, college_id
      FROM departments
      ORDER BY id
    `);

    departments.forEach(dept => {
      console.log(`- ID ${dept.id}: ${dept.name} (${dept.code}) - College ${dept.college_id}`);
    });

    // Show program distribution
    console.log('\nProgram Distribution:');
    const [programs] = await connection.execute(`
      SELECT program, COUNT(*) as count
      FROM Students
      WHERE program IS NOT NULL AND program != ''
      GROUP BY program
      ORDER BY count DESC
    `);

    programs.forEach(prog => {
      console.log(`- ${prog.program}: ${prog.count} students`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkStudentDepartments();