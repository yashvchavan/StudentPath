const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkInvites() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'StudentPath',
  });

  try {
    const [invites] = await connection.execute(
      `SELECT ti.*, d.name as dept_name
       FROM tpo_invites ti
       LEFT JOIN departments d ON ti.department_id = d.id
       WHERE ti.college_id = 4 AND ti.accepted_at IS NULL
       ORDER BY ti.created_at DESC`
    );

    console.log('\n=== Pending TPO Invites for College ID 4 ===\n');
    if (invites.length === 0) {
      console.log('No pending invites found.');
    } else {
      invites.forEach((inv, index) => {
        console.log(`${index + 1}. ${inv.name} <${inv.email}>`);
        console.log(`   Department: ${inv.dept_name || 'Not assigned'}`);
        console.log(`   Token: ${inv.token}`);
        console.log(`   Expires: ${inv.expires_at}`);
        console.log(`   Invite URL: http://localhost:3000/auth/accept-invite?token=${inv.token}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkInvites();
