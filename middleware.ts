import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const key = new TextEncoder().encode(JWT_SECRET);

type UserType = 'student' | 'professional' | 'college' | 'dept_tpo' | null;

async function verifyAuth(token: string | undefined): Promise<{ id: number; role: UserType } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return { id: payload.id as number, role: payload.role as UserType };
  } catch {
    return null;
  }
}

function getRedirectUrl(userType: UserType): string {
  switch (userType) {
    case 'student': return '/dashboard';
    case 'professional': return '/professional-dashboard';
    case 'college':
    case 'dept_tpo': return '/admin';
    default: return '/';
  }
}

export async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;

    if (
      path.startsWith('/_next') ||
      path.startsWith('/favicon') ||
      path.startsWith('/public') ||
      path.includes('.')
    ) {
      return NextResponse.next();
    }

    const publicPaths = ['/', '/login', '/register', '/register/student', '/college-login', '/professional-login', '/register-other', '/forgot-password', '/reset-password', '/privacy', '/terms', '/auth/accept-invite', '/tpo-login'];
    const studentDashboardPaths = ['/dashboard'];
    const professionalDashboardPaths = ['/professional-dashboard'];
    const collegeDashboardPaths = ['/admin'];

    const isPublicPath = publicPaths.includes(path) || publicPaths.some(p => path.startsWith(p + '/'));
    const isStudentDashboardPath = studentDashboardPaths.some(p => path.startsWith(p));
    const isProfessionalDashboardPath = professionalDashboardPaths.some(p => path.startsWith(p));
    const isCollegeDashboardPath = collegeDashboardPaths.some(p => path.startsWith(p));
    const isApiPath = path.startsWith('/api/');

    const token = request.cookies.get('auth_session')?.value;
    const session = await verifyAuth(token);
    const currentUserType = session?.role || null;

    const clearCookiesResponse = (redirectUrl: string) => {
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));
      response.cookies.delete('auth_session');
      response.cookies.delete('studentData');
      response.cookies.delete('professionalData');
      response.cookies.delete('collegeData');
      return response;
    };

    if (isApiPath) {
      if (
        path.startsWith('/api/auth/validate-token') ||
        path.startsWith('/api/auth/login') ||
        path.startsWith('/api/auth/register') ||
        path.startsWith('/api/auth/accept-invite') ||
        path.startsWith('/api/auth/login-tpo') ||
        path.startsWith('/api/professionals/login') ||
        path.startsWith('/api/professionals/register') ||
        path.startsWith('/api/auth/forgot-password') ||
        path.startsWith('/api/auth/reset-password') ||
        path.startsWith('/api/auth/erp-lookup') ||
        path.startsWith('/api/auth/erp-verify-otp') ||
        path.startsWith('/api/admin/erp/status') ||
        path.startsWith('/api/contact') ||
        path.startsWith('/api/career-tracks/init-db') ||
        path.startsWith('/api/jobs/refresh') // cron endpoint — verified by CRON_SECRET header
      ) {
        return NextResponse.next();
      }

      if (path.startsWith('/api/admin') || path.startsWith('/api/college') || path === '/api/student/list') {
        if (currentUserType !== 'college' && currentUserType !== 'dept_tpo') {
          return new NextResponse(JSON.stringify({ error: 'Unauthorized - College/TPO access required' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      if (path.startsWith('/api/professionals') && !path.includes('/login') && !path.includes('/register')) {
        if (currentUserType !== 'professional' && currentUserType !== 'student') {
          return new NextResponse(JSON.stringify({ error: 'Unauthorized - Professional access required' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      if (path.startsWith('/api/student') && !path.startsWith('/api/student/list')) {
        if (currentUserType !== 'student') {
          return new NextResponse(JSON.stringify({ error: 'Unauthorized - Student access required' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      if (path.startsWith('/api/settings')) {
        if (currentUserType !== 'student' && currentUserType !== 'professional') {
          return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      return NextResponse.next();
    }

    if (isStudentDashboardPath) {
      if (currentUserType === 'professional') return NextResponse.redirect(new URL('/professional-dashboard', request.url));
      if (currentUserType === 'college') return NextResponse.redirect(new URL('/admin', request.url));
      if (currentUserType !== 'student') return clearCookiesResponse('/login?redirect=' + encodeURIComponent(path));
    }

    if (isProfessionalDashboardPath) {
      if (currentUserType === 'student') return NextResponse.redirect(new URL('/dashboard', request.url));
      if (currentUserType === 'college') return NextResponse.redirect(new URL('/admin', request.url));
      if (currentUserType !== 'professional') return clearCookiesResponse('/professional-login?redirect=' + encodeURIComponent(path));
    }

    if (isCollegeDashboardPath) {
      if (currentUserType === 'student') return NextResponse.redirect(new URL('/dashboard', request.url));
      if (currentUserType === 'professional') return NextResponse.redirect(new URL('/professional-dashboard', request.url));
      if (currentUserType !== 'college' && currentUserType !== 'dept_tpo') {
        return NextResponse.redirect(new URL('/college-login', request.url));
      }
    }

    if (isPublicPath && !path.startsWith('/api/')) {
      const authPages = ['/login', '/register', '/college-login', '/professional-login'];
      const isAuthPage = authPages.some(p => path === p || path.startsWith(p + '/'));
      if (isAuthPage && currentUserType) {
        return NextResponse.redirect(new URL(getRedirectUrl(currentUserType), request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_session');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}