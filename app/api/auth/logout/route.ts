import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear all auth cookies
  response.cookies.delete('auth_session');
  // Clear legacy cookies for cleanup
  response.cookies.delete('studentData');
  response.cookies.delete('professionalData');
  response.cookies.delete('collegeData');
  response.cookies.delete('authToken');

  return response;
}
