import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

interface CollegeRow extends RowDataPacket {
    id: number
    college_name: string
    email: string
    phone: string
    country: string
    state: string
    city: string
    address: string
    website: string
    established_year: number
    college_type: string
    accreditation: string
    contact_person: string
    contact_person_email: string
    contact_person_phone: string
    total_students: number
    logo_url: string | null
}

// GET - Fetch college settings
export async function GET(req: NextRequest) {
    try {
        const cookieStore = req.cookies
        const collegeData = cookieStore.get('collegeData')?.value

        if (!collegeData) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 })
        }

        const college = JSON.parse(collegeData)
        const collegeId = college.id

        const [rows] = await pool.query<CollegeRow[]>(
            `SELECT 
        college_name, email, phone, country, state, city, address, website,
        established_year, college_type, accreditation, contact_person,
        contact_person_email, contact_person_phone, total_students, logo_url
      FROM colleges 
      WHERE id = ?`,
            [collegeId]
        )

        if (rows.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'College not found'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            settings: rows[0]
        })

    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 })
    }
}

// PUT - Update college settings
export async function PUT(req: NextRequest) {
    try {
        const cookieStore = req.cookies
        const collegeData = cookieStore.get('collegeData')?.value

        if (!collegeData) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 })
        }

        const college = JSON.parse(collegeData)
        const collegeId = college.id

        const body = await req.json()
        const {
            college_name,
            email,
            phone,
            country,
            state,
            city,
            address,
            website,
            established_year,
            college_type,
            accreditation,
            contact_person,
            contact_person_email,
            contact_person_phone,
            total_students
        } = body

        // Validate required fields
        if (!college_name || !email || !country || !city) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 })
        }

        await pool.query(
            `UPDATE colleges SET 
        college_name = ?,
        email = ?,
        phone = ?,
        country = ?,
        state = ?,
        city = ?,
        address = ?,
        website = ?,
        established_year = ?,
        college_type = ?,
        accreditation = ?,
        contact_person = ?,
        contact_person_email = ?,
        contact_person_phone = ?,
        total_students = ?
      WHERE id = ?`,
            [
                college_name,
                email,
                phone || null,
                country,
                state || null,
                city,
                address || null,
                website || null,
                established_year || null,
                college_type || null,
                accreditation || null,
                contact_person || null,
                contact_person_email || null,
                contact_person_phone || null,
                total_students || null,
                collegeId
            ]
        )

        // Update the cookie with new data
        const updatedCollege = {
            ...college,
            name: college_name,
            email: email
        }

        const response = NextResponse.json({
            success: true,
            message: 'Settings updated successfully'
        })

        response.cookies.set('collegeData', JSON.stringify(updatedCollege), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        })

        return response

    } catch (error) {
        console.error('Error updating settings:', error)
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 })
    }
}
