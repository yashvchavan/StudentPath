import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface CollegeRow extends RowDataPacket {
  id: number;
  college_name: string;
  email: string;
  college_token: string;
  is_active: boolean;
  created_at: Date;
}

interface StudentCountRow extends RowDataPacket {
  total: number;
  active: number;
}

interface StudentRegistrationRow extends RowDataPacket {
  student_name: string;
  email: string;
  created_at: Date;
}

export async function GET(request: NextRequest) {
  console.log('🔍 College Data API Called');
  let connection;

  try {
    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get('collegeId');

    if (!collegeId) {
      console.log('❌ No college ID provided');
      return NextResponse.json(
        { error: 'College ID is required' },
        { status: 400 }
      );
    }

    console.log('📊 Fetching data for college ID:', collegeId);

    connection = await pool.getConnection();
    
    
    
    
    // Get college basic info (using your actual table structure)
    const [collegeResult] = await connection.execute<CollegeRow[]>(
      `SELECT id, college_name, email, college_token, is_active, created_at 
       FROM colleges 
       WHERE id = ?`,
      [collegeId]
    );

    if (!collegeResult || collegeResult.length === 0) {
      console.log('❌ College not found');
      connection.release();
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    const college = collegeResult[0];
    console.log('✅ College found:', college.college_name);

    // Initialize default values
    let totalStudents = 0;
    let activeStudents = 0;
    let recentRegistrations: any[] = [];

    try {
      // Try to get student counts (handle case where students table might not exist)
      const [studentCountResult] = await connection.execute<StudentCountRow[]>(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active
         FROM students 
         WHERE college_id = ?`,
        [collegeId]
      );

      if (studentCountResult && studentCountResult.length > 0) {
        totalStudents = parseInt(studentCountResult[0].total.toString()) || 0;
        activeStudents = parseInt(studentCountResult[0].active?.toString() || '0') || 0;
      }

      console.log('📈 Student counts - Total:', totalStudents, 'Active:', activeStudents);

      // Get recent registrations
      const [recentResult] = await connection.execute<StudentRegistrationRow[]>(
        `SELECT CONCAT(first_name, ' ', last_name) as student_name, email, created_at 
FROM Students 
WHERE college = ? 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [collegeId]
      );

      recentRegistrations = recentResult.map(reg => ({
        name: reg.student_name,
        program: 'Student', // Default since we don't have program field yet
        email: reg.email,
        date: new Date(reg.created_at).toISOString().split('T')[0]
      }));

      console.log('📝 Recent registrations found:', recentRegistrations.length);

    } catch (studentError) {
      console.warn('⚠️ Students table query failed (table might not exist):', studentError);
      // Continue with default values (0 students, empty array)
    }

    // Mock programs data (can be enhanced later with actual programs table)
    const programs = [
      'Computer Science',
      'Engineering', 
      'Business Administration',
      'Arts & Sciences'
    ];

    // Calculate token usage
    const tokenUsage = {
      usageCount: totalStudents,
      maxUsage: 1000,
      remaining: Math.max(0, 1000 - totalStudents),
      isActive: college.is_active
    };

    const responseData = {
      success: true,
      college: {
        id: college.id,
        name: college.college_name,
        email: college.email,
        token: college.college_token,
        isActive: college.is_active,
        createdAt: college.created_at
      },
      totalStudents,
      activeStudents,
      programs,
      recentRegistrations,
      tokenUsage
    };

    console.log('✅ College data response prepared');
    connection.release();

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ College data API error:', error);
    
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('❌ Failed to release connection:', releaseError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch college data',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          undefined
      },
      { status: 500 }
    );
  }
}
