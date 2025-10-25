import { NextRequest, NextResponse } from "next/server";
import { getUserContext, saveUserContext } from "@/lib/chat";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const userType = searchParams.get("userType");

    if (!userId || !userType) {
      return NextResponse.json({ error: "userId and userType are required" }, { status: 400 });
    }

    const context = await getUserContext(Number(userId), userType as any);
    return NextResponse.json({ context });
  } catch (error) {
    console.error("Get user context error:", error);
    return NextResponse.json({ error: "Failed to fetch user context" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userType, contextData } = body;

    if (!userId || !userType || contextData === undefined) {
      return NextResponse.json({ error: "userId, userType and contextData are required" }, { status: 400 });
    }

    await saveUserContext(Number(userId), userType as any, contextData);
    return NextResponse.json({ success: true, message: "Context saved" });
  } catch (error) {
    console.error("Save user context error:", error);
    return NextResponse.json({ error: "Failed to save context" }, { status: 500 });
  }
}
