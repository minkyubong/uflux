// ============================================
// Robots.txt 생성
// 검색 엔진 봇 접근 규칙
// ============================================

import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.UFLUX-lab.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 스크래핑/복사 봇 완전 차단
      {
        userAgent: 'HTTrack',
        disallow: '/',
      },
      {
        userAgent: 'WebCopier',
        disallow: '/',
      },
      {
        userAgent: 'Offline Explorer',
        disallow: '/',
      },
      {
        userAgent: 'Wget',
        disallow: '/',
      },
      {
        userAgent: 'curl',
        disallow: '/',
      },
      {
        userAgent: 'SiteSnagger',
        disallow: '/',
      },
      {
        userAgent: 'TeleportPro',
        disallow: '/',
      },
      {
        userAgent: 'WebZIP',
        disallow: '/',
      },
      {
        userAgent: 'Scrapy',
        disallow: '/',
      },
      {
        userAgent: 'Ahrefs',
        disallow: '/',
      },
      {
        userAgent: 'SemrushBot',
        disallow: '/',
      },
      {
        userAgent: 'MJ12bot',
        disallow: '/',
      },
      {
        userAgent: 'DotBot',
        disallow: '/',
      },
      // 아카이브/캐시 봇 차단
      {
        userAgent: 'ia_archiver', // Internet Archive (Wayback Machine)
        disallow: '/',
      },
      {
        userAgent: 'archive.org_bot',
        disallow: '/',
      },
      {
        userAgent: 'CCBot', // Common Crawl
        disallow: '/',
      },
      {
        userAgent: 'GPTBot', // OpenAI
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
      {
        userAgent: 'Claude-Web',
        disallow: '/',
      },
      {
        userAgent: 'Bytespider', // TikTok
        disallow: '/',
      },
      {
        userAgent: 'PetalBot',
        disallow: '/',
      },
      // 허용된 검색엔진 봇
      {
        userAgent: 'Googlebot',
        allow: ['/', '/blog/', '/services/'],
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/dashboard/',
          '/order/',
          '/orders/',
          '/deposit/',
          '/settings/',
          '/transactions/',
        ],
      },
      {
        userAgent: 'Yeti', // 네이버
        allow: ['/', '/blog/', '/services/'],
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/dashboard/',
          '/order/',
          '/orders/',
          '/deposit/',
          '/settings/',
          '/transactions/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/blog/', '/services/'],
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/dashboard/',
          '/order/',
          '/orders/',
          '/deposit/',
          '/settings/',
          '/transactions/',
        ],
      },
      // 기타 모든 봇 - 제한적 허용
      {
        userAgent: '*',
        allow: [
          '/',
          '/blog/',
          '/services/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/dashboard/',
          '/order/',
          '/orders/',
          '/deposit/',
          '/settings/',
          '/transactions/',
          '/private/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}

