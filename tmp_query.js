const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({
    host: 'studentpath-atharvabagade2312-d3eb.d.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_ZlEVtgizslmXeWE4n0K',
    database: 'StudentPath',
    port: 26363,
    ssl: { rejectUnauthorized: false }
  });
  const [rows] = await conn.execute("SELECT c.id FROM colleges c JOIN college_tokens ct ON c.id = ct.college_id WHERE ct.token = 'Vx7Kw3RZUhifW6LujscL' AND ct.is_active = TRUE AND c.is_active = TRUE");
  console.log('Result:', rows);
  
  const [erpRows] = await conn.execute("SELECT COUNT(*) as count FROM college_erp_students WHERE college_id = 19");
  console.log('ERP Rows:', erpRows);

  await conn.end();
}
run().catch(e => console.error(e.message));
