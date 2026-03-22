const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPermissions() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'StudentPath',
  });

  try {
    // Check what's actually stored in permissions
    const [rows] = await connection.execute(
      'SELECT id, email, permissions FROM tpo_users LIMIT 5'
    );

    console.log('\n=== TPO Users Permissions ===\n');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.email}`);
      console.log(`   Raw permissions: "${row.permissions}"`);
      console.log(`   Type: ${typeof row.permissions}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkPermissions();