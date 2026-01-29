import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

/**
 * GET /api/professionals/chat/conversations
 * Get all conversations for the current professional
 */
export async function GET() {
    const connection = await pool.getConnection();

    try {
        const cookieStore = await cookies();
        const professionalCookie = cookieStore.get("professionalData")?.value;

        if (!professionalCookie) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        let professionalData;
        try {
            professionalData = JSON.parse(professionalCookie);
        } catch {
            return NextResponse.json(
                { error: "Invalid session" },
                { status: 401 }
            );
        }

        const professionalId = professionalData?.id;
        if (!professionalId) {
            return NextResponse.json(
                { error: "Invalid session" },
                { status: 401 }
            );
        }

        const [rows]: any = await connection.execute(
            `SELECT id, title, created_at, updated_at 
       FROM chat_conversations 
       WHERE user_id = ? AND user_type = 'professional'
       ORDER BY updated_at DESC 
       LIMIT 50`,
            [professionalId]
        );

        connection.release();

        return NextResponse.json({
            success: true,
            conversations: rows || [],
        });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        connection.release();
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
