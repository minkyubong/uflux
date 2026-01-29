// ============================================
// Blog List Page (인사이트)
// 플랫폼 필터 + 페이지네이션 버전
// ============================================

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, Tag, TrendingUp, Sparkles, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAllPosts } from '@/lib/blog-posts';
import { cn } from '@/lib/utils';
import { PlatformFilter } from '@/components/blog/platform-filter';

// ============================================
// Constants
// ============================================
const POSTS_PER_PAGE = 9;

// Simple color map for server-side rendering (no icons)
const PLATFORM_COLORS: Record<string, string> = {
  '유튜브': '#FF0000',
  '인스타그램': '#E4405F',
  '틱톡': '#00f2ea',
  '페이스북': '#1877F2',
  '트위터': '#1DA1F2',
  '텔레그램': '#0088CC',
  '트위치': '#9146FF',
  '디스코드': '#5865F2',
  '스레드': '#ffffff',
  'SMM': '#00C896',
  '기타': '#0064FF',
};

// ============================================
// Metadata
// ============================================
export const metadata: Metadata = {
  title: '인사이트 | SNS 마케팅 & 유튜브 성장 전략 블로그',
  description: '유튜브 조회수 올리기, 인스타 팔로워 늘리기, SNS 마케팅 전략 등 크리에이터를 위한 실전 노하우를 공유합니다. UFLUX 마케팅 전문가가 알려드리는 성장 비법.',
  keywords: ['SNS 마케팅', '유튜브 성장', '인스타 마케팅', '크리에이터 팁', '소셜미디어 전략'],
  openGraph: {
    title: '인사이트 | UFLUX 마케팅 블로그',
    description: '크리에이터를 위한 실전 마케팅 노하우',
    type: 'website',
  },
};

// ============================================
// Logo Component
// ============================================
function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 48, text: 'text-2xl' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2">
      <svg width={s.icon} height={s.icon} viewBox="0 0 100 100" fill="none" className="drop-shadow-lg">
        <path d="M35 85V35H50V85H35Z" fill="url(#logoGrad)" />
        <path d="M25 35H60V50H25V35Z" fill="url(#logoGrad)" />
        <path d="M42 15L75 48L64 59L31 26L42 15Z" fill="url(#logoGrad)" />
        <path d="M60 20H80V35H65V50H50V35H60V20Z" fill="url(#logoGrad)" />
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0064FF" />
            <stop offset="100%" stopColor="#00C896" />
          </linearGradient>
        </defs>
      </svg>
      <span className={cn(s.text, 'font-black tracking-tight bg-gradient-to-r from-[#0064FF] to-[#00C896] bg-clip-text text-transparent')}>
        UFLUX
      </span>
    </div>
  );
}


// ============================================
// Pagination Component
// ============================================
function Pagination({
  currentPage,
  totalPages,
  platform
}: {
  currentPage: number;
  totalPages: number;
  platform: string;
}) {
  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (platform) params.set('platform', platform);
    if (page > 1) params.set('page', page.toString());
    const queryString = params.toString();
    return queryString ? `/blog?${queryString}` : '/blog';
  };

  const pages: (number | 'ellipsis')[] = [];

  // Always show first page
  pages.push(1);

  // Show ellipsis if needed
  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  // Show pages around current
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  // Show ellipsis if needed
  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  // Always show last page if more than 1
  if (totalPages > 1 && !pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      {/* Previous Button */}
      <Link
        href={getPageUrl(currentPage - 1)}
        className={cn(
          'inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          currentPage === 1
            ? 'pointer-events-none opacity-30 text-white/40'
            : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
        )}
        aria-disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" />
        이전
      </Link>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, index) => (
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-white/40">...</span>
          ) : (
            <Link
              key={page}
              href={getPageUrl(page)}
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors',
                currentPage === page
                  ? 'bg-gradient-to-r from-[#0064FF] to-[#00C896] text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
              )}
            >
              {page}
            </Link>
          )
        ))}
      </div>

      {/* Next Button */}
      <Link
        href={getPageUrl(currentPage + 1)}
        className={cn(
          'inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          currentPage === totalPages
            ? 'pointer-events-none opacity-30 text-white/40'
            : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
        )}
        aria-disabled={currentPage === totalPages}
      >
        다음
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ============================================
// Blog Card Component
// ============================================
function BlogCard({ post, featured = false }: { post: ReturnType<typeof getAllPosts>[0]; featured?: boolean }) {
  const platformColor = PLATFORM_COLORS[post.category] || '#0064FF';

  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <Card className={cn(
        'h-full overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300',
        'hover:bg-white/10 hover:border-white/20 hover:-translate-y-1',
        'relative',
        featured && 'md:col-span-2'
      )}>
        {/* Top Gradient Border on Hover */}
        <div
          className="h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `linear-gradient(to right, ${platformColor}, ${platformColor}80)` }}
        />

        <CardContent className={cn('relative p-6', featured && 'md:p-8')}>
          {/* Category & Reading Time */}
          <div className="flex items-center gap-3 mb-4">
            <Badge
              variant="outline"
              className="border-white/20"
              style={{
                backgroundColor: `${platformColor}15`,
                color: platformColor,
                borderColor: `${platformColor}30`
              }}
            >
              <Tag className="w-3 h-3 mr-1" />
              {post.category}
            </Badge>
            <span className="text-xs text-white/40 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readingTime}분
            </span>
          </div>

          {/* Title */}
          <h2 className={cn(
            'font-bold text-white mb-3 group-hover:text-[#4D9FFF] transition-colors duration-300 break-keep',
            featured ? 'text-2xl md:text-3xl' : 'text-xl'
          )}>
            {post.title}
          </h2>

          {/* Description */}
          <p className={cn(
            'text-white/60 leading-relaxed break-keep',
            featured ? 'text-base md:text-lg' : 'text-sm line-clamp-2'
          )}>
            {post.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Calendar className="w-3 h-3" />
              {new Date(post.publishedAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-[#00C896] group-hover:translate-x-1 transition-transform duration-300">
              읽어보기
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================
// Page Component
// ============================================
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; page?: string }>;
}) {
  const params = await searchParams;
  const platform = params.platform || '';
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));

  // Get all posts and filter by platform
  const allPosts = getAllPosts();
  const filteredPosts = platform
    ? allPosts.filter(post => post.category === platform)
    : allPosts;

  // Calculate pagination
  const totalPosts = filteredPosts.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  // Featured post (only on first page without filter)
  const showFeatured = currentPage === 1 && !platform;
  const featuredPost = showFeatured ? paginatedPosts[0] : null;
  const displayPosts = showFeatured ? paginatedPosts.slice(1) : paginatedPosts;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Logo size="md" />
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-white/60 hover:text-white transition-colors flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                홈
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-[#00C896]"
              >
                인사이트
              </Link>
              <Button
                asChild
                className="bg-gradient-to-r from-[#0064FF] to-[#00C896] hover:from-[#0052D4] hover:to-[#00B085] text-white rounded-full"
              >
                <Link href="/login">
                  시작하기
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#0064FF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#00C896]/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-white/80">UFLUX 인사이트</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight break-keep">
              크리에이터를 위한
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#4D9FFF] via-[#00C896] to-[#4D9FFF]">
                실전 성장 전략
              </span>
            </h1>

            <p className="text-lg text-white/60 max-w-2xl mx-auto break-keep mb-8">
              유튜브, 인스타그램, 틱톡 마케팅의 모든 것.
              10년 노하우를 가진 전문가가 알려드리는 성장 비법.
            </p>

            {/* Platform Filters */}
            <PlatformFilter currentPlatform={platform} />
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {paginatedPosts.length > 0 ? (
            <div className="space-y-8">
              {/* Results Count */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-white/60">
                  {platform ? (
                    <>
                      <span className="text-white font-medium">{platform}</span> 관련 글 {totalPosts}개
                    </>
                  ) : (
                    <>총 {totalPosts}개의 글</>
                  )}
                </div>
                {currentPage > 1 && (
                  <div className="text-sm text-white/40">
                    페이지 {currentPage} / {totalPages}
                  </div>
                )}
              </div>

              {/* Featured Post */}
              {featuredPost && (
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-[#00C896]" />
                    <span className="text-sm font-medium text-white/60">추천 아티클</span>
                  </div>
                  <BlogCard post={featuredPost} featured />
                </div>
              )}

              {/* Posts Grid */}
              {displayPosts.length > 0 && (
                <>
                  {showFeatured && (
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-sm font-medium text-white/60">최신 아티클</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayPosts.map((post) => (
                      <BlogCard key={post.slug} post={post} />
                    ))}
                  </div>
                </>
              )}

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                platform={platform}
              />
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-white/40 mb-4">
                {platform ? `'${platform}' 관련 글이 없습니다.` : '아직 등록된 글이 없습니다.'}
              </p>
              {platform && (
                <Link
                  href="/blog"
                  className="text-[#00C896] hover:text-[#00E0A8] transition-colors"
                >
                  전체 글 보기
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#0064FF]/20 via-[#00C896]/20 to-[#0064FF]/20 border-y border-white/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 break-keep">
            이론만으로는 부족합니다
          </h2>
          <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto break-keep">
            지금 바로 UFLUX와 함께 채널 성장을 시작하세요.
            50,000+ 크리에이터가 이미 선택했습니다.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-slate-900 hover:bg-white/90 rounded-full px-8 h-14 text-lg font-bold shadow-[0_0_60px_-15px_rgba(255,255,255,0.3)]"
          >
            <Link href="/login">
              무료로 시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="md" />
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
              <Link href="/blog" className="hover:text-white transition-colors">인사이트</Link>
            </div>
            <div className="text-sm text-white/30">
              &copy; {new Date().getFullYear()} UFLUX. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

