/**
 * POST /api/resume/upload
 *
 * Upload a resume (PDF or DOCX) to Cloudinary, parse text, and store in DB.
 * Auth: Student only.
 * Max file size: 5MB.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { parseResume } from "@/lib/resume/parser";
import pool from "@/lib/db";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export async function POST(req: NextRequest) {
    try {
        // 1. Auth check
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse form data
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 3. Validate file type
        const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        const isDOCX = file.type === ALLOWED_TYPES[1] || file.name.toLowerCase().endsWith(".docx");

        if (!isPDF && !isDOCX) {
            return NextResponse.json(
                { error: "Invalid file type. Only PDF and DOCX files are accepted." },
                { status: 400 }
            );
        }

        // 4. Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 5MB." },
                { status: 400 }
            );
        }

        const fileType = isPDF ? "pdf" : "docx";
        const buffer = Buffer.from(await file.arrayBuffer());

        // 5. Upload to Cloudinary (raw resource)
        let fileUrl = "";
        try {
            const upload: any = await new Promise((resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        {
                            resource_type: "raw",
                            folder: "resumes",
                            public_id: `resume_${user.id}_${Date.now()}`,
                        },
                        (err: any, result: any) => (err ? reject(err) : resolve(result))
                    )
                    .end(buffer);
            });
            fileUrl = upload.secure_url;
        } catch (e) {
            console.error("[Resume Upload] Cloudinary upload failed:", e);
            return NextResponse.json({ error: "File upload failed" }, { status: 500 });
        }

        // 6. Parse resume text
        let parsedText = "";
        try {
            parsedText = await parseResume(buffer, fileType);
        } catch (e) {
            console.error("[Resume Upload] Text parsing failed:", e);
            // Still save the file even if parsing fails
            parsedText = "";
        }

        // 7. Save to database
        const [result]: any = await pool.execute(
            `INSERT INTO resumes (student_id, file_url, file_name, file_type, parsed_text)
       VALUES (?, ?, ?, ?, ?)`,
            [user.id, fileUrl, file.name, fileType, parsedText]
        );

        const resumeId = result.insertId;

        return NextResponse.json({
            success: true,
            resume: {
                id: resumeId,
                file_url: fileUrl,
                file_name: file.name,
                file_type: fileType,
                parsed_text_preview: parsedText.substring(0, 500),
                created_at: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("[Resume Upload] Error:", error);
        return NextResponse.json(
            { error: "Resume upload failed: " + (error as Error).message },
            { status: 500 }
        );
    }
}
