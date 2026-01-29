// ============================================
// Landing Page
// 구매 전환율 극대화 버전 v2.0
// ============================================

'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  TrendingUp,
  Headphones,
  Check,
  Award,
  Play,
  Users,
  Shield,
} from 'lucide-react';
import { FaYoutube, FaInstagram, FaTiktok, FaFacebook } from 'react-icons/fa';
import { CustomerReviews } from '@/components/landing/customer-reviews';
import { OrderTicker } from '@/components/landing/order-ticker';
import { KakaoChatButton } from '@/components/kakao-chat-button';
import { FreeTrialSection } from '@/components/landing/free-trial';
import { PromoBanner } from '@/components/landing/promo-banner';
import { InlineCountdown } from '@/components/landing/countdown-timer';
import { TrustBadgesInline, TrustBadgesSection } from '@/components/landing/trust-badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================
// Logo Component (Lucide + Text)
// ============================================
function Logo({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 48, text: 'text-2xl' },
  };
  const s = sizes[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
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
// Number Formatting Helper
// ============================================
function formatNumberWithCommas(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ============================================
// Animated Counter Hook
// ============================================
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const animateCount = () => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(end * easeOutQuart));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    };

    if (!startOnView) {
      animateCount();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          animateCount();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasStarted, startOnView]);

  return { count, ref };
}

// ============================================
// Modern Gradient Background (토스 스타일)
// ============================================
function GradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 깔끔한 딥 네이비 베이스 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2137] to-[#0a1628]" />

      {/* 블루 글로우 */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] aurora-blob-1" />
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] aurora-blob-2" />
      <div className="absolute bottom-0 left-1/3 w-[700px] h-[400px] aurora-blob-3" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// ============================================
// Hero Section
// ============================================
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      <GradientBackground />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center break-keep">
          {/* 실시간 배지 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-sm font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-white/80">지금 <span className="text-green-400 font-bold">2,431명</span>이 채널을 성장시키고 있습니다</span>
            </div>
            <InlineCountdown />
          </div>

          {/* 메인 헤드라인 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.15] text-white">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4D9FFF] via-[#00C896] to-[#4ECCA3]">
              유튜브 수익 창출,
            </span>
            <span className="block mt-2">이제 더 이상 꿈이 아닙니다</span>
          </h1>

          {/* 서브 헤드라인 */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
            알고리즘이 좋아하는 <span className="text-white font-semibold">고밀도 트래픽</span>으로
            당신의 채널을 안전하고 빠르게 성장시키세요
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="bg-white text-slate-900 hover:bg-white/90 text-lg px-10 h-16 rounded-full font-bold shadow-[0_0_60px_-15px_rgba(255,255,255,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_80px_-15px_rgba(255,255,255,0.5)]"
            >
              <Link href="/login">
                무료로 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              asChild
              className="border border-white/20 bg-white/5 text-white hover:bg-white/10 text-lg px-10 h-16 rounded-full backdrop-blur-sm font-semibold transition-all duration-300 hover:scale-105 hover:border-white/40"
            >
              <Link href="/order">
                <Play className="mr-2 h-5 w-5" />
                가격표 확인하기
              </Link>
            </Button>
          </div>

          {/* 보장 배지 */}
          <TrustBadgesInline />

          {/* 신뢰 배지 */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-sm text-white/40 mb-6">전 세계 크리에이터가 신뢰하는 플랫폼</p>
            <div className="flex justify-center gap-10 items-center">
              <Link href="/services/youtube" className="hover:scale-110 transition-transform group">
                <FaYoutube className="w-8 h-8 text-white/60 group-hover:text-[#FF0000] transition-colors" />
              </Link>
              <Link href="/services/instagram" className="hover:scale-110 transition-transform group">
                <FaInstagram className="w-8 h-8 text-white/60 group-hover:text-[#E1306C] transition-colors" />
              </Link>
              <Link href="/services/tiktok" className="hover:scale-110 transition-transform group">
                <FaTiktok className="w-8 h-8 text-white/60 group-hover:text-white transition-colors" />
              </Link>
              <Link href="/services/facebook" className="hover:scale-110 transition-transform group">
                <FaFacebook className="w-8 h-8 text-white/60 group-hover:text-[#1877F2] transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Stats Section
// ============================================
interface StatItemProps {
  end: number;
  suffix: string;
  label: string;
  prefix: string;
  decimals?: number;
}

function StatCard({ end, suffix, label, prefix, decimals }: StatItemProps) {
  const { count, ref } = useCountUp(end, 2500);
  const displayValue = decimals
    ? (count / 10).toFixed(decimals)
    : formatNumberWithCommas(count);

  return (
    <div ref={ref} className="relative group">
      <Card className="overflow-hidden border-0 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
        <CardContent className="p-4 sm:p-6 text-center">
          <div className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#4D9FFF] to-[#00C896] bg-clip-text text-transparent mb-2 whitespace-nowrap">
            {prefix}{displayValue}{suffix}
          </div>
          <div className="text-white/60 font-medium break-keep">{label}</div>

          <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0064FF] to-[#00C896] rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (count / end) * 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0064FF]/20 to-[#00C896]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
    </div>
  );
}

function StatsSection() {
  const stats: StatItemProps[] = [
    { end: 1000000, suffix: '+', label: '누적 처리 주문', prefix: '' },
    { end: 50000, suffix: '+', label: '활성 사용자', prefix: '' },
    { end: 999, suffix: '%', label: '성공률', prefix: '', decimals: 1 },
    { end: 24, suffix: '/7', label: '무중단 자동화', prefix: '' },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/50 to-slate-950" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-14 break-keep">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-blue-500/30 text-blue-400 bg-blue-500/10">
            <TrendingUp className="w-4 h-4 mr-2" />
            실시간 통계
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            국내 <span className="bg-gradient-to-r from-[#4D9FFF] to-[#00C896] bg-clip-text text-transparent">1위</span> SMM 플랫폼의 저력
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mt-10 text-sm text-white/40">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          지금 이 순간에도 처리 중
        </div>
      </div>
    </section>
  );
}

// ============================================
// Pricing Teaser
// ============================================
function PricingTeaser() {
  const prices = [
    { service: '인스타 좋아요', amount: '100개', price: '10원', icon: FaInstagram, color: 'from-pink-500 to-rose-500', hoverColor: 'group-hover:text-[#E1306C]' },
    { service: '유튜브 조회수', amount: '1,000회', price: '500원', icon: FaYoutube, color: 'from-red-500 to-orange-500', hoverColor: 'group-hover:text-[#FF0000]' },
    { service: '틱톡 팔로워', amount: '100명', price: '150원', icon: FaTiktok, color: 'from-slate-400 to-slate-600', hoverColor: 'group-hover:text-white' },
    { service: '유튜브 구독자', amount: '100명', price: '3,000원', icon: FaYoutube, color: 'from-red-600 to-red-400', hoverColor: 'group-hover:text-[#FF0000]' },
  ];

  return (
    <section className="py-24 bg-slate-900/50 border-y border-white/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14 break-keep">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            업계 최저가, 거품 없는 도매 가격
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            중간 마진 없이 원가 그대로 제공합니다
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {prices.map((item, i) => (
            <div
              key={i}
              className="relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center text-center group hover:scale-105 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Gradient Glow */}
              <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br', item.color)} />

              <item.icon
                className={cn('w-8 h-8 text-white/60 group-hover:scale-110 transition-all duration-300 mb-3', item.hoverColor)}
              />
              <div className="text-sm font-medium text-white/60 mb-2 break-keep">{item.service}</div>
              <div className="text-2xl font-bold text-white mb-1">{item.amount}</div>
              <div className="text-xs text-white/40">단돈</div>
              <div className={cn('text-3xl font-black bg-gradient-to-r bg-clip-text text-transparent', item.color)}>
                {item.price}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-[#0064FF] to-[#00C896] hover:from-[#0052D4] hover:to-[#00B085] text-white rounded-full px-8 h-14 font-semibold transition-all duration-300 hover:scale-105"
          >
            <Link href="/order">
              전체 가격표 보기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-xs text-white/30 mt-4">* 가격은 환율 및 서버 상태에 따라 소폭 변동될 수 있습니다</p>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Features Section
// ============================================
function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: '24시간 자동화',
      description: '주문 즉시 처리가 시작됩니다. 잠든 사이에도 쉬지 않는 무중단 자동화 시스템.',
      color: 'from-amber-500 to-orange-500',
      benefits: ['주문 후 5분 내 시작', 'API 연동 지원', '실시간 진행 상황 확인'],
    },
    {
      icon: Shield,
      title: '100% 안전 보장',
      description: '플랫폼 정책을 준수하는 안전한 방식. 계정 보호가 최우선입니다.',
      color: 'from-emerald-500 to-teal-500',
      benefits: ['자연스러운 유입 패턴', '계정 제재 無', '비밀번호 불필요'],
    },
    {
      icon: Headphones,
      title: '완벽 A/S',
      description: '문제 발생 시 전액 환불 또는 100% 재처리. 고객 만족이 우리의 기준입니다.',
      color: 'from-blue-500 to-indigo-500',
      benefits: ['30일 무료 리필', '전액 환불 보장', '카카오톡 1:1 상담'],
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-blue-950/30" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 break-keep">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-[#00C896]/30 text-[#00C896] bg-[#00C896]/10">
            <Award className="w-4 h-4 mr-2" />
            왜 UFLUX인가요?
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            성공하는 크리에이터의 <span className="bg-gradient-to-r from-[#4D9FFF] to-[#00C896] bg-clip-text text-transparent">비밀 무기</span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            10년 이상의 노하우로 최고의 품질과 서비스를 약속드립니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-0 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-500"
            >
              <div className={cn('h-1 bg-gradient-to-r', feature.color)} />

              <CardContent className="p-8">
                <div className={cn(
                  'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3',
                  feature.color
                )}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 break-keep">{feature.title}</h3>
                <p className="text-white/60 mb-6 leading-relaxed break-keep">{feature.description}</p>

                <ul className="space-y-3">
                  {feature.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <div className={cn('w-5 h-5 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0', feature.color)}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-white/80 break-keep">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <div className={cn(
                'absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 bg-gradient-to-br',
                feature.color
              )} />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// CTA Section
// ============================================
function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2840] to-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center break-keep">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-sm font-medium mb-8">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-white/80">이미 <span className="text-blue-400 font-bold">50,000+</span> 크리에이터가 선택했습니다</span>
        </div>

        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
          경쟁자는 이미 시작했습니다
        </h2>
        <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
          지금 이 순간에도 수천 개의 채널이 성장하고 있습니다. 더 이상 망설이지 마세요.
        </p>

        <div className="flex flex-col items-center gap-6">
          <Button
            size="lg"
            asChild
            className="bg-white text-slate-900 text-xl px-14 h-20 rounded-full font-bold hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-[0_0_80px_-20px_rgba(255,255,255,0.4)]"
          >
            <Link href="/login">
              지금 바로 시작하기
              <ArrowRight className="ml-3 h-6 w-6" />
            </Link>
          </Button>
          <p className="text-sm text-white/40 flex items-center gap-4">
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-400" /> 가입 30초</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-400" /> 카드 불필요</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-400" /> 즉시 환불</span>
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Footer (전자상거래법 필수 표기사항 포함)
// ============================================
const companyInfo = {
  name: "리치엔에비뉴",
  ceo: "봉민규",
  businessNumber: "420-50-00984",
  salesRegistration: "신고 준비중",
  address: "서울특별시 도봉구 도봉로 133길 41, 5층",
  email: "support@UFLUX-lab.com",
};

function Footer() {
  return (
    <footer className="py-12 bg-slate-950 border-t border-white/5">
      <div className="container mx-auto px-4">
        {/* 상단 링크 영역 */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <Logo size="md" />

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/40">
            <Link href="/services/youtube" className="hover:text-white/80 transition-colors">유튜브</Link>
            <Link href="/services/instagram" className="hover:text-white/80 transition-colors">인스타그램</Link>
            <Link href="/services/tiktok" className="hover:text-white/80 transition-colors">틱톡</Link>
            <Link href="/blog" className="hover:text-white/80 transition-colors">인사이트</Link>
            <Link href="/terms" className="hover:text-white/80 transition-colors">이용약관</Link>
            <Link href="/privacy" className="hover:text-white/80 transition-colors">개인정보처리방침</Link>
          </div>
        </div>

        {/* 법적 정보 (전자상거래법 필수 표기사항) */}
        <div className="border-t border-white/5 pt-6">
          <div className="text-xs text-white/30 text-center md:text-left space-y-1">
            <p>
              상호: {companyInfo.name} | 대표: {companyInfo.ceo} | 사업자등록번호: {companyInfo.businessNumber}
            </p>
            <p>
              통신판매업신고: {companyInfo.salesRegistration} | 주소: {companyInfo.address}
            </p>
            <p>
              이메일: {companyInfo.email} | 운영시간: 평일 10:00 - 18:00
            </p>
            <p className="pt-3 text-white/20">
              &copy; {new Date().getFullYear()} {companyInfo.name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// Main Landing Page
// ============================================
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-slate-950">
      {/* Global Styles */}
      <style jsx global>{`
        @keyframes aurora-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(30px, -50px) rotate(5deg) scale(1.1); }
          66% { transform: translate(-20px, 20px) rotate(-5deg) scale(0.9); }
        }
        @keyframes aurora-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(-40px, 30px) rotate(-5deg) scale(1.05); }
          66% { transform: translate(50px, -40px) rotate(5deg) scale(0.95); }
        }
        @keyframes aurora-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.1); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .aurora-blob-1 {
          background: radial-gradient(ellipse at center, rgba(0, 100, 255, 0.2) 0%, transparent 70%);
          animation: aurora-1 15s ease-in-out infinite;
        }
        .aurora-blob-2 {
          background: radial-gradient(ellipse at center, rgba(0, 200, 150, 0.15) 0%, transparent 70%);
          animation: aurora-2 20s ease-in-out infinite;
        }
        .aurora-blob-3 {
          background: radial-gradient(ellipse at center, rgba(77, 159, 255, 0.12) 0%, transparent 70%);
          animation: aurora-3 18s ease-in-out infinite;
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Logo size="md" />
            </Link>

            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="hidden sm:inline-flex text-white/70 hover:text-white hover:bg-white/10">
                <Link href="/blog">인사이트</Link>
              </Button>
              <Button variant="ghost" asChild className="hidden sm:inline-flex text-white/70 hover:text-white hover:bg-white/10">
                <Link href="/login">로그인</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-[#0064FF] to-[#00C896] hover:from-[#0052D4] hover:to-[#00B085] text-white rounded-full transition-all duration-300 hover:scale-105"
              >
                <Link href="/login">
                  시작하기
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sections */}
      <HeroSection />
      <StatsSection />
      <TrustBadgesSection />
      <PricingTeaser />
      <FreeTrialSection />
      <CustomerReviews />
      <section id="features">
        <FeaturesSection />
      </section>
      <CTASection />
      <Footer />

      {/* Real-time Order Ticker */}
      <OrderTicker />

      {/* Promotional Banner */}
      <PromoBanner />

      {/* Kakao Chat Button */}
      <KakaoChatButton />
    </div>
  );
}

