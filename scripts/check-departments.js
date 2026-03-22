const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDepartments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'StudentPath',
  });

  try {
    // Check departments for college_id = 4
    const [departments] = await connection.execute(
      'SELECT * FROM departments WHERE college_id = 4 ORDER BY created_at DESC'
    );

    console.log('\n=== Existing Departments for College ID 4 ===\n');
    if (departments.length === 0) {
      console.log('No departments found.');
    } else {
      departments.forEach((dept, index) => {
        console.log(`${index + 1}. ${dept.name}`);
        console.log(`   Code: ${dept.code}`);
        console.log(`   HOD: ${dept.hod_name || 'Not assigned'}`);
        console.log(`   Active: ${dept.is_active ? 'Yes' : 'No'}`);
        console.log(`   Created: ${dept.created_at}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkDepartments();
