import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  let connection;
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_session')?.value

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session'
      }, { status: 401 })
    }

    const professionalId = decoded.id
    const userRole = decoded.role

    if (!professionalId || userRole !== 'professional') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized. Professional access required.'
      }, { status: 403 })
    }

    const body = await req.json()
    const {
      firstName,
      lastName,
      phone,
      company,
      designation,
      linkedin,
      github,
      portfolio,
      skills,
      certifications,
      career_goals,
      preferred_learning_style,
      profile_picture, // Cloudinary URL
    } = body

    // Build update query
    const updates: string[] = []
    const values: any[] = []

    if (firstName !== undefined) {
      updates.push('first_name = ?')
      values.push(firstName)
    }
    if (lastName !== undefined) {
      updates.push('last_name = ?')
      values.push(lastName)
    }
    if (phone !== undefined) {
      updates.push('phone = ?')
      values.push(phone)
    }
    if (company !== undefined) {
      updates.push('company = ?')
      values.push(company)
    }
    if (designation !== undefined) {
      updates.push('designation = ?')
      values.push(designation)
    }
    if (linkedin !== undefined) {
      updates.push('linkedin = ?')
      values.push(linkedin)
    }
    if (github !== undefined) {
      updates.push('github = ?')
      values.push(github)
    }
    if (portfolio !== undefined) {
      updates.push('portfolio = ?')
      values.push(portfolio)
    }
    if (skills !== undefined) {
      updates.push('skills = ?')
      values.push(JSON.stringify(skills))
    }
    if (certifications !== undefined) {
      updates.push('certifications = ?')
      values.push(certifications)
    }
    if (career_goals !== undefined) {
      updates.push('career_goals = ?')
      values.push(career_goals)
    }
    if (preferred_learning_style !== undefined) {
      updates.push('preferred_learning_style = ?')
      values.push(preferred_learning_style)
    }
    if (profile_picture !== undefined) {
      // Store Cloudinary URL in profile_picture_base64 field
      updates.push('profile_picture_base64 = ?')
      values.push(profile_picture)
      // Set mime to indicate it's a URL
      updates.push('profile_picture_mime = ?')
      values.push('image/url')
    }

    // Always update the updated_at timestamp
    updates.push('updated_at = NOW()')

    if (updates.length === 1) { // Only updated_at
      return NextResponse.json({
        success: false,
        error: 'No fields to update'
      }, { status: 400 })
    }

    // Add professional id values (table uses 'id', not 'professional_id')
    values.push(professionalId)

    const query = `
      UPDATE professionals 
      SET ${updates.join(', ')}
      WHERE id = ?
    `

    console.log('🔄 Updating professional profile:', { professionalId, updates: updates.length - 1 })

    connection = await pool.getConnection()
    await connection.execute(query, values)

    console.log('✅ Professional profile updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Error updating professional profile:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update profile',
      details: error.message
    }, { status: 500 })
  } finally {
    if (connection) connection.release();
  }
} 