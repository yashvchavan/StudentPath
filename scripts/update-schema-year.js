const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function updateSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306'),
        multipleStatements: true
    });

    try {
        console.log('Connected to database. Updating schema...');

        // Add academic_year column if it doesn't exist
        try {
            await connection.execute(`
            ALTER TABLE placements 
            ADD COLUMN academic_year VARCHAR(20) AFTER company_name;
        `);
            console.log("Added 'academic_year' column to 'placements' table.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("'academic_year' column already exists.");
            } else {
                throw err;
            }
        }

        console.log('Schema update completed successfully!');
    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        await connection.end();
    }
}

updateSchema();
