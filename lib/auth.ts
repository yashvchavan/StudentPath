import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthUser {
    id: number | string; // Allow string ID for student_id
    role: "student" | "professional" | "college" | "dept_tpo";
    email: string;
    name: string;
    college_id?: number;
    department_id?: number; // For dept_tpo users
    permissions?: string[]; // TPO permissions array
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
            } else if (userRole === "dept_tpo") {
                // Dept TPO - fetch from tpo_users table
                const [rows]: any = await connection.execute(
                    `SELECT tu.*, c.logo_url
                     FROM tpo_users tu
                     LEFT JOIN colleges c ON tu.college_id = c.id
                     WHERE tu.id = ? AND tu.is_active = TRUE`,
                    [userId]
                );
                if (rows.length > 0) {
                    const tpoUser = rows[0];
                    // Parse permissions from JSON
                    let permissions: string[] = [];
                    if (tpoUser.permissions) {
                        if (Array.isArray(tpoUser.permissions)) {
                            permissions = tpoUser.permissions;
                        } else if (typeof tpoUser.permissions === 'string') {
                            try {
                                permissions = JSON.parse(tpoUser.permissions);
                            } catch { /* ignore parse error */ }
                        }
                    }
                    return {
                        id: tpoUser.id,
                        role: "dept_tpo",
                        email: tpoUser.email,
                        name: tpoUser.name,
                        college_id: tpoUser.college_id,
                        department_id: tpoUser.department_id,
                        permissions,
                        logo_url: tpoUser.logo_url,
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
            } else if (userRole === "professional") {
                const [rows]: any = await connection.execute(
                    "SELECT id, first_name, last_name, email FROM professionals WHERE id = ?",
                    [userId]
                );
                if (rows.length > 0) {
                    const prof = rows[0];
                    return {
                        id: prof.id,
                        role: "professional",
                        email: prof.email,
                        name: `${prof.first_name} ${prof.last_name}`
                    };
                }
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
