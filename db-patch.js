require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const mysql = require('mysql2/promise');

async function run() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'studentpath',
    port: parseInt(process.env.DB_PORT || '3306'),
    ssl: { rejectUnauthorized: false } // Aiven needs SSL typically
  };

  const pool = mysql.createPool(dbConfig);
  
  try {
    const [rows] = await pool.execute('ALTER TABLE professionals ADD COLUMN leetcode_url VARCHAR(255) NULL');
    console.log("Added leetcode_url", rows);
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('Column leetcode_url already exists');
    } else {
       console.log('Error adding leetcode_url:', e);
    }
  }

  try {
    const [rows] = await pool.execute('ALTER TABLE professionals ADD COLUMN level VARCHAR(50) NULL');
    console.log("Added level", rows);
  } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('Column level already exists');
    } else {
       console.log('Error adding level:', e);
    }
  }

}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
