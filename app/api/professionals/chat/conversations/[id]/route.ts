import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

/**
 * GET /api/professionals/chat/conversations/[id]
 * Get a specific conversation with messages
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let connection;
    try {
        const { id } = await params;
        const conversationId = parseInt(id, 10);

        if (isNaN(conversationId)) {
            return NextResponse.json(
                { error: "Invalid conversation ID" },
                { status: 400 }
            );
        }

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

        // Verify conversation belongs to this professional
        const [convRows]: any = await connection.execute(
            `SELECT id, title FROM chat_conversations 
       WHERE id = ? AND user_id = ? AND user_type = 'professional'`,
            [conversationId, professionalId]
        );

        if (!convRows || convRows.length === 0) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        // Get messages
        const [messages]: any = await connection.execute(
            `SELECT id, role, content, created_at 
       FROM chat_messages 
       WHERE conversation_id = ?
       ORDER BY created_at ASC`,
            [conversationId]
        );

        return NextResponse.json({
            success: true,
            conversation: convRows[0],
            messages: messages || [],
        });
    } catch (error) {
        console.error("Error fetching conversation:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

/**
 * DELETE /api/professionals/chat/conversations/[id]
 * Delete a conversation
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let connection;

    try {
        const { id } = await params;
        const conversationId = parseInt(id, 10);

        if (isNaN(conversationId)) {
            return NextResponse.json(
                { error: "Invalid conversation ID" },
                { status: 400 }
            );
        }

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

        // Delete messages first
        await connection.execute(
            `DELETE FROM chat_messages WHERE conversation_id = ?`,
            [conversationId]
        );

        // Delete conversation
        await connection.execute(
            `DELETE FROM chat_conversations 
       WHERE id = ? AND user_id = ? AND user_type = 'professional'`,
            [conversationId, professionalId]
        );

        return NextResponse.json({
            success: true,
            message: "Conversation deleted",
        });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
