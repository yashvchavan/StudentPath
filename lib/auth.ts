import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthUser {
    id: number | string; // Allow string ID for student_id
    role: "student" | "professional" | "college";
    email: string;
    name: string;
    college_id?: number;
    logo_url?: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_session")?.value;

        if (!token) {
            // console.log("[Auth] No token found in cookies");
            return null;
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            console.error("[Auth] Token verification failed:", e);
            return null;
        }

        const userId = decoded.id;
        const userRole = decoded.role;

        // console.log(`[Auth] Decoded: UserID=${userId}, Role=${userRole}`);

        if (!userId || !userRole) return null;

        const connection = await pool.getConnection();

        try {
            if (userRole === "college") {
                const [rows]: any = await connection.execute(
                    "SELECT id, college_name, email, logo_url FROM colleges WHERE id = ?",
                    [userId]
                );
                if (rows.length > 0) {
                    const college = rows[0];
                    return {
                        id: college.id,
                        role: "college",
                        email: college.email,
                        name: college.college_name,
                        college_id: college.id,
                        logo_url: college.logo_url,
                    };
                }
            } else if (userRole === "student") {
                // MATCHING api/auth/me Logic:
                // Students table uses 'student_id' column, not 'id'

                try {
                    const [rows]: any = await connection.execute(
                        "SELECT student_id, first_name, last_name, email, college_id FROM Students WHERE student_id = ?",
                        [userId]
                    );

                    if (rows.length > 0) {
                        const student = rows[0];
                        return {
                            id: student.student_id, // Map student_id to id
                            role: "student",
                            email: student.email,
                            name: `${student.first_name} ${student.last_name}`,
                            college_id: student.college_id
                        };
                    }
                } catch (err) {
                    console.error("[Auth] Error querying Students table:", err);
                    // Fallback check?
                    const [rows]: any = await connection.execute(
                        "SELECT student_id, first_name, last_name, email, college_id FROM students WHERE student_id = ?",
                        [userId]
                    );
                    if (rows.length > 0) {
                        const student = rows[0];
                        return {
                            id: student.student_id,
                            role: "student",
                            email: student.email,
                            name: `${student.first_name} ${student.last_name}`,
                            college_id: student.college_id
                        };
                    }
                }

                console.log(`[Auth] Student not found for ID: ${userId}`);
            }

            return null;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Auth helper error:", error);
        return null;
    }
}
