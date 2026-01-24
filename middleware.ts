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

// User types for RBAC
type UserType = 'student' | 'professional' | 'college' | null;

interface AuthData {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  token?: string;
  userType?: UserType;
  type?: string;
  timestamp?: number;
  student_id?: string | number;
  college_id?: string | number;
  id?: number;
}

// Get the user type from cookie data
function getUserType(studentData: AuthData | null, collegeData: AuthData | null): UserType {
  if (collegeData && validateCollegeData(JSON.stringify(collegeData))) {
    return 'college';
  }

  if (studentData) {
    // Check for explicit userType field
    if (studentData.userType === 'professional') {
      return 'professional';
    }
    if (studentData.userType === 'student' || studentData.student_id) {
      return 'student';
    }
    // Legacy support: if isAdmin is false and no student_id, might be professional
    if (studentData.isAuthenticated && !studentData.isAdmin && !studentData.student_id && studentData.id) {
      return 'professional';
    }
  }

  return null;
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

    // Must have student_id for students
    if (!parsed.student_id) return false;

    // Verify student-specific data
    if (parsed.isAdmin) return false; // Students shouldn't have admin flag

    // Check userType if present
    if (parsed.userType && parsed.userType !== 'student') return false;

    return true;
  } catch (error) {
    console.error('Error validating student data:', error);
    return false;
  }
}

// Helper function to validate professional data
function validateProfessionalData(data: string | undefined): boolean {
  if (!data) return false;
  try {
    const parsed = safeJsonParse(decodeURIComponent(data)) as AuthData;

    if (!parsed) return false;

    // Check required fields
    if (!parsed.isAuthenticated || !parsed.timestamp) return false;

    // Check if the authentication is not expired (24 hours)
    const isExpired = Date.now() - (parsed.timestamp || 0) > 24 * 60 * 60 * 1000;
    if (isExpired) {
      console.log('Professional authentication expired');
      return false;
    }

    // Check userType - must be professional
    if (parsed.userType === 'professional') return true;

    // Legacy support: professional has id but no student_id
    if (parsed.id && !parsed.student_id && !parsed.isAdmin) return true;

    return false;
  } catch (error) {
    console.error('Error validating professional data:', error);
    return false;
  }
}

// Helper function to validate college data
function validateCollegeData(data: string | undefined): boolean {
  if (!data) return false;
  try {
    const parsed = safeJsonParse(decodeURIComponent(data)) as AuthData;

    if (!parsed) return false;

    // Check required fields for college access
    // College data should have either token or id
    if (!parsed.token && !parsed.id) return false;
    if (parsed.type && parsed.type !== 'college') return false;

    // If timestamp exists, check expiration
    if (parsed.timestamp) {
      const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        console.log('College authentication expired');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating college data:', error);
    return false;
  }
}

// Get redirect URL based on user type
function getRedirectUrl(userType: UserType): string {
  switch (userType) {
    case 'student':
      return '/dashboard';
    case 'professional':
      return '/professional-dashboard';
    case 'college':
      return '/admin';
    default:
      return '/';
  }
}

// Get login URL based on user type
function getLoginUrl(userType: UserType): string {
  switch (userType) {
    case 'student':
      return '/login';
    case 'professional':
      return '/professional-login';
    case 'college':
      return '/college-login';
    default:
      return '/login';
  }
}

export function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;

    // Skip middleware for static files and API routes that don't need auth
    if (
      path.startsWith('/_next') ||
      path.startsWith('/favicon') ||
      path.startsWith('/public') ||
      path.includes('.')
    ) {
      return NextResponse.next();
    }

    // Define path types with role-based categorization
    const publicPaths = ['/', '/login', '/register', '/register/student', '/college-login', '/professional-login', '/register-other', '/forgot-password', '/reset-password', '/privacy', '/terms'];
    const studentDashboardPaths = ['/dashboard'];
    const professionalDashboardPaths = ['/professional-dashboard'];
    const collegeDashboardPaths = ['/admin'];

    const isPublicPath = publicPaths.includes(path) || publicPaths.some(p => path.startsWith(p + '/'));
    const isStudentDashboardPath = studentDashboardPaths.some(p => path.startsWith(p));
    const isProfessionalDashboardPath = professionalDashboardPaths.some(p => path.startsWith(p));
    const isCollegeDashboardPath = collegeDashboardPaths.some(p => path.startsWith(p));
    const isApiPath = path.startsWith('/api/');

    // Get cookies
    const studentDataRaw = request.cookies.get('studentData')?.value;
    const collegeDataRaw = request.cookies.get('collegeData')?.value;

    // Parse cookie data - decode URIComponent for consistency
    const studentData = studentDataRaw ? safeJsonParse(decodeURIComponent(studentDataRaw)) : null;
    const collegeData = collegeDataRaw ? safeJsonParse(decodeURIComponent(collegeDataRaw)) : null;

    console.log('Path:', path);
    console.log('Has studentData:', !!studentData);
    console.log('Has collegeData:', !!collegeData);

    // Determine current user type
    const isValidStudent = validateStudentData(studentDataRaw);
    const isValidProfessional = validateProfessionalData(studentDataRaw);
    const isValidCollege = validateCollegeData(collegeDataRaw);

    let currentUserType: UserType = null;
    if (isValidCollege) {
      currentUserType = 'college';
    } else if (isValidProfessional) {
      currentUserType = 'professional';
    } else if (isValidStudent) {
      currentUserType = 'student';
    }

    console.log('Current user type:', currentUserType);

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
      // Allow public access to certain endpoints
      if (
        path.startsWith('/api/auth/validate-token') ||
        path.startsWith('/api/auth/login') ||
        path.startsWith('/api/auth/register') ||
        path.startsWith('/api/professionals/login') ||
        path.startsWith('/api/professionals/register') ||
        path.startsWith('/api/auth/forgot-password') ||
        path.startsWith('/api/auth/reset-password') ||
        path.startsWith('/api/contact')
      ) {
        return NextResponse.next();
      }

      // Protect admin/college endpoints
      if (path.startsWith('/api/admin') ||
        path.startsWith('/api/college') ||
        path === '/api/student/list') {
        console.log('Validating college access for:', path);
        if (currentUserType !== 'college') {
          console.log('College validation failed');
          return new NextResponse(JSON.stringify({ error: 'Unauthorized - College access required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        console.log('College validation passed');
      }

      // Protect professional endpoints
      if (path.startsWith('/api/professionals') && !path.includes('/login') && !path.includes('/register')) {
        console.log('Validating professional access for:', path);
        // Allow both professionals and students to access some professional APIs (like profile viewing)
        if (currentUserType !== 'professional' && currentUserType !== 'student') {
          console.log('Professional validation failed');
          return new NextResponse(JSON.stringify({ error: 'Unauthorized - Professional access required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        console.log('Professional validation passed');
      }

      // Protect student profile endpoints (but NOT student/list)
      if (path.startsWith('/api/student') && !path.startsWith('/api/student/list')) {
        console.log('Validating student access for:', path);
        if (currentUserType !== 'student') {
          console.log('Student validation failed');
          return new NextResponse(JSON.stringify({ error: 'Unauthorized - Student access required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        console.log('Student validation passed');
      }

      // Protect settings endpoints - allow students and professionals
      if (path.startsWith('/api/settings')) {
        console.log('Validating access for settings:', path);
        if (currentUserType !== 'student' && currentUserType !== 'professional') {
          console.log('Settings validation failed');
          return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        console.log('Settings validation passed');
      }

      return NextResponse.next();
    }

    // Handle student dashboard access
    if (isStudentDashboardPath) {
      console.log('Student dashboard access - user type:', currentUserType);

      if (currentUserType === 'professional') {
        // Professional trying to access student dashboard - redirect to professional dashboard
        console.log('Professional trying to access student dashboard, redirecting');
        return NextResponse.redirect(new URL('/professional-dashboard', request.url));
      }

      if (currentUserType === 'college') {
        // College admin trying to access student dashboard - redirect to admin
        console.log('College admin trying to access student dashboard, redirecting');
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      if (currentUserType !== 'student') {
        return clearCookiesResponse('/login?redirect=' + encodeURIComponent(path));
      }

      // Add token to URL if missing
      try {
        if (!request.nextUrl.searchParams.has('token') &&
          studentData &&
          studentData.token) {
          return NextResponse.redirect(
            new URL(`${path}?token=${studentData.token}`, request.url)
          );
        }
      } catch (error) {
        console.error('Error parsing student data:', error);
      }
    }

    // Handle professional dashboard access
    if (isProfessionalDashboardPath) {
      console.log('Professional dashboard access - user type:', currentUserType);

      if (currentUserType === 'student') {
        // Student trying to access professional dashboard - redirect to student dashboard
        console.log('Student trying to access professional dashboard, redirecting');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (currentUserType === 'college') {
        // College admin trying to access professional dashboard - redirect to admin
        console.log('College admin trying to access professional dashboard, redirecting');
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      if (currentUserType !== 'professional') {
        return clearCookiesResponse('/professional-login?redirect=' + encodeURIComponent(path));
      }
    }

    // Handle college admin routes
    if (isCollegeDashboardPath) {
      console.log('Admin route access - user type:', currentUserType);

      if (currentUserType === 'student') {
        // Student trying to access admin - redirect to student dashboard
        console.log('Student trying to access admin, redirecting');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (currentUserType === 'professional') {
        // Professional trying to access admin - redirect to professional dashboard
        console.log('Professional trying to access admin, redirecting');
        return NextResponse.redirect(new URL('/professional-dashboard', request.url));
      }

      if (currentUserType !== 'college') {
        console.log('No valid college data, redirecting to login');
        return NextResponse.redirect(new URL('/college-login', request.url));
      }

      console.log('Admin access granted');
    }

    // Allow auth pages to load - client-side ActiveSessionBlock handles displaying
    // the "already logged in" message with proper logout/dashboard options
    // instead of silently redirecting users
    if (isPublicPath && !path.startsWith('/api/')) {
      // Log for debugging purposes
      const authPages = ['/login', '/register', '/college-login', '/professional-login', '/register-other'];
      const isAuthPage = authPages.some(p => path === p || path.startsWith(p + '/'));

      if (isAuthPage && currentUserType) {
        console.log(`Authenticated ${currentUserType} accessing ${path} - client-side will handle blocking`);
        // Allow the page to load; ActiveSessionBlock component will show appropriate message
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, clear cookies and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('studentData');
    response.cookies.delete('collegeData');
    return response;
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}