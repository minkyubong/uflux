// ============================================
// Supabase Server Configuration
// 서버 사이드 Supabase 인스턴스
// ============================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { env } from '@/lib/env';

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  // 빌드 타임에 환경변수가 없으면 더미 값 사용
  const url = env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출된 경우 무시
          }
        },
      },
    }
  );
}

// 별칭 (호환성)
export const createClient = getSupabaseServerClient;

// Route Handler용 클라이언트
export async function getSupabaseRouteClient() {
  const cookieStore = await cookies();

  // 빌드 타임에 환경변수가 없으면 더미 값 사용
  const url = env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

