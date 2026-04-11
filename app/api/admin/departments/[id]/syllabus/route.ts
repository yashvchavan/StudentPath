import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireCentralTpo } from "@/lib/tpo-auth";

// ── Types ─────────────────────────────────────────────────────────────────
interface Subject {
  code?: string;
  name: string;
  credits?: number;
  type?: string;
  semester?: number;
}

// ── Table bootstrap ────────────────────────────────────────────────────────
async function ensureTable(conn: any) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS dept_syllabus (
      id INT AUTO_INCREMENT PRIMARY KEY,
      department_id INT NOT NULL,
      college_id INT NOT NULL,
      year TINYINT NOT NULL,
      title VARCHAR(255) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      file_size INT DEFAULT NULL,
      uploaded_by_id INT DEFAULT NULL,
      parsing_status ENUM('pending','done','failed') DEFAULT 'pending',
      parsed_subjects JSON DEFAULT NULL,
      parsed_at TIMESTAMP DEFAULT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dept_year (department_id, year),
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    )
  `);
  // Add new columns if they don't exist (safe ALTER)
  const safeAlter = async (sql: string) => {
    try { await conn.execute(sql); } catch (_) {}
  };
  await safeAlter("ALTER TABLE dept_syllabus ADD COLUMN parsing_status ENUM('pending','done','failed') DEFAULT 'pending'");
  await safeAlter("ALTER TABLE dept_syllabus ADD COLUMN parsed_subjects JSON DEFAULT NULL");
  await safeAlter("ALTER TABLE dept_syllabus ADD COLUMN parsed_at TIMESTAMP DEFAULT NULL");
}

// ── PDF text extraction (pure JS, no native bindings needed) ──────────────
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Use pdf-parse if available
    const pdfParse = await import("pdf-parse").catch(() => null);
    if (pdfParse) {
      const fn = (pdfParse as any).default || pdfParse;
      const result = await fn(buffer);
      return result.text || "";
    }
  } catch (e) {
    console.warn("[PDF Extract] pdf-parse failed:", e);
  }

  // Fallback: basic text extraction from PDF bytes
  // Looks for text streams in the PDF structure
  try {
    const str = buffer.toString("latin1");
    const textChunks: string[] = [];
    // Extract text from BT...ET blocks (PDF text objects)
    const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let match;
    while ((match = btEtRegex.exec(str)) !== null) {
      const block = match[1];
      // Extract content from Tj, TJ, ' operators
      const tjRegex = /\(([^)]*)\)\s*(?:Tj|'|")/g;
      let tj;
      while ((tj = tjRegex.exec(block)) !== null) {
        textChunks.push(tj[1]);
      }
      // TJ array format
      const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
      let tja;
      while ((tja = tjArrayRegex.exec(block)) !== null) {
        const inner = tja[1];
        const strParts = inner.match(/\(([^)]*)\)/g) || [];
        strParts.forEach(p => textChunks.push(p.replace(/^\(|\)$/g, "")));
      }
    }
    return textChunks.join(" ").replace(/\\n/g, "\n");
  } catch {
    return "";
  }
}

// ── Subject parsing from extracted text ───────────────────────────────────
/**
 * Attempt to parse structured subjects from PDF text.
 * Handles common Indian university syllabus formats.
 * Returns: { semesters: { "1": [{ code, name, credits, unit, type }], ... } }
 */
function parseSubjectsFromText(
  text: string,
  year: number
): { semesters: Record<string, Subject[]> } {
  const subjects: Subject[] = [];

  // Clean up text
  const lines = text
    .split(/\n|\r\n|\r/)
    .map(l => l.trim())
    .filter(Boolean);

  // Common patterns for Indian university syllabuses
  const semesterHeaderRegex = /semester\s*[-–—]?\s*([iIvVxX\d]+)/i;
  const subjectCodeRegex = /([A-Z]{2,5}\s*\d{3,6}[A-Z]?)/;
  const creditsRegex = /(\d)\s*credits?/i;

  // Try structured extraction: "Semester X" headers with subject rows
  let currentSemester = 1;
  const semesterMap: Record<string, Subject[]> = {};

  // Determine which semesters this syllabus covers based on year
  const yearToSems: Record<number, number[]> = {
    1: [1, 2],
    2: [3, 4],
    3: [5, 6],
    4: [7, 8],
  };
  const expectedSems = yearToSems[year] || [1, 2];

  // Pass 1: look for semester headers and extract subjects below them
  let detectedSemesters = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const semMatch = line.match(semesterHeaderRegex);
    if (semMatch) {
      const semNumStr = semMatch[1];
      let semNum = parseInt(semNumStr);
      // Handle roman numerals
      if (isNaN(semNum)) {
        const romanMap: Record<string, number> = {
          i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8,
        };
        semNum = romanMap[semNumStr.toLowerCase()] || 1;
      }
      currentSemester = semNum;
      detectedSemesters = true;
      if (!semesterMap[String(currentSemester)]) {
        semesterMap[String(currentSemester)] = [];
      }
      continue;
    }

    // Look for subject rows: code + name pattern
    const codeMatch = line.match(subjectCodeRegex);
    if (codeMatch) {
      const code = codeMatch[1].trim();
      const rest = line.replace(codeMatch[0], "").trim();
      const name = rest
        .replace(/\d+\s*credits?/i, "")
        .replace(/\d+\s*-\s*\d+/g, "") // remove number ranges
        .replace(/^\s*[-|]\s*/, "")
        .trim();

      if (name.length > 3) {
        const credMatch = line.match(creditsRegex);
        const credits = credMatch ? parseInt(credMatch[1]) : undefined;
        const type = /lab|practical|workshop/i.test(name) ? "Practical" : /project|seminar/i.test(name) ? "Project" : "Theory";

        const key = String(currentSemester);
        if (!semesterMap[key]) semesterMap[key] = [];
        semesterMap[key].push({
          code,
          name: name.replace(/\s+/g, " ").substring(0, 100),
          credits,
          type,
          semester: currentSemester,
        });
      }
    }
  }

  // If no structured detection, try heuristic: lines that look like subject names
  if (!detectedSemesters || Object.values(semesterMap).flat().length === 0) {
    const subjectNameRegex =
      /^(?:[A-Z][a-z]+\s+){1,6}(?:[A-Z][a-z]+)?$|^[A-Z][A-Z\s&]+$/;
    const skipPatterns =
      /university|college|department|syllabus|scheme|examination|total|credits|marks|sr\s*no|course\s*type/i;

    // Split expected semesters for the year
    let semIdx = 0;
    const subjectsPerSem: Subject[][] = [[], []];

    lines.forEach((line, idx) => {
      if (line.length < 5 || skipPatterns.test(line)) return;
      const codeMatch = line.match(subjectCodeRegex);
      const looksLikeSubject =
        codeMatch || (line.length > 10 && line.length < 80 && /[A-Z]/.test(line));

      if (looksLikeSubject) {
        const name = line
          .replace(codeMatch?.[0] || "", "")
          .replace(/\d+\s*credits?/i, "")
          .trim();
        if (!skipPatterns.test(name) && name.length > 5) {
          // Split roughly into two semesters
          const halfwayLine = Math.floor(lines.length / 2);
          const targetSem = idx < halfwayLine ? 0 : 1;
          subjectsPerSem[targetSem].push({
            code: codeMatch?.[1],
            name: name.substring(0, 100),
            type: /lab|practical/i.test(name) ? "Practical" : "Theory",
            semester: expectedSems[targetSem] || semIdx + 1,
          });
        }
      }
    });

    expectedSems.forEach((sem, i) => {
      if (subjectsPerSem[i]?.length > 0) {
        semesterMap[String(sem)] = subjectsPerSem[i];
      }
    });
  }

  // Ensure only expected semesters are returned for this year
  const result: Record<string, Subject[]> = {};
  expectedSems.forEach(sem => {
    const key = String(sem);
    if (semesterMap[key] && semesterMap[key].length > 0) {
      result[key] = semesterMap[key];
    }
  });

  // If we still have no subjects, return stub placeholders
  if (Object.values(result).flat().length === 0) {
    expectedSems.forEach(sem => {
      result[String(sem)] = [
        {
          name: "Subjects could not be parsed automatically",
          type: "Info",
          semester: sem,
        },
      ];
    });
  }

  return { semesters: result };
}

// ── GET handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireCentralTpo();
    const { id } = await params;
    const deptId = parseInt(id);
    if (isNaN(deptId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const conn = await pool.getConnection();
    try {
      await ensureTable(conn);
      const [depts]: any = await conn.execute(
        "SELECT id FROM departments WHERE id = ? AND college_id = ?",
        [deptId, session.college_id]
      );
      if (!depts.length) return NextResponse.json({ error: "Department not found" }, { status: 404 });

      const [files]: any = await conn.execute(
        "SELECT * FROM dept_syllabus WHERE department_id = ? ORDER BY year ASC, uploaded_at DESC",
        [deptId]
      );
      return NextResponse.json({ success: true, files });
    } finally {
      conn.release();
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── POST handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireCentralTpo();
    const { id } = await params;
    const deptId = parseInt(id);
    if (isNaN(deptId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const year = parseInt(formData.get("year") as string);
    const title = (formData.get("title") as string)?.trim();

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (isNaN(year) || year < 1 || year > 4)
      return NextResponse.json({ error: "Year must be 1-4" }, { status: 400 });
    if (file.type !== "application/pdf")
      return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 });
    if (file.size > 20 * 1024 * 1024)
      return NextResponse.json({ error: "File must be under 20MB" }, { status: 400 });

    const conn = await pool.getConnection();
    try {
      await ensureTable(conn);

      const [depts]: any = await conn.execute(
        "SELECT id FROM departments WHERE id = ? AND college_id = ?",
        [deptId, session.college_id]
      );
      if (!depts.length) return NextResponse.json({ error: "Department not found" }, { status: 404 });

      // 1. Upload file
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      let fileUrl: string;

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (cloudName && apiKey && apiSecret) {
        try {
          const base64 = buffer.toString("base64");
          const dataUri = `data:application/pdf;base64,${base64}`;
          const timestamp = Math.round(Date.now() / 1000);
          const folder = `studentpath/syllabus/dept_${deptId}`;
          const { createHash } = await import("crypto");
          const signature = createHash("sha1")
            .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
            .digest("hex");

          const fd = new FormData();
          fd.append("file", dataUri);
          fd.append("folder", folder);
          fd.append("timestamp", String(timestamp));
          fd.append("api_key", apiKey);
          fd.append("signature", signature);

          const upRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
            { method: "POST", body: fd }
          );
          const upData = await upRes.json();
          if (!upRes.ok) throw new Error(upData.error?.message || "Upload failed");
          fileUrl = upData.secure_url;
        } catch (cloudErr: any) {
          console.error("Cloudinary upload failed:", cloudErr.message);
          fileUrl = `/uploads/syllabus/${fileName}`;
        }
      } else {
        fileUrl = `/uploads/syllabus/${fileName}`;
      }

      // 2. Insert record with pending status
      const [result]: any = await conn.execute(
        `INSERT INTO dept_syllabus 
          (department_id, college_id, year, title, file_name, file_url, file_size, parsing_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [deptId, session.college_id, year, title, file.name, fileUrl, file.size]
      );
      const syllabusId = result.insertId;

      // 3. Parse subjects from PDF (async — do inline for simplicity)
      try {
        const text = await extractTextFromPdf(buffer);
        const parsed = parseSubjectsFromText(text, year);
        const subjectCount = Object.values(parsed.semesters).flat().length;

        console.log(`[Syllabus] Parsed ${subjectCount} subjects for dept ${deptId} year ${year}`);

        await conn.execute(
          `UPDATE dept_syllabus 
           SET parsing_status = 'done', parsed_subjects = ?, parsed_at = NOW()
           WHERE id = ?`,
          [JSON.stringify(parsed), syllabusId]
        );

        return NextResponse.json({
          success: true,
          message: `Syllabus uploaded and ${subjectCount} subjects parsed successfully`,
          file: {
            id: syllabusId, year, title, file_name: file.name, file_url: fileUrl,
            parsing_status: "done", subject_count: subjectCount,
          },
        });
      } catch (parseErr: any) {
        console.error("[Syllabus] Parsing failed:", parseErr);
        // Don't fail the upload — mark as done with empty subjects
        await conn.execute(
          `UPDATE dept_syllabus 
           SET parsing_status = 'failed'
           WHERE id = ?`,
          [syllabusId]
        );
        return NextResponse.json({
          success: true,
          warning: "File uploaded but subject extraction failed. Students may not see subjects.",
          message: "Syllabus uploaded",
          file: { id: syllabusId, year, title, file_name: file.name, file_url: fileUrl, parsing_status: "failed" },
        });
      }
    } finally {
      conn.release();
    }
  } catch (e: any) {
    console.error("[POST syllabus]", e);
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 });
  }
}
