import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { userRole } from './types/admin.types';


export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const role = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  // 1. Public Auth Routes (login, register)
  if (pathname.startsWith('/auth')) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 2. Protected Routes (dashboard, agents, etc.)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/agents') || pathname.startsWith('/settings')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return NextResponse.next();
  }

  // 3. Admin Routes
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role !== userRole.ADMIN && role !== userRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/agents/:path*',
    '/settings/:path*',
    '/auth/:path*',
  ],
};
