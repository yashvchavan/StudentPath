import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import axios from "axios";
import { parsePlacementExcel } from "@/lib/placementParser";
import { insertPlacements } from "@/lib/placementRepository";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        console.log("[Admin Upload] Request received");
        const user = await getAuthUser();

        if (!user || user.role !== "college" || !user.college_id) {
            console.log("[Admin Upload] Unauthorized access attempt", user);
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const collegeId = user.college_id;

        const formData = await req.formData();
        const file = formData.get("file") as File;
        console.log(`[Admin Upload] User: ${user.email}, File: ${file?.name}, Size: ${file?.size}`);

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to Cloudinary
        let fileUrl = "";
        try {
            console.log("[Admin Upload] Starting Cloudinary upload...");
            const upload: any = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { resource_type: "raw", folder: "placements" },
                    (err, result) => (err ? reject(err) : resolve(result))
                ).end(buffer);
            });
            fileUrl = upload.secure_url;
            console.log("[Admin Upload] Cloudinary upload successful:", fileUrl);
        } catch (e) {
            console.error("[Admin Upload] Cloudinary upload failed", e);
            return NextResponse.json({ error: "File upload failed" }, { status: 500 });
        }

        // Parse
        console.log("[Admin Upload] Parsing Excel...");
        const parsedRows = parsePlacementExcel(buffer);
        console.log(`[Admin Upload] Parsed ${parsedRows.length} rows from Excel`);

        if (parsedRows.length === 0) {
            console.warn("[Admin Upload] No rows were parsed! Check logs for 'Skipping row' messages.");
            return NextResponse.json({
                success: false,
                message: "No valid records found in the Excel file. Please check column headers.",
                recordsInserted: 0
            });
        }

        // Insert
        console.log("[Admin Upload] Inserting into database...");
        await insertPlacements(collegeId, parsedRows, fileUrl);
        console.log("[Admin Upload] Database insertion complete");

        return NextResponse.json({
            success: true,
            recordsInserted: parsedRows.length,
        });
    } catch (err) {
        console.error("[Admin Upload] Critical Failure:", err);
        return NextResponse.json(
            { error: "Placement upload failed: " + (err as Error).message },
            { status: 500 }
        );
    }
}
