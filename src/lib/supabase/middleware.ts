// ============================================
// Supabase Middleware Client
// 미들웨어용 Supabase 클라이언트
// ============================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

// 미들웨어에서는 env.ts를 사용하지 않음 (Edge Runtime 호환성)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function updateSession(request: NextRequest) {
  // 환경변수 체크
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] Supabase 환경변수가 설정되지 않았습니다.');
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 페이지 타입 확인
  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith('/login');
  const isAdminPage = pathname.startsWith('/admin');
  const isDashboardPage = pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/order') ||
                          pathname.startsWith('/orders') ||
                          pathname.startsWith('/deposit') ||
                          pathname.startsWith('/history') ||
                          pathname.startsWith('/support') ||
                          pathname.startsWith('/settings');

  // 비회원 모드 쿠키 확인
  const isGuestMode = request.cookies.get('uflux_guest_mode')?.value === 'true';

  // 비로그인 사용자가 대시보드 페이지 접근 시 (비회원 모드 허용)
  if (!user && isDashboardPage && !isGuestMode) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 비로그인 사용자가 관리자 페이지 접근 시 (비회원 모드도 불가)
  if (!user && isAdminPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 관리자 페이지 접근 시 관리자 권한 확인
  if (user && isAdminPage) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const profile = profileData as { is_admin: boolean } | null;

    // 관리자가 아니면 대시보드로 리디렉션
    if (!profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // 로그인 사용자가 로그인 페이지 접근 시 대시보드로
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    const redirect = url.searchParams.get('redirect') || '/dashboard';
    url.pathname = redirect;
    url.searchParams.delete('redirect');
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

