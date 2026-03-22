const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearInvites() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'StudentPath',
  });

  try {
    // Delete all pending invites for college_id 4
    const [result] = await connection.execute(
      'DELETE FROM tpo_invites WHERE college_id = 4 AND accepted_at IS NULL'
    );

    console.log(`✓ Deleted ${result.affectedRows} pending invite(s)`);
    console.log('\nYou can now create fresh invites!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

clearInvites();
