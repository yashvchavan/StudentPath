const mysql = require('mysql2/promise');
require('dotenv').config();

async function addMissingColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'StudentPath',
  });

  try {
    console.log('Adding missing columns to Students table...\n');

    // Add department_id
    try {
      await connection.execute(`
        ALTER TABLE Students
        ADD COLUMN department_id INT DEFAULT NULL,
        ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      `);
      console.log('✓ Added department_id column');
    } catch (err) {
      if (err.errno === 1060) {
        console.log('✓ department_id column already exists');
      } else {
        console.log('✗ Error adding department_id:', err.message);
      }
    }

    // Add placement_status
    try {
      await connection.execute(`
        ALTER TABLE Students
        ADD COLUMN placement_status ENUM('unplaced', 'placed', 'opted_out') DEFAULT 'unplaced'
      `);
      console.log('✓ Added placement_status column');
    } catch (err) {
      if (err.errno === 1060) {
        console.log('✓ placement_status column already exists');
      } else {
        console.log('✗ Error adding placement_status:', err.message);
      }
    }

    // Add backlogs
    try {
      await connection.execute(`
        ALTER TABLE Students
        ADD COLUMN backlogs INT DEFAULT 0
      `);
      console.log('✓ Added backlogs column');
    } catch (err) {
      if (err.errno === 1060) {
        console.log('✓ backlogs column already exists');
      } else {
        console.log('✗ Error adding backlogs:', err.message);
      }
    }

    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error.message);
  } finally {
    await connection.end();
  }
}

addMissingColumns();
