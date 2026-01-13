import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(req: NextRequest) {
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

        const formData = await req.formData()
        const file = formData.get('logo') as File

        if (!file) {
            return NextResponse.json({
                success: false,
                error: 'No file uploaded'
            }, { status: 400 })
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid file type. Only JPG, PNG, SVG, and WebP are allowed'
            }, { status: 400 })
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({
                success: false,
                error: 'File size exceeds 2MB limit'
            }, { status: 400 })
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(base64Image, {
            folder: 'college-logos',
            public_id: `college-${collegeId}-${Date.now()}`,
            transformation: [
                { width: 200, height: 200, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        })

        const logoUrl = uploadResult.secure_url

        // Update database with logo URL
        await pool.query(
            'UPDATE colleges SET logo_url = ? WHERE id = ?',
            [logoUrl, collegeId]
        )

        // Update the cookie with new logo URL
        const updatedCollege = {
            ...college,
            logo_url: logoUrl
        }

        const response = NextResponse.json({
            success: true,
            logoUrl: logoUrl,
            message: 'Logo uploaded successfully'
        })

        response.cookies.set('collegeData', JSON.stringify(updatedCollege), {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        })

        return response

    } catch (error) {
        console.error('Error uploading logo:', error)
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 })
    }
}
