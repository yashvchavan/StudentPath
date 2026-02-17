/**
 * Resume Parser Utility
 * Extracts plain text from PDF and DOCX resume files.
 *
 * PDF: Uses `unpdf` — a serverless-optimized wrapper around Mozilla's PDF.js
 *      that works in Next.js without native addons or canvas.
 * DOCX: Uses `mammoth` for text extraction.
 */

import mammoth from "mammoth";

/**
 * Extract text from a PDF buffer using unpdf (serverless PDF.js).
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
    try {
        const { getDocumentProxy, extractText } = await import("unpdf");

        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        const result = await extractText(pdf, { mergePages: true });
        const text = typeof result.text === "string"
            ? result.text
            : (result.text as string[]).join("\n");

        if (!text || text.trim().length < 20) {
            throw new Error(
                "Could not extract sufficient text. The PDF may be image-based or scanned."
            );
        }

        return text.trim();
    } catch (error: any) {
        console.error("[ResumeParser] PDF parsing error:", error?.message || error);
        throw new Error(
            "Failed to parse PDF: " + (error?.message || "Unknown error")
        );
    }
}

/**
 * Extract text from a DOCX buffer.
 */
export async function parseDOCX(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value.trim();
    } catch (error) {
        console.error("[ResumeParser] DOCX parsing failed:", error);
        throw new Error("Failed to parse DOCX file. The file may be corrupted.");
    }
}

/**
 * Parse a resume file buffer based on file type.
 * Returns extracted plain text.
 */
export async function parseResume(
    buffer: Buffer,
    fileType: "pdf" | "docx"
): Promise<string> {
    if (fileType === "pdf") {
        return parsePDF(buffer);
    } else if (fileType === "docx") {
        return parseDOCX(buffer);
    }
    throw new Error(`Unsupported file type: ${fileType}`);
}
