import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { addReview, getReviews } from "@/lib/placementRepository";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const reviews = await getReviews(parseInt(id));
        return NextResponse.json({ success: true, data: reviews });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Only students can review" }, { status: 403 });
        }

        const body = await req.json();
        const { rating, comment } = body;

        if (!rating || !comment) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        await addReview(parseInt(id), Number(user.id), rating, comment);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Review error:", error);
        return NextResponse.json({ error: "Failed to add review" }, { status: 500 });
    }
}
