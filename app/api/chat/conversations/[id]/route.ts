import { NextRequest, NextResponse } from "next/server";
import {
    getConversation,
    getConversationMessages,
    deleteConversation,
    archiveConversation,
    updateConversationTitle,
} from "@/lib/chat";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Next.js 15+ - params is now a Promise
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_session")?.value;

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET!);
        } catch (e) {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        const userId = decoded.id;
        const userType = decoded.role as "student" | "professional";

        if (!userId || !userType) {
            return NextResponse.json({ error: "Invalid session data" }, { status: 401 });
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
        const { title, archive } = await req.json();

        const cookieStore = await cookies();
        const token = cookieStore.get("auth_session")?.value;

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET!);
        } catch (e) {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        const userId = decoded.id;
        const userType = decoded.role as "student" | "professional";

        if (!userId || !userType) {
            return NextResponse.json({ error: "Invalid session data" }, { status: 401 });
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
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_session")?.value;

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET!);
        } catch (e) {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        const userId = decoded.id;
        const userType = decoded.role as "student" | "professional";

        if (!userId || !userType) {
            return NextResponse.json({ error: "Invalid session data" }, { status: 401 });
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