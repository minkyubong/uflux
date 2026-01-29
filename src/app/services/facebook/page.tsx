// ============================================
// Facebook Services Landing Page
// SEO 최적화 페이스북 서비스 랜딩페이지
// ============================================

import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, ThumbsUp, Users, Eye, MessageCircle,
  Zap, TrendingUp, Star, Award, Home, Shield, Share2
} from 'lucide-react';
import { FaFacebook } from 'react-icons/fa';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================
// Metadata (SEO)
// ============================================
export const metadata: Metadata = {
  title: '페이스북 페이지 좋아요 & 팔로워 증가 서비스 | UFLUX',
  description: '페이스북 페이지 좋아요, 팔로워, 게시물 좋아요, 공유를 안전하고 빠르게 늘려드립니다. 24시간 자동화 시스템으로 페이스북 비즈니스 성장을 가속화하세요.',
  keywords: [
    '페이스북 좋아요', '페이스북 팔로워', '페이스북 페이지 좋아요',
    '페이스북 마케팅', 'Facebook likes', 'Facebook followers',
    '페이스북 광고', '페이스북 홍보', '페이스북 성장',
    '페북 좋아요', '페북 팔로워'
  ],
  openGraph: {
    title: '페이스북 페이지 좋아요 & 팔로워 증가 서비스 | UFLUX',
    description: '페이스북 페이지 좋아요, 팔로워, 게시물 좋아요, 공유를 안전하고 빠르게 늘려드립니다.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
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
        <path d="M35 85V35H50V85H35Z" fill="url(#logoGradFB)" />
        <path d="M25 35H60V50H25V35Z" fill="url(#logoGradFB)" />
        <path d="M42 15L75 48L64 59L31 26L42 15Z" fill="url(#logoGradFB)" />
        <path d="M60 20H80V35H65V50H50V35H60V20Z" fill="url(#logoGradFB)" />
        <defs>
          <linearGradient id="logoGradFB" x1="0%" y1="100%" x2="100%" y2="0%">
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
// Service Card Component
// ============================================
function ServiceCard({
  icon: Icon,
  title,
  description,
  price
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  price: string;
}) {
  return (
    <Card className="border-0 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-white/60 text-sm mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">시작가</span>
          <span className="text-lg font-bold text-blue-400">{price}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Feature Item Component
// ============================================
function FeatureItem({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <div>
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p className="text-sm text-white/60">{description}</p>
      </div>
    </div>
  );
}

// ============================================
// FAQ Item Component
// ============================================
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-white/10 pb-6">
      <h4 className="font-semibold text-white mb-2">{question}</h4>
      <p className="text-white/60 text-sm leading-relaxed">{answer}</p>
    </div>
  );
}

// ============================================
// Page Component
// ============================================
export default function FacebookServicesPage() {
  // JSON-LD 구조화 데이터
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: '페이스북 마케팅 서비스',
    description: '페이스북 페이지 좋아요, 팔로워, 게시물 좋아요, 공유 증가 서비스',
    provider: {
      '@type': 'Organization',
      name: 'UFLUX',
      url: 'https://www.UFLUX-lab.com',
    },
    areaServed: 'KR',
    serviceType: 'Facebook Marketing',
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
                className="text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                인사이트
              </Link>
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full"
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
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-6">
              <FaFacebook className="w-4 h-4 mr-1.5 text-[#1877F2]" />
              Facebook 성장 솔루션
            </Badge>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight break-keep">
              페이스북 페이지를
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent"> 강력하게 </span>
              성장시키세요
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/60 mb-8 max-w-2xl mx-auto break-keep">
              페이지 좋아요, 팔로워, 게시물 참여도를 높여
              비즈니스 신뢰도와 도달 범위를 극대화하세요.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full px-8 h-14 text-lg font-bold"
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
                <Link href="/blog/facebook-page-likes-followers-guide">
                  성장 가이드 보기
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">30M+</div>
                <div className="text-sm text-white/40">누적 좋아요</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">99.5%</div>
                <div className="text-sm text-white/40">만족도</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">1~12H</div>
                <div className="text-sm text-white/40">빠른 시작</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              페이스북 성장 서비스
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              다양한 페이스북 마케팅 서비스로 비즈니스 성장을 가속화하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <ServiceCard
              icon={ThumbsUp}
              title="페이지 좋아요"
              description="페이지 좋아요를 늘려 비즈니스 신뢰도를 높이세요"
              price="₩490~"
            />
            <ServiceCard
              icon={Users}
              title="팔로워 증가"
              description="페이지 팔로워를 늘려 도달 범위를 확대하세요"
              price="₩590~"
            />
            <ServiceCard
              icon={Eye}
              title="게시물 좋아요"
              description="게시물 좋아요로 참여도와 노출을 높이세요"
              price="₩200~"
            />
            <ServiceCard
              icon={Share2}
              title="공유 증가"
              description="게시물 공유로 바이럴 효과를 극대화하세요"
              price="₩400~"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-blue-950/20 to-transparent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-4">
                Why UFLUX?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 break-keep">
                왜 UFLUX를 선택해야 할까요?
              </h2>
              <p className="text-white/60 mb-8">
                페이스북 알고리즘을 완벽히 이해하고,
                안전하고 효과적인 페이지 성장을 도와드립니다.
              </p>

              <div className="space-y-6">
                <FeatureItem
                  icon={Shield}
                  title="계정 안전 보장"
                  description="페이스북 정책을 준수하는 안전한 방식으로 페이지 제재 위험이 없습니다"
                />
                <FeatureItem
                  icon={Zap}
                  title="빠른 시작"
                  description="주문 후 1~12시간 이내 서비스가 시작됩니다"
                />
                <FeatureItem
                  icon={TrendingUp}
                  title="도달 범위 확대"
                  description="좋아요와 팔로워 증가로 게시물 노출이 자연스럽게 증가합니다"
                />
                <FeatureItem
                  icon={Award}
                  title="리필 보장"
                  description="30일 이내 이탈 시 무료로 리필해 드립니다"
                />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                인기 패키지
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div>
                    <div className="font-semibold text-white">스타터 패키지</div>
                    <div className="text-sm text-white/60">페이지 좋아요 1,000개</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-400">₩49,000</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div>
                    <div className="font-semibold text-white">비즈니스 패키지</div>
                    <div className="text-sm text-white/60">페이지 좋아요 5,000개 + 팔로워 5,000명</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-400">₩199,000</div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">BEST</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div>
                    <div className="font-semibold text-white">엔터프라이즈 패키지</div>
                    <div className="text-sm text-white/60">페이지 좋아요 10,000개 + 게시물 좋아요 50,000개</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-400">₩399,000</div>
                  </div>
                </div>
              </div>
              <Button
                asChild
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full"
              >
                <Link href="/login">
                  패키지 주문하기
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                자주 묻는 질문
              </h2>
              <p className="text-white/60">
                페이스북 서비스에 대해 궁금한 점을 확인하세요
              </p>
            </div>

            <div className="space-y-6">
              <FAQItem
                question="페이지 좋아요와 팔로워의 차이점이 뭔가요?"
                answer="페이지 좋아요는 페이지 자체에 대한 호감 표시이고, 팔로워는 페이지의 게시물을 뉴스피드에서 볼 수 있는 구독자입니다. 비즈니스 페이지의 경우 둘 다 중요하며, 좋아요는 신뢰도를, 팔로워는 도달 범위를 높여줍니다."
              />
              <FAQItem
                question="개인 프로필에도 서비스가 가능한가요?"
                answer="페이지 좋아요/팔로워 서비스는 비즈니스 페이지 전용입니다. 개인 프로필의 경우 친구 추가, 팔로워 서비스가 별도로 제공됩니다."
              />
              <FAQItem
                question="페이지가 제재받지 않나요?"
                answer="페이스북 정책을 준수하는 점진적 증가 방식을 사용하므로 페이지 제재 위험이 없습니다. 10년 이상 운영하며 단 한 건의 페이지 정지 사례도 없습니다."
              />
              <FAQItem
                question="좋아요/팔로워가 이탈하지 않나요?"
                answer="실제 계정 기반의 고품질 서비스로 자연스러운 이탈률(5~10%)이 발생할 수 있습니다. 30일 이내 이탈 시 무료로 리필해 드립니다."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-950/50 to-blue-900/30 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 break-keep">
            지금 페이스북 비즈니스를 성장시키세요
          </h2>
          <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto break-keep">
            50,000명 이상의 비즈니스가 UFLUX와 함께 성장하고 있습니다.
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

