const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkStudentsStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'StudentPath',
  });

  try {
    // Get Students table structure
    const [columns] = await connection.execute(
      `DESCRIBE Students`
    );

    console.log('\n=== Students Table Structure ===\n');
    columns.forEach((col) => {
      console.log(`${col.Field} - ${col.Type} - ${col.Key} - ${col.Null} - ${col.Default}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkStudentsStructure();
