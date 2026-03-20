const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateStudentDepartments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'StudentPath',
  });

  try {
    console.log('\n=== Migrating Student Department Assignments ===\n');

    // Define program to department mapping
    const programToDepartment = {
      'Computer Science Engineering': 2, // CSE department
      'Information Technology': 1,       // COMP department
      'CSE': 2,                          // CSE department
      'Mechanical Engineering': 3,       // ME department
      'Computer Engineering': 1,         // COMP department
    };

    console.log('Program to Department Mapping:');
    Object.entries(programToDepartment).forEach(([program, deptId]) => {
      console.log(`- "${program}" → Department ID ${deptId}`);
    });
    console.log();

    // Update each program group
    for (const [program, departmentId] of Object.entries(programToDepartment)) {
      const [result] = await connection.execute(
        'UPDATE Students SET department_id = ? WHERE program = ?',
        [departmentId, program]
      );

      console.log(`✓ Updated ${result.affectedRows} students with program "${program}" to department ID ${departmentId}`);
    }

    // Check results
    console.log('\n=== Migration Results ===\n');

    const [stats] = await connection.execute(`
      SELECT
        COUNT(*) as total_students,
        COUNT(department_id) as students_with_dept_id
      FROM Students
    `);

    console.log(`Total students: ${stats[0].total_students}`);
    console.log(`Students with department_id: ${stats[0].students_with_dept_id}`);

    // Show department distribution
    console.log('\nDepartment Distribution:');
    const [distribution] = await connection.execute(`
      SELECT
        d.name as department_name,
        d.code as department_code,
        COUNT(s.student_id) as student_count
      FROM departments d
      LEFT JOIN Students s ON d.id = s.department_id
      GROUP BY d.id, d.name, d.code
      ORDER BY student_count DESC
    `);

    distribution.forEach(row => {
      console.log(`- ${row.department_name} (${row.department_code}): ${row.student_count} students`);
    });

    // Show students without department_id (should be 0 after migration)
    const [orphaned] = await connection.execute(`
      SELECT COUNT(*) as count FROM Students WHERE department_id IS NULL
    `);

    console.log(`\nStudents without department_id: ${orphaned[0].count}`);

    if (orphaned[0].count > 0) {
      console.log('\nStudents without department assignment:');
      const [orphanedStudents] = await connection.execute(`
        SELECT student_id, first_name, last_name, program
        FROM Students
        WHERE department_id IS NULL
        LIMIT 10
      `);

      orphanedStudents.forEach(student => {
        console.log(`- Student ${student.student_id}: ${student.first_name} ${student.last_name} (program: ${student.program || 'NULL'})`);
      });
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await connection.end();
  }
}

migrateStudentDepartments();