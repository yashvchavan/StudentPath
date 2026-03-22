/**
 * GET /api/career-tracks/init-db
 *
 * One-time endpoint to force-initialize all database tables including TPO system.
 * Safe to call multiple times (uses CREATE TABLE IF NOT EXISTS).
 * Remove this file after confirming tables are created.
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        // Force initialize all tables
        await initializeDatabase();

        // Verify tables exist
        const conn = await pool.getConnection();
        try {
            // Check career tables
            const [careerTables]: any = await conn.query(
                `SELECT TABLE_NAME
                 FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME IN ('career_plans', 'career_tasks', 'career_rewards')`
            );

            // Check TPO system tables
            const [tpoTables]: any = await conn.query(
                `SELECT TABLE_NAME
                 FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME IN ('departments', 'tpo_users', 'department_analytics', 'tpo_invites')`
            );

            // Check if department_ids column exists in placements
            const [placementsColumns]: any = await conn.query(
                `SELECT COLUMN_NAME
                 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'placements'
                 AND COLUMN_NAME = 'department_ids'`
            );

            // Check if department_ids column exists in internships
            const [internshipsColumns]: any = await conn.query(
                `SELECT COLUMN_NAME
                 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'internships'
                 AND COLUMN_NAME = 'department_ids'`
            );

            const careerTableNames = careerTables.map((t: any) => t.TABLE_NAME);
            const tpoTableNames = tpoTables.map((t: any) => t.TABLE_NAME);

            return NextResponse.json({
                success: true,
                message: "Database initialized successfully",
                career: {
                    tablesFound: careerTableNames,
                    allTablesCreated: careerTableNames.length === 3,
                },
                tpo: {
                    tablesFound: tpoTableNames,
                    allTablesCreated: tpoTableNames.length === 4,
                    placementsDeptColumn: placementsColumns.length > 0,
                    internshipsDeptColumn: internshipsColumns.length > 0,
                },
            });
        } finally {
            conn.release();
        }
    } catch (error: any) {
        console.error("DB init error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
