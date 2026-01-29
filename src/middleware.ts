// ============================================
// Next.js Middleware
// 인증, 세션 관리 및 보안 강화
// 봇/크롤러 차단
// ============================================

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// 차단할 봇/크롤러 User-Agent 패턴
const BLOCKED_USER_AGENTS = [
  // 스크래핑 도구
  'scrapy', 'selenium', 'puppeteer', 'playwright', 'headless',
  'phantom', 'nightmare', 'httrack', 'offline', 'mirror',
  'copier', 'stripper', 'sucker', 'ninja', 'clshttp',
  'webcopier', 'webzip', 'teleport', 'webcapture', 'sitesnagger',
  // HTTP 클라이언트
  'wget', 'curl', 'python-requests', 'python-urllib', 'java/',
  'httpclient', 'axios/', 'node-fetch', 'postman', 'insomnia',
  'go-http-client', 'ruby', 'perl', 'php/',
  // SEO 봇
  'ahrefs', 'semrush', 'moz.com', 'majestic', 'screaming',
  'sitebulb', 'deepcrawl', 'oncrawl', 'botify', 'mj12bot', 'dotbot',
  // 아카이브/AI 봇
  'ia_archiver', 'archive.org', 'ccbot', 'gptbot', 'chatgpt',
  'anthropic', 'claude-web', 'bytespider', 'petalbot',
  // 기타 악성 봇
  'masscan', 'nmap', 'nikto', 'sqlmap', 'dirbuster',
];

// 허용된 봇 (검색엔진)
const ALLOWED_BOTS = [
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot',
  'slurp', 'baiduspider', 'naverbot', 'yeti',
];

// 봇 감지 함수 - 명확한 봇만 차단
function isBlockedBot(userAgent: string | null): boolean {
  if (!userAgent) return false; // User-Agent 없어도 일단 통과

  const ua = userAgent.toLowerCase();

  // 허용된 검색엔진 봇은 통과
  for (const allowed of ALLOWED_BOTS) {
    if (ua.includes(allowed)) return false;
  }

  // 일반 브라우저는 통과
  const browsers = ['chrome', 'firefox', 'safari', 'edge', 'opera', 'mozilla', 'webkit'];
  for (const browser of browsers) {
    if (ua.includes(browser)) return false;
  }

  // 모바일 브라우저도 통과
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
    return false;
  }

  // 차단 목록에 있는 명확한 봇만 차단
  for (const blocked of BLOCKED_USER_AGENTS) {
    if (ua.includes(blocked)) return true;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent');
  const pathname = request.nextUrl.pathname;

  // API 경로와 정적 파일은 봇 체크 제외
  const isApiRoute = pathname.startsWith('/api/');
  const isStaticFile = pathname.includes('.') || pathname.startsWith('/_next/');

  // 명확한 봇만 차단 (API, 정적파일 제외)
  if (!isApiRoute && !isStaticFile && isBlockedBot(userAgent)) {
    console.log('Blocked bot:', userAgent);
    return new NextResponse('Access Denied', { status: 403 });
  }

  // 세션 업데이트
  const response = await updateSession(request);

  // ============================================
  // 보안 헤더 (강화)
  // ============================================

  // X-Frame-Options: 다른 사이트에서 iframe으로 포함 방지
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options: MIME 타입 스니핑 방지
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection: XSS 공격 방지
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy: 리퍼러 정보 제한 (외부로 정보 유출 방지)
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy: 브라우저 기능 제한 (강화)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=(), bluetooth=()'
  );

  // Content-Security-Policy: 컨텐츠 보안 정책 (강화)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  // X-Download-Options: IE에서 자동 실행 방지
  response.headers.set('X-Download-Options', 'noopen');

  // X-Permitted-Cross-Domain-Policies: Flash/PDF 크로스도메인 방지
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Cross-Origin-Embedder-Policy: 외부 리소스 임베드 제한
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  // Cache-Control: 민감한 페이지 캐시 방지
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

