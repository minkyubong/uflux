// ============================================
// Supabase Client Configuration
// 클라이언트 사이드 Supabase 인스턴스
// ============================================

'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// 환경변수 직접 참조 (NEXT_PUBLIC_ 접두사는 클라이언트에서 사용 가능)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create browser client (singleton pattern)
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[Supabase] Missing environment variables:', {
      url: !!SUPABASE_URL,
      key: !!SUPABASE_ANON_KEY
    });
    throw new Error('Supabase environment variables are not configured');
  }

  browserClient = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

  return browserClient;
}

// Lazy export - 호출될 때 클라이언트 생성
export const supabase = getSupabaseBrowserClient();

