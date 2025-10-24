import { NextRequest, NextResponse } from "next/server";
import {
    getConversation,
    getConversationMessages,
    deleteConversation,
    archiveConversation,
    updateConversationTitle,
} from "@/lib/chat";

// Next.js 15+ - params is now a Promise
export async function GET(
    req: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const userType = searchParams.get("userType") as "student" | "professional";

        if (!userId || !userType) {
            return NextResponse.json({ error: "userId and userType are required" }, { status: 400 });
        }

        const resolvedParams = await params;
        const conversationId = parseInt(resolvedParams.id);
        
        if (isNaN(conversationId)) {
            return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
        }

        const conversation = await getConversation(conversationId, Number(userId), userType);

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        const messages = await getConversationMessages(conversationId);

        return NextResponse.json({ conversation, messages });
    } catch (error) {
        console.error("Get conversation error:", error);
        return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { title, archive, userId, userType } = await req.json();

        if (!userId || !userType) {
            return NextResponse.json({ error: "userId and userType are required" }, { status: 400 });
        }

        const resolvedParams = await params;
        const conversationId = parseInt(resolvedParams.id);
        
        if (isNaN(conversationId)) {
            return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
        }

        const conversation = await getConversation(conversationId, Number(userId), userType);

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found or access denied" }, { status: 404 });
        }

        if (title !== undefined) await updateConversationTitle(conversationId, title);
        if (archive !== undefined) await archiveConversation(conversationId, archive);

        return NextResponse.json({ message: "Conversation updated successfully" });
    } catch (error) {
        console.error("Update conversation error:", error);
        return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, userType } = await req.json();

        if (!userId || !userType) {
            return NextResponse.json({ error: "userId and userType are required" }, { status: 400 });
        }

        const resolvedParams = await params;
        const conversationId = parseInt(resolvedParams.id);
        
        if (isNaN(conversationId)) {
            return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
        }

        await deleteConversation(conversationId, Number(userId), userType);

        return NextResponse.json({ message: "Conversation deleted successfully" });
    } catch (error) {
        console.error("Delete conversation error:", error);
        return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
    }
}