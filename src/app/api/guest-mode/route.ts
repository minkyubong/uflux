import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.UFLUX-lab.com'));

  // 쿠키 설정
  response.cookies.set('UFLUX_guest_mode', 'true', {
    path: '/',
    maxAge: 86400, // 24시간
    sameSite: 'lax',
    httpOnly: false,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.UFLUX-lab.com'));

  // 쿠키 삭제
  response.cookies.delete('UFLUX_guest_mode');

  return response;
}

