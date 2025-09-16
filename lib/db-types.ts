import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// User related types
export interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// College related types
export interface CollegeRow extends RowDataPacket {
  id: number;
  college_name: string;
  college_token: string;
  total_students: number;
  programs: string;
  created_at: Date;
  is_active: boolean;
}

export interface CollegeTokenRow extends RowDataPacket {
  id: number;
  college_id: number;
  usage_count: number;
  max_usage: number;
  is_active: boolean;
  created_at: Date;
}

// Student related types
export interface StudentRow extends RowDataPacket {
  id: number;
  user_id: number;
  college_id: number;
  first_name: string;
  last_name: string;
  email: string;
  program: string;
  enrollment_date: Date;
  is_active: boolean;
  created_at: Date;
}

export interface StudentDataRow extends RowDataPacket {
  student_id: number;
  data_type: string;
  data_value: string;
  created_at: Date;
}

// Generic count result type
export interface CountRow extends RowDataPacket {
  total: number;
}

// Generic success result type
export interface SuccessResult extends ResultSetHeader {
  affectedRows: number;
  insertId: number;
}