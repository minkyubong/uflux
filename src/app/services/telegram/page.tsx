// ============================================
// Telegram Services Landing Page
// SEO 최적화 텔레그램 서비스 랜딩페이지
// ============================================

import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, Users, Eye, MessageCircle,
  Zap, TrendingUp, Star, Award, Home, Shield, Bell
} from 'lucide-react';
import { FaTelegram } from 'react-icons/fa';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================
// Metadata (SEO)
// ============================================
export const metadata: Metadata = {
  title: '텔레그램 채널 구독자 & 조회수 증가 서비스 | UFLUX',
  description: '텔레그램 채널 구독자, 게시물 조회수, 반응을 안전하고 빠르게 늘려드립니다. 24시간 자동화 시스템으로 텔레그램 채널/그룹 성장을 가속화하세요.',
  keywords: [
    '텔레그램 구독자', '텔레그램 채널 구독자', '텔레그램 조회수',
    '텔레그램 마케팅', 'Telegram subscribers', 'Telegram views',
    '텔레그램 그룹 멤버', '텔레그램 홍보', '텔레그램 성장',
    '텔레그램 채널 홍보', '텔레그램 멤버 늘리기'
  ],
  openGraph: {
    title: '텔레그램 채널 구독자 & 조회수 증가 서비스 | UFLUX',
    description: '텔레그램 채널 구독자, 게시물 조회수, 반응을 안전하고 빠르게 늘려드립니다.',
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
        <path d="M35 85V35H50V85H35Z" fill="url(#logoGradTG)" />
        <path d="M25 35H60V50H25V35Z" fill="url(#logoGradTG)" />
        <path d="M42 15L75 48L64 59L31 26L42 15Z" fill="url(#logoGradTG)" />
        <path d="M60 20H80V35H65V50H50V35H60V20Z" fill="url(#logoGradTG)" />
        <defs>
          <linearGradient id="logoGradTG" x1="0%" y1="100%" x2="100%" y2="0%">
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
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-white/60 text-sm mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">시작가</span>
          <span className="text-lg font-bold text-sky-400">{price}</span>
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
      <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-sky-400" />
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
export default function TelegramServicesPage() {
  // JSON-LD 구조화 데이터
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: '텔레그램 마케팅 서비스',
    description: '텔레그램 채널 구독자, 게시물 조회수, 반응 증가 서비스',
    provider: {
      '@type': 'Organization',
      name: 'UFLUX',
      url: 'https://www.UFLUX-lab.com',
    },
    areaServed: 'KR',
    serviceType: 'Telegram Marketing',
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
                className="bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 text-white rounded-full"
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-sky-950/20 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-400/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 mb-6">
              <FaTelegram className="w-4 h-4 mr-1.5 text-[#0088CC]" />
              Telegram 성장 솔루션
            </Badge>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight break-keep">
              텔레그램 채널을
              <span className="bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent"> 10만 구독자 </span>
              로 성장시키세요
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/60 mb-8 max-w-2xl mx-auto break-keep">
              채널 구독자, 그룹 멤버, 게시물 조회수까지.
              텔레그램 커뮤니티를 빠르게 성장시키는 최적의 솔루션.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 text-white rounded-full px-8 h-14 text-lg font-bold"
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
                <Link href="/blog/telegram-channel-subscribers-guide-2026">
                  성장 가이드 보기
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">50M+</div>
                <div className="text-sm text-white/40">누적 구독자</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">99.7%</div>
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
              텔레그램 성장 서비스
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              다양한 텔레그램 마케팅 서비스로 채널/그룹 성장을 가속화하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <ServiceCard
              icon={Users}
              title="채널 구독자"
              description="채널 구독자를 늘려 콘텐츠 도달 범위를 확대하세요"
              price="₩290~"
            />
            <ServiceCard
              icon={Users}
              title="그룹 멤버"
              description="그룹 멤버를 늘려 활발한 커뮤니티를 만드세요"
              price="₩390~"
            />
            <ServiceCard
              icon={Eye}
              title="게시물 조회수"
              description="게시물 조회수를 높여 콘텐츠 신뢰도를 올리세요"
              price="₩50~"
            />
            <ServiceCard
              icon={MessageCircle}
              title="반응/댓글"
              description="게시물 반응과 댓글로 참여도를 높이세요"
              price="₩100~"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-sky-950/20 to-transparent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 mb-4">
                Why UFLUX?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 break-keep">
                왜 UFLUX를 선택해야 할까요?
              </h2>
              <p className="text-white/60 mb-8">
                텔레그램 채널/그룹 성장에 특화된 서비스로
                빠르고 안전하게 커뮤니티를 성장시켜 드립니다.
              </p>

              <div className="space-y-6">
                <FeatureItem
                  icon={Shield}
                  title="채널 안전 보장"
                  description="텔레그램 정책을 준수하는 안전한 방식으로 채널 제재 위험이 없습니다"
                />
                <FeatureItem
                  icon={Zap}
                  title="즉시 시작"
                  description="조회수는 주문 즉시, 구독자/멤버는 1시간 이내 시작됩니다"
                />
                <FeatureItem
                  icon={TrendingUp}
                  title="실제 계정 기반"
                  description="봇이 아닌 실제 텔레그램 계정으로 자연스러운 성장을 유도합니다"
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
                <div className="flex items-center justify-between p-4 bg-sky-500/10 rounded-xl border border-sky-500/20">
                  <div>
                    <div className="font-semibold text-white">채널 스타터</div>
                    <div className="text-sm text-white/60">구독자 1,000명 + 조회수 10,000</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-sky-400">₩39,000</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-sky-500/10 rounded-xl border border-sky-500/20">
                  <div>
                    <div className="font-semibold text-white">채널 그로스</div>
                    <div className="text-sm text-white/60">구독자 5,000명 + 조회수 50,000</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-sky-400">₩149,000</div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">BEST</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-sky-500/10 rounded-xl border border-sky-500/20">
                  <div>
                    <div className="font-semibold text-white">채널 프로</div>
                    <div className="text-sm text-white/60">구독자 10,000명 + 조회수 100,000</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-sky-400">₩279,000</div>
                  </div>
                </div>
              </div>
              <Button
                asChild
                className="w-full mt-6 bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 text-white rounded-full"
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

      {/* Use Cases Section */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              이런 분들께 추천합니다
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-0 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-6 h-6 text-sky-400" />
                </div>
                <h3 className="font-bold text-white mb-2">코인/NFT 프로젝트</h3>
                <p className="text-sm text-white/60">토큰 론칭 전 커뮤니티 구축이 필요한 프로젝트</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-sky-400" />
                </div>
                <h3 className="font-bold text-white mb-2">정보 채널 운영자</h3>
                <p className="text-sm text-white/60">주식, 부동산, 취업 등 정보 채널 초기 성장</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-sky-400" />
                </div>
                <h3 className="font-bold text-white mb-2">커뮤니티 그룹</h3>
                <p className="text-sm text-white/60">동호회, 스터디, 팬클럽 등 그룹 활성화</p>
              </CardContent>
            </Card>
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
                텔레그램 서비스에 대해 궁금한 점을 확인하세요
              </p>
            </div>

            <div className="space-y-6">
              <FAQItem
                question="채널과 그룹 서비스의 차이점이 뭔가요?"
                answer="채널은 일방향 방송 형태로 구독자에게 메시지를 전달하고, 그룹은 양방향 소통이 가능한 커뮤니티입니다. 채널은 구독자 서비스를, 그룹은 멤버 서비스를 이용하시면 됩니다."
              />
              <FAQItem
                question="비공개 채널/그룹도 가능한가요?"
                answer="네, 초대 링크만 있으면 비공개 채널/그룹에도 서비스가 가능합니다. 주문 시 초대 링크를 입력해 주세요."
              />
              <FAQItem
                question="구독자/멤버가 실제 활동하나요?"
                answer="실제 텔레그램 계정이지만 자동화된 계정이므로 직접적인 채팅 참여는 기대하기 어렵습니다. 채널/그룹의 초기 신뢰도 구축에 효과적입니다."
              />
              <FAQItem
                question="조회수는 어떻게 카운트되나요?"
                answer="텔레그램의 공식 조회수 카운팅 방식과 동일하게 집계됩니다. 게시물별로 개별 주문이 가능하며, 자동 조회수 서비스도 제공합니다."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-sky-950/50 to-sky-900/30 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 break-keep">
            지금 텔레그램 채널을 성장시키세요
          </h2>
          <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto break-keep">
            50,000명 이상의 채널 운영자가 UFLUX와 함께 성장하고 있습니다.
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

