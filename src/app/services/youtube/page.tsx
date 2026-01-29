// ============================================
// YouTube Services Landing Page
// SEO 최적화 유튜브 서비스 랜딩페이지
// ============================================

import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, Users, Eye, ThumbsUp, Clock, Shield,
  Zap, TrendingUp, CheckCircle2, Star, Award, Home
} from 'lucide-react';
import { FaYoutube } from 'react-icons/fa';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================
// Metadata (SEO)
// ============================================
export const metadata: Metadata = {
  title: '유튜브 구독자 늘리기 & 조회수 증가 서비스 | UFLUX',
  description: '유튜브 구독자, 조회수, 좋아요, 시청시간을 안전하고 빠르게 늘려드립니다. 24시간 자동화 시스템으로 채널 성장을 가속화하세요. 수익창출 조건 달성을 위한 최적의 솔루션.',
  keywords: [
    '유튜브 구독자 늘리기', '유튜브 조회수 늘리기', '유튜브 수익창출',
    '유튜브 시청시간', '유튜브 좋아요', '유튜브 마케팅',
    '유튜브 채널 성장', '유튜브 구독자 구매', '유튜브 조회수 구매',
    'YouTube subscribers', 'YouTube views', 'YouTube marketing'
  ],
  openGraph: {
    title: '유튜브 구독자 늘리기 & 조회수 증가 서비스 | UFLUX',
    description: '유튜브 구독자, 조회수, 좋아요, 시청시간을 안전하고 빠르게 늘려드립니다.',
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
        <path d="M35 85V35H50V85H35Z" fill="url(#logoGradYT)" />
        <path d="M25 35H60V50H25V35Z" fill="url(#logoGradYT)" />
        <path d="M42 15L75 48L64 59L31 26L42 15Z" fill="url(#logoGradYT)" />
        <path d="M60 20H80V35H65V50H50V35H60V20Z" fill="url(#logoGradYT)" />
        <defs>
          <linearGradient id="logoGradYT" x1="0%" y1="100%" x2="100%" y2="0%">
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
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-white/60 text-sm mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">시작가</span>
          <span className="text-lg font-bold text-red-400">{price}</span>
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
      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-red-400" />
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
export default function YouTubeServicesPage() {
  // JSON-LD 구조화 데이터
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: '유튜브 마케팅 서비스',
    description: '유튜브 구독자, 조회수, 좋아요, 시청시간 증가 서비스',
    provider: {
      '@type': 'Organization',
      name: 'UFLUX',
      url: 'https://www.UFLUX-lab.com',
    },
    areaServed: 'KR',
    serviceType: 'YouTube Marketing',
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
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full"
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-red-600/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-6">
              <FaYoutube className="w-4 h-4 mr-1.5 text-[#FF0000]" />
              YouTube 성장 솔루션
            </Badge>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight break-keep">
              유튜브 채널을
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent"> 폭발적으로 </span>
              성장시키세요
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/60 mb-8 max-w-2xl mx-auto break-keep">
              구독자 1,000명 + 시청시간 4,000시간.
              수익창출 조건을 빠르고 안전하게 달성할 수 있도록 도와드립니다.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full px-8 h-14 text-lg font-bold"
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
                <Link href="/blog/youtube-subscribers-growth-2026">
                  성장 가이드 보기
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">50K+</div>
                <div className="text-sm text-white/40">활성 사용자</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">99.9%</div>
                <div className="text-sm text-white/40">만족도</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-sm text-white/40">자동화</div>
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
              유튜브 성장 서비스
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              다양한 유튜브 마케팅 서비스로 채널 성장을 가속화하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <ServiceCard
              icon={Users}
              title="구독자 증가"
              description="실제 계정 기반의 고품질 구독자로 채널 신뢰도를 높이세요"
              price="₩990~"
            />
            <ServiceCard
              icon={Eye}
              title="조회수 증가"
              description="자연스러운 트래픽으로 영상 노출을 극대화하세요"
              price="₩500~"
            />
            <ServiceCard
              icon={ThumbsUp}
              title="좋아요 증가"
              description="영상 인기도를 높여 알고리즘 추천을 받으세요"
              price="₩300~"
            />
            <ServiceCard
              icon={Clock}
              title="시청시간 증가"
              description="수익창출 조건 4,000시간을 빠르게 달성하세요"
              price="₩1,500~"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-red-950/20 to-transparent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-4">
                Why UFLUX?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 break-keep">
                왜 UFLUX를 선택해야 할까요?
              </h2>
              <p className="text-white/60 mb-8">
                10년 이상의 SMM 전문 노하우와 자체 개발 자동화 시스템으로
                가장 안전하고 효과적인 유튜브 마케팅 서비스를 제공합니다.
              </p>

              <div className="space-y-6">
                <FeatureItem
                  icon={Shield}
                  title="100% 안전 보장"
                  description="유튜브 정책을 준수하는 자연스러운 성장 방식으로 계정 안전을 보장합니다"
                />
                <FeatureItem
                  icon={Zap}
                  title="빠른 시작"
                  description="주문 후 1~24시간 이내 서비스가 시작되며, 실시간으로 진행 상황을 확인할 수 있습니다"
                />
                <FeatureItem
                  icon={TrendingUp}
                  title="점진적 증가"
                  description="급격한 증가가 아닌 자연스러운 점진적 증가로 알고리즘 패널티를 방지합니다"
                />
                <FeatureItem
                  icon={Award}
                  title="30일 보충 보장"
                  description="이탈이 발생하면 30일 이내 무료로 보충해 드립니다"
                />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                인기 패키지
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <div>
                    <div className="font-semibold text-white">스타터 패키지</div>
                    <div className="text-sm text-white/60">구독자 1,000명 + 시청시간 1,000시간</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-400">₩299,000</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <div>
                    <div className="font-semibold text-white">수익창출 패키지</div>
                    <div className="text-sm text-white/60">구독자 1,000명 + 시청시간 4,000시간</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-400">₩599,000</div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">BEST</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <div>
                    <div className="font-semibold text-white">프로 패키지</div>
                    <div className="text-sm text-white/60">구독자 5,000명 + 조회수 50,000회</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-400">₩999,000</div>
                  </div>
                </div>
              </div>
              <Button
                asChild
                className="w-full mt-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full"
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
                유튜브 서비스에 대해 궁금한 점을 확인하세요
              </p>
            </div>

            <div className="space-y-6">
              <FAQItem
                question="구독자가 이탈하지 않나요?"
                answer="실제 계정 기반의 고품질 구독자를 제공하며, 자연스러운 이탈률(5~10%)이 발생할 수 있습니다. 30일 이내 이탈 시 무료로 보충해 드립니다."
              />
              <FAQItem
                question="계정이 정지되거나 영상이 삭제되지 않나요?"
                answer="유튜브 정책을 준수하는 안전한 방식으로 진행되므로 계정 정지나 영상 삭제 위험이 없습니다. 10년 이상 운영하며 단 한 건의 정지 사례도 없습니다."
              />
              <FAQItem
                question="시청시간이 수익창출 조건에 인정되나요?"
                answer="네, 실제 시청 기록이 남는 방식으로 제공되므로 수익창출 조건(4,000시간)에 100% 인정됩니다."
              />
              <FAQItem
                question="얼마나 빨리 시작되나요?"
                answer="주문 완료 후 보통 1~6시간 이내 시작되며, 최대 24시간 이내 시작을 보장합니다. 점진적으로 증가하여 자연스러운 성장을 유도합니다."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-950/50 to-red-900/30 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 break-keep">
            지금 유튜브 채널 성장을 시작하세요
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

