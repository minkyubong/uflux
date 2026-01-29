// ============================================
// Blog Detail Page
// SEO 최적화 블로그 상세 페이지
// ============================================

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Calendar, Clock, Tag, BookOpen, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPostBySlug, getAllPosts, getRelatedPosts } from '@/lib/blog-posts';
import { cn } from '@/lib/utils';
import { ShareButtonClient } from './share-button';

// ============================================
// Types
// ============================================
interface PageProps {
  params: Promise<{ slug: string }>;
}

// ============================================
// Generate Static Params (SSG)
// ============================================
export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// ============================================
// Generate Metadata (SEO)
// ============================================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: '글을 찾을 수 없습니다',
    };
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: [post.author],
      images: [
        {
          url: post.thumbnail,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.thumbnail],
    },
  };
}

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
        <path d="M35 85V35H50V85H35Z" fill="url(#logoGradDetail)" />
        <path d="M25 35H60V50H25V35Z" fill="url(#logoGradDetail)" />
        <path d="M42 15L75 48L64 59L31 26L42 15Z" fill="url(#logoGradDetail)" />
        <path d="M60 20H80V35H65V50H50V35H60V20Z" fill="url(#logoGradDetail)" />
        <defs>
          <linearGradient id="logoGradDetail" x1="0%" y1="100%" x2="100%" y2="0%">
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
// Table of Contents (자동 생성)
// ============================================
function TableOfContents({ content }: { content: string }) {
  // H2 태그 추출
  const headings = content.match(/<h2[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h2>/g) || [];
  const toc = headings.map((h) => {
    const idMatch = h.match(/id="([^"]*)"/);
    const textMatch = h.match(/>([^<]*)</);
    return {
      id: idMatch ? idMatch[1] : '',
      text: textMatch ? textMatch[1] : '',
    };
  });

  if (toc.length === 0) return null;

  return (
    <Card className="border-0 bg-white/5 backdrop-blur-sm sticky top-24">
      <CardContent className="p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          목차
        </h3>
        <nav className="space-y-2">
          {toc.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="block text-sm text-white/60 hover:text-primary transition-colors py-1 border-l-2 border-transparent hover:border-primary pl-3"
            >
              {item.text}
            </a>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}


// ============================================
// Related Post Card
// ============================================
function RelatedPostCard({ post }: { post: ReturnType<typeof getAllPosts>[0] }) {
  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <Card className="h-full border-0 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
        <CardContent className="p-5">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs mb-3">
            {post.category}
          </Badge>
          <h4 className="font-bold text-white group-hover:text-primary transition-colors line-clamp-2 break-keep">
            {post.title}
          </h4>
          <p className="text-sm text-white/50 mt-2 line-clamp-2">{post.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================
// Page Component
// ============================================
export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(slug, 3);

  // JSON-LD 구조화 데이터
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: `https://www.uflux-lab.com${post.thumbnail}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'UFLUX',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.uflux-lab.com/logo-hero.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.uflux-lab.com/blog/${post.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
                className="text-sm font-medium text-white hover:text-primary transition-colors"
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

      {/* Article Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0a1628] to-[#0d2840]/20" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#00C896]/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Back Link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              모든 아티클 보기
            </Link>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <Tag className="w-3 h-3 mr-1" />
                {post.category}
              </Badge>
              <span className="text-sm text-white/40 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(post.publishedAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="text-sm text-white/40 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readingTime}분 소요
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight break-keep">
              {post.title}
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/60 leading-relaxed break-keep">
              {post.description}
            </p>

            {/* Author & Share */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0064FF] to-[#00C896] flex items-center justify-center text-white font-bold">
                  I
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{post.author}</p>
                  <p className="text-xs text-white/40">UFLUX</p>
                </div>
              </div>
              <ShareButtonClient />
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
              {/* Main Content */}
              <article className="min-w-0">
                <div
                  className="prose prose-lg prose-invert max-w-none
                    prose-headings:text-white prose-headings:font-bold prose-headings:scroll-mt-24
                    prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-4 prose-h2:border-b prose-h2:border-white/10
                    prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                    prose-p:text-white/70 prose-p:leading-relaxed
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-white prose-strong:font-semibold
                    prose-ul:text-white/70 prose-ol:text-white/70
                    prose-li:marker:text-primary
                    prose-blockquote:border-l-primary prose-blockquote:bg-white/5 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-xl
                    prose-code:text-primary prose-code:bg-white/10 prose-code:px-2 prose-code:py-0.5 prose-code:rounded
                    prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </article>

              {/* Sidebar */}
              <aside className="hidden lg:block">
                <TableOfContents content={post.content} />
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* Keywords */}
      <section className="py-8 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2">
              {post.keywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="outline"
                  className="bg-white/5 text-white/60 border-white/10 hover:bg-white/10 transition-colors"
                >
                  #{keyword}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 border-t border-white/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-8">관련 아티클</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <RelatedPostCard key={relatedPost.slug} post={relatedPost} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#0a1628]/50 to-[#0d2840]/50 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 break-keep">
            지금 바로 시작하세요
          </h2>
          <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto break-keep">
            50,000명 이상의 크리에이터가 UFLUX와 함께 성장하고 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-white text-slate-900 hover:bg-white/90 rounded-full px-8 h-14 text-lg font-bold"
            >
              <Link href="/login">
                무료로 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 h-14"
            >
              <Link href="/blog">
                더 많은 인사이트 보기
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="md" />
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link href="/terms" className="hover:text-white/80 transition-colors">이용약관</Link>
              <Link href="/privacy" className="hover:text-white/80 transition-colors">개인정보처리방침</Link>
              <Link href="/blog" className="hover:text-white/80 transition-colors">인사이트</Link>
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
