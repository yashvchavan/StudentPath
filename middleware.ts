import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const key = new TextEncoder().encode(JWT_SECRET);

// User types for RBAC
type UserType = 'student' | 'professional' | 'college' | null;

// Helper to verify session
async function verifyAuth(token: string | undefined): Promise<{ id: number; role: UserType } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return {
      id: payload.id as number,
      role: payload.role as UserType
    };
  } catch (e) {
    return null;
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

export async function middleware(request: NextRequest) {
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

    // Get auth token
    const token = request.cookies.get('auth_session')?.value;
    const session = await verifyAuth(token);
    const currentUserType = session?.role || null;

    console.log('Path:', path);
    console.log('Current user type:', currentUserType);

    // Create response for clearing invalid cookies
    const clearCookiesResponse = (redirectUrl: string) => {
      console.log('Clearing cookies and redirecting to:', redirectUrl);
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));
      response.cookies.delete('auth_session');
      // Legacy cleanup
      response.cookies.delete('studentData');
      response.cookies.delete('professionalData');
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
        // Allow both professionals and students to access some professional APIs
        if (currentUserType !== 'professional' && currentUserType !== 'student') {
          console.log('Professional validation failed');
          return new NextResponse(JSON.stringify({ error: 'Unauthorized - Professional access required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        console.log('Professional validation passed');
      }

      // Protect student profile endpoints (but NOT student/list which is for colleges)
      if (path.startsWith('/api/student') && !path.startsWith('/api/student/list')) {
        console.log('Validating student access for:', path);
        if (currentUserType !== 'student') {
          // Check if it's 'list' which is handled above, but here we cover others
          // Is it possible a college accesses other student endpoints?
          // Usually student endpoints are for the student themselves.
          console.log('Student validation failed');
          return new NextResponse(JSON.stringify({ error: 'Unauthorized - Student access required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        console.log('Student validation passed');
      }

      // Protect settings endpoints - allow all authorized roles? 
      // Original logic allowed student & professional. Let's verify.
      if (path.startsWith('/api/settings')) {
        console.log('Validating access for settings:', path);
        if (currentUserType !== 'student' && currentUserType !== 'professional') {
          // What about college? Colleges have /api/admin/settings usually. 
          // If /api/settings is shared, we should allow college too?
          // Checking original code: originally allowed student and professional.
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
        return NextResponse.redirect(new URL('/professional-dashboard', request.url));
      }

      if (currentUserType === 'college') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      if (currentUserType !== 'student') {
        return clearCookiesResponse('/login?redirect=' + encodeURIComponent(path));
      }
    }

    // Handle professional dashboard access
    if (isProfessionalDashboardPath) {
      console.log('Professional dashboard access - user type:', currentUserType);

      if (currentUserType === 'student') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (currentUserType === 'college') {
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
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (currentUserType === 'professional') {
        return NextResponse.redirect(new URL('/professional-dashboard', request.url));
      }

      if (currentUserType !== 'college') {
        console.log('No valid college data, redirecting to login');
        return NextResponse.redirect(new URL('/college-login', request.url));
      }

      console.log('Admin access granted');
    }

    // Public auth pages - redirect if already logged in
    if (isPublicPath && !path.startsWith('/api/')) {
      const authPages = ['/login', '/register', '/college-login', '/professional-login'];
      const isAuthPage = authPages.some(p => path === p || path.startsWith(p + '/'));

      if (isAuthPage && currentUserType) {
        console.log(`Authenticated ${currentUserType} accessing ${path} - redirecting to dashboard`);
        return NextResponse.redirect(new URL(getRedirectUrl(currentUserType), request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, clear cookies and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_session');
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