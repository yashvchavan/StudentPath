import { NextRequest, NextResponse } from "next/server";
import {
    getUserConversations,
    createConversation,
    getConversationStats,
} from "@/lib/chat";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const includeArchived = searchParams.get("includeArchived") === "true";

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
        const { title } = await req.json();

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