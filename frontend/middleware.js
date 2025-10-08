import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if pathname already has a locale
  const pathnameHasLocale = /^\/(en|es)(\/|$)/.test(pathname);
  
  // If no locale, redirect to /es (default locale)
  if (!pathnameHasLocale) {
    const locale = 'es';
    request.nextUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, static files)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)' 
  ],
};