import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper function to safely parse JSON
function safeJsonParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

interface AuthData {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  token?: string;
  type?: string;
  timestamp?: number;
  student_id?: string;
  college_id?: string;
}

// Helper function to validate student data
function validateStudentData(data: string | undefined): boolean {
  if (!data) return false;
  try {
    const parsed = safeJsonParse(decodeURIComponent(data)) as AuthData;
    
    if (!parsed) return false;

    // Check required fields
    if (!parsed.isAuthenticated || !parsed.timestamp) return false;
    
    // Check if the authentication is not expired (24 hours)
    const isExpired = Date.now() - (parsed.timestamp || 0) > 24 * 60 * 60 * 1000;
    if (isExpired) {
      console.log('Student authentication expired');
      return false;
    }

    // Verify student-specific data
    if (parsed.isAdmin) return false; // Students shouldn't have admin flag
    
    return true;
  } catch (error) {
    console.error('Error validating student data:', error);
    return false;
  }
}

// Helper function to validate college data
function validateCollegeData(data: string | undefined): boolean {
  if (!data) return false;
  try {
    const parsed = safeJsonParse(decodeURIComponent(data)) as AuthData;
    console.log('Validating college data:', parsed);
    
    if (!parsed) return false;

    // Check required fields for college access
    if (!parsed.token || parsed.type !== 'college' || !parsed.timestamp) return false;
    
    // Check if the authentication is not expired (24 hours)
    const isExpired = Date.now() - (parsed.timestamp || 0) > 24 * 60 * 60 * 1000;
    if (isExpired) {
      console.log('College authentication expired');
      return false;
    }

    // Verify college-specific data
    if (!parsed.college_id) return false;
    
    return true;
  } catch (error) {
    console.error('Error validating college data:', error);
    return false;
  }
}

export function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    
    // Define path types with more specific categorization
    const publicPaths = ['/login', '/register', '/register/student'];
    const authPaths = ['/dashboard', '/admin'];
    const restrictedPaths = ['/api/admin', '/api/college'];
    
    const isPublicPath = publicPaths.includes(path) || path === '/';
    const isCollegeLoginPath = path === '/college-login';
    const isAdminPath = path.startsWith('/admin') || restrictedPaths.some(p => path.startsWith(p));
    const isDashboardPath = path.startsWith('/dashboard');
    const isApiPath = path.startsWith('/api/');
    
    // Get cookies
    const studentData = request.cookies.get('studentData')?.value;
    const collegeData = request.cookies.get('collegeData')?.value;
    
   

    // Create response for clearing invalid cookies
    const clearCookiesResponse = (redirectUrl: string) => {
      console.log('Clearing cookies and redirecting to:', redirectUrl);
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));
      response.cookies.delete('studentData');
      response.cookies.delete('collegeData');
      return response;
    };

    // API request validation
    if (isApiPath) {
      // Allow public access to validate-token endpoint
      if (path.startsWith('/api/auth/validate-token')) {
        return NextResponse.next();
      }

      // Protect admin/college endpoints
      if (path.startsWith('/api/admin') || path.startsWith('/api/college')) {
        if (!validateCollegeData(collegeData)) {
          return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Protect student endpoints
      if (path.startsWith('/api/student')) {
        if (!validateStudentData(studentData)) {
          return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Handle dashboard access
    if (isDashboardPath) {
      const isValidStudent = validateStudentData(studentData);
      console.log('Dashboard access - student validation:', isValidStudent);
      if (!isValidStudent) {
        return clearCookiesResponse('/login?redirect=' + encodeURIComponent(path));
      }
      
      // If accessing dashboard directly without token, add the token to URL
      try {
        const parsedStudentData = studentData ? JSON.parse(studentData) : null;
        if (!request.nextUrl.searchParams.has('token') && 
            parsedStudentData && 
            parsedStudentData.collegeToken) {
          return NextResponse.redirect(
            new URL(`${path}?token=${parsedStudentData.collegeToken}`, request.url)
          );
        }
      } catch (error) {
        console.error('Error parsing student data:', error);
      }
    }

    // Handle admin access
    // Handle admin routes
  if (path.startsWith('/admin')) {
    // If no college data, redirect to college login
    if (!collegeData) {
      return NextResponse.redirect(new URL('/college-login', request.url));
    }
    
    // Verify college data
    try {
      const college = JSON.parse(collegeData);
      if (!college.token || college.type !== 'college') {
        return NextResponse.redirect(new URL('/college-login', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/college-login', request.url));
    }
  }

    // Prevent authenticated users from accessing public paths
    if (isPublicPath && !path.startsWith('/api/')) {
      const isValidStudent = validateStudentData(studentData);
      const isValidCollege = validateCollegeData(collegeData);
      
      if (isValidStudent) {
        console.log('Authenticated student accessing public path, redirecting to dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      if (isValidCollege) {
        console.log('Authenticated college accessing public path, redirecting to admin');
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }

    // Prevent cross-role access
    if (isCollegeLoginPath && validateCollegeData(collegeData)) {
      console.log('College user attempting to access student login');
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    
    if (path === '/login' && validateCollegeData(collegeData)) {
      console.log('College user attempting to access student login');
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, clear cookies and redirect to login
    return clearCookiesResponse('/login');
  }
}


