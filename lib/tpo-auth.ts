import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// TPO Permission constants
export const TPO_PERMISSIONS = {
  VIEW_STUDENTS: 'view_students',
  EXPORT_DATA: 'export_data',
  MANAGE_PLACEMENTS: 'manage_placements',
  MANAGE_INTERNSHIPS: 'manage_internships',
  SEND_NOTIFICATIONS: 'send_notifications',
  VIEW_ANALYTICS: 'view_analytics',
} as const;

export type TpoPermission = typeof TPO_PERMISSIONS[keyof typeof TPO_PERMISSIONS];

// Central TPO has all permissions by default
export const CENTRAL_TPO_PERMISSIONS: TpoPermission[] = Object.values(TPO_PERMISSIONS);

// Default permissions for new dept_tpo users
export const DEFAULT_DEPT_TPO_PERMISSIONS: TpoPermission[] = [
  TPO_PERMISSIONS.VIEW_STUDENTS,
  TPO_PERMISSIONS.MANAGE_PLACEMENTS,
  TPO_PERMISSIONS.MANAGE_INTERNSHIPS,
  TPO_PERMISSIONS.VIEW_ANALYTICS,
];

// TPO Session interface with role flags
export interface TpoSession {
  id: number | string;
  role: "college" | "dept_tpo";
  email: string;
  name: string;
  college_id: number;
  department_id?: number;
  department_name?: string;
  permissions: TpoPermission[];
  logo_url?: string;
  // Role flags
  isCentralTPO: boolean;
  isDeptTPO: boolean;
  // Permission flags
  canExportData: boolean;
  canManageTPO: boolean;
  canManageAllDepts: boolean;
  canViewStudents: boolean;
  canManagePlacements: boolean;
  canManageInternships: boolean;
  canSendNotifications: boolean;
  canViewAnalytics: boolean;
}

/**
 * Get TPO session from JWT token
 * Works for both Central TPO (college role) and Dept TPO (dept_tpo role)
 */
export async function getTpoSession(): Promise<TpoSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_session")?.value;

    if (!token) {
      return null;
    }

    let decoded: { id: number; role: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    } catch {
      return null;
    }

    const userId = decoded.id;
    const userRole = decoded.role;

    // Only allow college or dept_tpo roles
    if (userRole !== "college" && userRole !== "dept_tpo") {
      return null;
    }

    const connection = await pool.getConnection();

    try {
      if (userRole === "college") {
        // Central TPO - fetch from colleges table
        const [rows]: any = await connection.execute(
          "SELECT id, college_name, email, logo_url FROM colleges WHERE id = ?",
          [userId]
        );

        if (rows.length === 0) {
          return null;
        }

        const college = rows[0];
        return {
          id: college.id,
          role: "college",
          email: college.email,
          name: college.college_name,
          college_id: college.id,
          permissions: CENTRAL_TPO_PERMISSIONS,
          logo_url: college.logo_url,
          // Role flags
          isCentralTPO: true,
          isDeptTPO: false,
          // Permission flags - Central TPO has all
          canExportData: true,
          canManageTPO: true,
          canManageAllDepts: true,
          canViewStudents: true,
          canManagePlacements: true,
          canManageInternships: true,
          canSendNotifications: true,
          canViewAnalytics: true,
        };
      } else {
        // Dept TPO - fetch from tpo_users table
        const [rows]: any = await connection.execute(
          `SELECT tu.*, d.name as department_name, c.logo_url
           FROM tpo_users tu
           LEFT JOIN departments d ON tu.department_id = d.id
           LEFT JOIN colleges c ON tu.college_id = c.id
           WHERE tu.id = ? AND tu.is_active = TRUE`,
          [userId]
        );

        if (rows.length === 0) {
          return null;
        }

        const tpoUser = rows[0];
        const permissions = parsePermissions(tpoUser.permissions);

        return {
          id: tpoUser.id,
          role: "dept_tpo",
          email: tpoUser.email,
          name: tpoUser.name,
          college_id: tpoUser.college_id,
          department_id: tpoUser.department_id,
          department_name: tpoUser.department_name,
          permissions,
          logo_url: tpoUser.logo_url,
          // Role flags
          isCentralTPO: false,
          isDeptTPO: true,
          // Permission flags
          canExportData: permissions.includes(TPO_PERMISSIONS.EXPORT_DATA),
          canManageTPO: false, // Only Central TPO can manage TPO users
          canManageAllDepts: false, // Dept TPO is scoped to their department
          canViewStudents: permissions.includes(TPO_PERMISSIONS.VIEW_STUDENTS),
          canManagePlacements: permissions.includes(TPO_PERMISSIONS.MANAGE_PLACEMENTS),
          canManageInternships: permissions.includes(TPO_PERMISSIONS.MANAGE_INTERNSHIPS),
          canSendNotifications: permissions.includes(TPO_PERMISSIONS.SEND_NOTIFICATIONS),
          canViewAnalytics: permissions.includes(TPO_PERMISSIONS.VIEW_ANALYTICS),
        };
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[getTpoSession] Error:", error);
    return null;
  }
}

/**
 * Parse permissions from JSON or string array
 */
function parsePermissions(permissions: any): TpoPermission[] {
  if (!permissions) return [];
  if (Array.isArray(permissions)) return permissions;
  if (typeof permissions === 'string') {
    try {
      return JSON.parse(permissions);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(session: TpoSession | null, permission: TpoPermission): boolean {
  if (!session) return false;
  if (session.isCentralTPO) return true; // Central TPO has all permissions
  return session.permissions.includes(permission);
}

/**
 * Build department scope WHERE clause for SQL queries
 * For Central TPO: returns empty string (no scoping)
 * For Dept TPO: returns AND clause to filter by their department
 */
export function getDepartmentScopeClause(
  session: TpoSession,
  tableAlias: string = 's',
  departmentColumn: string = 'department_id'
): { clause: string; params: any[] } {
  if (session.isCentralTPO) {
    return { clause: '', params: [] };
  }

  // Dept TPO - scope to their department
  return {
    clause: ` AND ${tableAlias}.${departmentColumn} = ?`,
    params: [session.department_id],
  };
}

/**
 * Build department filter for JSON department_ids column
 * Used for placements/internships with JSON array of target departments
 */
export function getDepartmentIdsFilterClause(
  session: TpoSession,
  tableAlias: string = 'p',
  columnName: string = 'department_ids'
): { clause: string; params: any[] } {
  if (session.isCentralTPO) {
    return { clause: '', params: [] };
  }

  // Dept TPO - filter by their department ID in JSON array
  // Use JSON_CONTAINS to check if department_id is in the array
  return {
    clause: ` AND (${tableAlias}.${columnName} IS NULL OR JSON_CONTAINS(${tableAlias}.${columnName}, CAST(? AS JSON)))`,
    params: [session.department_id],
  };
}

/**
 * Validate that Dept TPO can only target their own department
 * Returns the department_ids array to use
 */
export function validateDepartmentTargets(
  session: TpoSession,
  requestedDepartmentIds: number[] | null
): number[] | null {
  if (session.isCentralTPO) {
    // Central TPO can target any departments or all (null)
    return requestedDepartmentIds;
  }

  // Dept TPO must target their own department only
  if (!session.department_id) {
    throw new Error("Dept TPO must be assigned to a department");
  }

  return [session.department_id];
}

/**
 * Generate a secure random token for invites
 */
export function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Check if current user is authorized for admin panel access
 */
export async function requireTpoAuth(): Promise<TpoSession> {
  const session = await getTpoSession();
  if (!session) {
    throw new Error("Unauthorized - TPO access required");
  }
  return session;
}

/**
 * Check if current user is Central TPO
 */
export async function requireCentralTpo(): Promise<TpoSession> {
  const session = await getTpoSession();
  if (!session || !session.isCentralTPO) {
    throw new Error("Unauthorized - Central TPO access required");
  }
  return session;
}
