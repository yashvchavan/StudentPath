import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Read the server-side cookie (httpOnly)
    const collegeData = request.cookies.get('collegeData')?.value

    if (!collegeData) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    let parsed = null
    try {
      parsed = JSON.parse(collegeData)
    } catch (err) {
      console.error('Failed to parse collegeData cookie in /api/auth/me', err)
      return NextResponse.json({ success: false, error: 'Invalid cookie' }, { status: 400 })
    }

    // Return minimal safe profile info
    const safeProfile = {
      id: parsed.id,
      name: parsed.name || parsed.college_name || null,
      email: parsed.email || null,
      token: parsed.token || null,
      type: parsed.type || null,
    }

    return NextResponse.json({ success: true, college: safeProfile })
  } catch (error) {
    console.error('/api/auth/me error', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
