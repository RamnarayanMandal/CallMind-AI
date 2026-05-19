import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { userRole } from './types/admin.types';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const role = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  // ── Helper: determine the correct dashboard by role ──────────
  const getDashboard = () => {
    if (role === userRole.ADMIN || role === userRole.SUPER_ADMIN) {
      return '/admin';
    }
    return '/dashboard';
  };

  // ── 1. Public auth pages: if already logged in → go to dashboard ──
  //    Covers /login, /register, /forgot-password, /reset-password,
  //    /verify-otp, /auth-success, and legacy /auth/* paths
  const publicAuthPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-otp',
    '/auth-success',
  ];
  const isPublicAuth =
    publicAuthPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/auth');

  if (isPublicAuth) {
    if (token) {
      // Already logged in — send straight to their dashboard
      return NextResponse.redirect(new URL(getDashboard(), request.url));
    }
    return NextResponse.next();
  }

  // ── 2. Root / landing page: if logged in → go to dashboard ───
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL(getDashboard(), request.url));
    }
    return NextResponse.next();
  }

  // ── 3. Protected user routes ──────────────────────────────────
  const protectedPaths = ['/dashboard', '/agents', '/customers', '/campaigns', '/onboarding', '/organization', '/settings'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname); // preserve intended destination
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── 4. Admin routes ───────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== userRole.ADMIN && role !== userRole.SUPER_ADMIN) {
      // Logged in but not an admin → send to user dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
