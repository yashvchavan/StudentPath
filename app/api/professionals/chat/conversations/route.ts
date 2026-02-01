import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

/**
 * GET /api/professionals/chat/conversations
 * Get all conversations for the current professional
 */
export async function GET() {
    let connection;
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_session")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET!);
        } catch (e) {
            return NextResponse.json(
                { error: "Invalid session" },
                { status: 401 }
            );
        }

        const professionalId = decoded?.id;
        const userRole = decoded?.role;

        if (!professionalId || userRole !== 'professional') {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        connection = await pool.getConnection();

        const [rows]: any = await connection.execute(
            `SELECT id, title, created_at, updated_at 
       FROM chat_conversations 
       WHERE user_id = ? AND user_type = 'professional'
       ORDER BY updated_at DESC 
       LIMIT 50`,
            [professionalId]
        );

        return NextResponse.json({
            success: true,
            conversations: rows || [],
        });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
