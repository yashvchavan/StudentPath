const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDepartmentId() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'StudentPath',
  });

  try {
    // Check if department_id column exists
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = 'StudentPath' AND TABLE_NAME = 'Students' AND COLUMN_NAME = 'department_id'`
    );

    if (columns.length === 0) {
      // Column doesn't exist, add it without foreign key for now
      console.log('Adding department_id column...');
      await connection.execute(`
        ALTER TABLE Students
        ADD COLUMN department_id INT DEFAULT NULL
      `);
      console.log('✓ Added department_id column');
    } else {
      console.log('✓ department_id column already exists');
    }

    // Now let's verify the structure
    console.log('\n=== Updated Students Table Columns ===\n');
    const [allColumns] = await connection.execute(`DESCRIBE Students`);
    const relevantColumns = allColumns.filter(col =>
      ['student_id', 'department_id', 'placement_status', 'backlogs'].includes(col.Field)
    );
    relevantColumns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Key === 'PRI' ? '(PRIMARY KEY)' : ''}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixDepartmentId();
