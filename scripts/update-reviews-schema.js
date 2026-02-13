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

        // Add is_anonymous column to placement_reviews
        try {
            await connection.execute(`
            ALTER TABLE placement_reviews 
            ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;
        `);
            console.log("Added 'is_anonymous' column to 'placement_reviews' table.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("'is_anonymous' column already exists.");
            } else {
                console.error("Error adding column:", err);
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
