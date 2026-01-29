// ============================================
// TikTok Services Landing Page
// SEO 최적화 틱톡 서비스 랜딩페이지
// ============================================

import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, Users, Heart, Eye, Share2,
  Zap, TrendingUp, CheckCircle2, Star, Award, Home, Shield
} from 'lucide-react';
import { FaTiktok } from 'react-icons/fa';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================
// Metadata (SEO)
// ============================================
export const metadata: Metadata = {
  title: '틱톡 팔로워 늘리기 & 조회수 증가 서비스 | UFLUX',
  description: '틱톡 팔로워, 좋아요, 조회수, 공유를 안전하고 빠르게 늘려드립니다. 24시간 자동화 시스템으로 틱톡 계정 성장을 가속화하고 FYP 노출을 극대화하세요.',
  keywords: [
    '틱톡 팔로워 늘리기', '틱톡 조회수', '틱톡 좋아요',
    '틱톡 마케팅', 'TikTok followers', 'TikTok views',
    '틱톡 FYP', '틱톡 알고리즘', '틱톡 바이럴',
    '틱톡 성장', '틱톡 인플루언서'
  ],
  openGraph: {
    title: '틱톡 팔로워 늘리기 & 조회수 증가 서비스 | UFLUX',
    description: '틱톡 팔로워, 좋아요, 조회수, 공유를 안전하고 빠르게 늘려드립니다.',
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
        <path d="M35 85V35H50V85H35Z" fill="url(#logoGradTT)" />
        <path d="M25 35H60V50H25V35Z" fill="url(#logoGradTT)" />
        <path d="M42 15L75 48L64 59L31 26L42 15Z" fill="url(#logoGradTT)" />
        <path d="M60 20H80V35H65V50H50V35H60V20Z" fill="url(#logoGradTT)" />
        <defs>
          <linearGradient id="logoGradTT" x1="0%" y1="100%" x2="100%" y2="0%">
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
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-white/60 text-sm mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">시작가</span>
          <span className="text-lg font-bold text-cyan-400">{price}</span>
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
      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-cyan-400" />
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
export default function TikTokServicesPage() {
  // JSON-LD 구조화 데이터
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: '틱톡 마케팅 서비스',
    description: '틱톡 팔로워, 좋아요, 조회수, 공유 증가 서비스',
    provider: {
      '@type': 'Organization',
      name: 'UFLUX',
      url: 'https://www.UFLUX-lab.com',
    },
    areaServed: 'KR',
    serviceType: 'TikTok Marketing',
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
                className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white rounded-full"
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-cyan-950/20 to-blue-950/20" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 mb-6">
              <FaTiktok className="w-4 h-4 mr-1.5" />
              TikTok 성장 솔루션
            </Badge>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight break-keep">
              틱톡에서
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> 바이럴 </span>
              되세요
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/60 mb-8 max-w-2xl mx-auto break-keep">
              FYP(For You Page) 노출을 극대화하고,
              팔로워와 조회수를 폭발적으로 늘려 틱톡 크리에이터로 성장하세요.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white rounded-full px-8 h-14 text-lg font-bold"
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
                <Link href="/blog/tiktok-followers-views-guide-2026">
                  성장 가이드 보기
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500M+</div>
                <div className="text-sm text-white/40">누적 조회수</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">99.5%</div>
                <div className="text-sm text-white/40">만족도</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">즉시</div>
                <div className="text-sm text-white/40">시작</div>
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
              틱톡 성장 서비스
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              다양한 틱톡 마케팅 서비스로 계정 성장을 가속화하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <ServiceCard
              icon={Users}
              title="팔로워 증가"
              description="고품질 실제 계정 팔로워로 프로필 영향력을 높이세요"
              price="₩590~"
            />
            <ServiceCard
              icon={Eye}
              title="조회수 증가"
              description="FYP 노출을 극대화하는 조회수 증가 서비스"
              price="₩100~"
            />
            <ServiceCard
              icon={Heart}
              title="좋아요 증가"
              description="영상 좋아요를 늘려 알고리즘 추천을 받으세요"
              price="₩200~"
            />
            <ServiceCard
              icon={Share2}
              title="공유 증가"
              description="공유 수를 늘려 바이럴 효과를 극대화하세요"
              price="₩300~"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-cyan-950/20 to-transparent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 mb-4">
                Why UFLUX?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 break-keep">
                왜 UFLUX를 선택해야 할까요?
              </h2>
              <p className="text-white/60 mb-8">
                틱톡 알고리즘의 핵심을 이해하고,
                FYP 노출을 극대화하는 전략으로 빠른 성장을 도와드립니다.
              </p>

              <div className="space-y-6">
                <FeatureItem
                  icon={Shield}
                  title="계정 안전 보장"
                  description="틱톡 정책을 준수하는 안전한 방식으로 계정 정지 위험 없이 성장하세요"
                />
                <FeatureItem
                  icon={Zap}
                  title="즉시 시작"
                  description="조회수는 주문 즉시, 팔로워는 1시간 이내 시작됩니다"
                />
                <FeatureItem
                  icon={TrendingUp}
                  title="FYP 최적화"
                  description="조회수, 좋아요, 공유 비율을 최적화하여 FYP 노출 확률을 높입니다"
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
                <div className="flex items-center justify-between p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <div>
                    <div className="font-semibold text-white">바이럴 스타터</div>
                    <div className="text-sm text-white/60">조회수 10,000 + 좋아요 1,000</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-cyan-400">₩29,000</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <div>
                    <div className="font-semibold text-white">크리에이터 패키지</div>
                    <div className="text-sm text-white/60">팔로워 5,000 + 조회수 50,000</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-cyan-400">₩199,000</div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">BEST</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <div>
                    <div className="font-semibold text-white">인플루언서 패키지</div>
                    <div className="text-sm text-white/60">팔로워 10,000 + 조회수 100,000</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-cyan-400">₩349,000</div>
                  </div>
                </div>
              </div>
              <Button
                asChild
                className="w-full mt-6 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white rounded-full"
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
                틱톡 서비스에 대해 궁금한 점을 확인하세요
              </p>
            </div>

            <div className="space-y-6">
              <FAQItem
                question="조회수가 FYP에 영향을 주나요?"
                answer="네, 초기 조회수와 좋아요 비율이 높으면 틱톡 알고리즘이 해당 영상을 더 많은 사용자에게 추천합니다. 특히 업로드 후 1시간 이내의 초기 반응이 중요합니다."
              />
              <FAQItem
                question="계정이 정지되지 않나요?"
                answer="틱톡 정책을 준수하는 안전한 방식으로 진행되므로 계정 정지 위험이 없습니다. 점진적 증가 방식을 사용하여 자연스러운 성장 패턴을 유지합니다."
              />
              <FAQItem
                question="비공개 계정도 가능한가요?"
                answer="팔로워 서비스만 비공개 계정에서 가능합니다. 조회수, 좋아요, 공유 서비스는 영상이 공개되어 있어야 합니다."
              />
              <FAQItem
                question="틱톡 라이브 시청자도 가능한가요?"
                answer="네, 틱톡 라이브 시청자 서비스도 제공합니다. 실시간으로 원하는 시청자 수를 유지할 수 있습니다."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-cyan-950/50 to-blue-950/50 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 break-keep">
            지금 틱톡에서 바이럴 되세요
          </h2>
          <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto break-keep">
            50,000명 이상의 틱톡커가 UFLUX와 함께 성장하고 있습니다.
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

