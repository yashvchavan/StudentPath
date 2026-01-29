import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

/**
 * GET /api/professionals/chat/conversations/[id]
 * Get a specific conversation with messages
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const connection = await pool.getConnection();

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

        // Verify conversation belongs to this professional
        const [convRows]: any = await connection.execute(
            `SELECT id, title FROM chat_conversations 
       WHERE id = ? AND user_id = ? AND user_type = 'professional'`,
            [conversationId, professionalId]
        );

        if (!convRows || convRows.length === 0) {
            connection.release();
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

        connection.release();

        return NextResponse.json({
            success: true,
            conversation: convRows[0],
            messages: messages || [],
        });
    } catch (error) {
        console.error("Error fetching conversation:", error);
        connection.release();
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
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
    const connection = await pool.getConnection();

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

        connection.release();

        return NextResponse.json({
            success: true,
            message: "Conversation deleted",
        });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        connection.release();
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
