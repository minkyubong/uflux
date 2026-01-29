// ============================================
// OAuth Callback Handler
// Google/Kakao 로그인 콜백 처리
// ============================================

import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await getSupabaseRouteClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 로그인 성공 시 비회원 모드 쿠키 삭제
      const response = NextResponse.redirect(new URL(next, requestUrl.origin));
      response.cookies.set('UFLUX_guest_mode', '', {
        path: '/',
        expires: new Date(0), // 즉시 만료
      });
      return response;
    }
  }

  // 오류 발생 시 로그인 페이지로 리다이렉트
  return NextResponse.redirect(
    new URL('/login?error=auth_error', requestUrl.origin)
  );
}

