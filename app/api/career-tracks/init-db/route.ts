/**
 * GET /api/career-tracks/init-db
 *
 * One-time endpoint to force-initialize the career gamification tables.
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

        // Verify the career tables exist
        const conn = await pool.getConnection();
        try {
            const [tables]: any = await conn.query(
                `SELECT TABLE_NAME 
                 FROM information_schema.TABLES 
                 WHERE TABLE_SCHEMA = DATABASE() 
                 AND TABLE_NAME IN ('career_plans', 'career_tasks', 'career_rewards')`
            );

            const tableNames = tables.map((t: any) => t.TABLE_NAME);

            return NextResponse.json({
                success: true,
                message: "Database initialized successfully",
                careerTablesFound: tableNames,
                allTablesCreated: tableNames.length === 3,
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
