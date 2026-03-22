const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTpoUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'StudentPath',
  });

  try {
    console.log('\n=== TPO Users and Department Assignments ===\n');

    // Check TPO users
    const [tpoUsers] = await connection.execute(`
      SELECT tu.id, tu.email, tu.name, tu.college_id, tu.department_id, tu.is_active,
             d.name as department_name, d.code as department_code
      FROM tpo_users tu
      LEFT JOIN departments d ON tu.department_id = d.id
      ORDER BY tu.id
    `);

    if (tpoUsers.length === 0) {
      console.log('No TPO users found in the database.');
    } else {
      console.log('TPO Users:');
      tpoUsers.forEach(user => {
        console.log(`- ID ${user.id}: ${user.name} (${user.email})`);
        console.log(`  College ID: ${user.college_id}`);
        console.log(`  Department: ${user.department_name || 'NULL'} (${user.department_code || 'N/A'})`);
        console.log(`  Department ID: ${user.department_id || 'NULL'}`);
        console.log(`  Active: ${user.is_active ? 'Yes' : 'No'}`);
        console.log();
      });
    }

    // Show student counts per department for reference
    console.log('Student Counts per Department:');
    const [studentCounts] = await connection.execute(`
      SELECT
        d.id, d.name, d.code,
        COUNT(s.student_id) as student_count
      FROM departments d
      LEFT JOIN Students s ON d.id = s.department_id
      GROUP BY d.id, d.name, d.code
      ORDER BY d.id
    `);

    studentCounts.forEach(dept => {
      console.log(`- Department ${dept.id}: ${dept.name} (${dept.code}) - ${dept.student_count} students`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTpoUsers();