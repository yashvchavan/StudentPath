import { NextRequest, NextResponse } from "next/server";
import {
    getUserConversations,
    createConversation,
    getConversationStats,
} from "@/lib/chat";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const userType = searchParams.get("userType") as "student" | "professional";
        const includeArchived = searchParams.get("includeArchived") === "true";

        if (!userId || !userType) {
            return NextResponse.json({ error: "userId and userType are required" }, { status: 400 });
        }

        const conversations = await getUserConversations(Number(userId), userType, includeArchived);
        const stats = await getConversationStats(Number(userId), userType);

        return NextResponse.json({ conversations, stats });
    } catch (error) {
        console.error("Get conversations error:", error);
        return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId, userType, title } = await req.json();

        if (!userId || !userType) {
            return NextResponse.json({ error: "userId and userType are required" }, { status: 400 });
        }

        const conversationId = await createConversation(Number(userId), userType, title);

        return NextResponse.json({
            conversationId,
            message: "Conversation created successfully",
        });
    } catch (error) {
        console.error("Create conversation error:", error);
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }
}