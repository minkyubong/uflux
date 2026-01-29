// ============================================
// Environment Variables Validation
// 환경변수 검증 및 타입 안전성 보장
// ============================================

/**
 * 필수 환경변수 검증
 * 빌드 시에는 빈 문자열 반환, 런타임에서만 에러
 */
function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key];

  // 빌드 타임에는 에러를 던지지 않음
  if (!value && required) {
    // 런타임에서만 경고 (클라이언트에서)
    if (typeof window !== 'undefined') {
      console.error(`[UFLUX] 환경변수가 설정되지 않았습니다: ${key}`);
    }
  }

  return value || '';
}

// ============================================
// Public Environment Variables (클라이언트 노출 가능)
// ============================================
export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),

  // App
  NEXT_PUBLIC_APP_URL: getEnvVar('NEXT_PUBLIC_APP_URL', false) || 'http://localhost:3000',
} as const;

// ============================================
// Server-only Environment Variables
// ============================================
export const serverEnv = {
  // Supabase Admin
  SUPABASE_SERVICE_ROLE_KEY: typeof window === 'undefined'
    ? getEnvVar('SUPABASE_SERVICE_ROLE_KEY', false)
    : '',

  // Cron
  CRON_SECRET: typeof window === 'undefined'
    ? getEnvVar('CRON_SECRET', false)
    : '',
} as const;

// ============================================
// Validation Helper (런타임에서 호출)
// ============================================
export function validateEnv(): boolean {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('='.repeat(50));
    console.error('[UFLUX] 필수 환경변수가 누락되었습니다:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('='.repeat(50));
    return false;
  }

  return true;
}

