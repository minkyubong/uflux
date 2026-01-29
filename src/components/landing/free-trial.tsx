// ============================================
// Free Trial Service Section
// 무료 체험 서비스 섹션
// ============================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gift, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { FaYoutube, FaInstagram, FaTiktok } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// 무료 체험 서비스 목록
const freeTrialServices = [
  {
    platform: 'Instagram',
    icon: FaInstagram,
    color: '#E1306C',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-orange-500',
    service: '좋아요',
    amount: 50,
    unit: '개',
    description: '게시물 1개에 무료 좋아요 제공',
    features: ['즉시 시작', '실제 계정', '안전 보장'],
  },
  {
    platform: 'YouTube',
    icon: FaYoutube,
    color: '#FF0000',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-red-600',
    service: '조회수',
    amount: 100,
    unit: '회',
    description: '영상 1개에 무료 조회수 제공',
    features: ['즉시 시작', '실제 조회', '유지 보장'],
  },
  {
    platform: 'TikTok',
    icon: FaTiktok,
    color: '#ffffff',
    gradientFrom: 'from-slate-600',
    gradientTo: 'to-slate-800',
    service: '좋아요',
    amount: 50,
    unit: '개',
    description: '영상 1개에 무료 좋아요 제공',
    features: ['즉시 시작', '실제 계정', '안전 보장'],
  },
];

export function FreeTrialSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950" />

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#00C896]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#0064FF]/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <Badge
            variant="outline"
            className="mb-4 px-4 py-1.5 text-sm border-[#00C896]/30 text-[#00C896] bg-[#00C896]/10 animate-pulse"
          >
            <Gift className="w-4 h-4 mr-2" />
            신규 회원 한정
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 break-keep">
            지금 가입하면{' '}
            <span className="bg-gradient-to-r from-[#00C896] to-[#4D9FFF] bg-clip-text text-transparent">
              무료 체험
            </span>
            {' '}증정
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto break-keep">
            서비스 품질을 직접 확인하세요. 가입 즉시 무료로 체험할 수 있습니다.
          </p>
        </div>

        {/* Trial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {freeTrialServices.map((item, index) => (
            <div
              key={index}
              className={cn(
                "relative group rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-300",
                hoveredIndex === index && "bg-white/10 scale-[1.02] border-white/20"
              )}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Glow Effect */}
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br",
                  item.gradientFrom,
                  item.gradientTo
                )}
              />

              {/* Free Badge */}
              <div className="absolute -top-3 -right-3">
                <Badge className="bg-[#00C896] text-white border-0 px-3 py-1 shadow-lg shadow-[#00C896]/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  무료
                </Badge>
              </div>

              {/* Icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${item.color}20` }}
              >
                <item.icon
                  className="w-7 h-7"
                  style={{ color: item.color }}
                />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-1">
                {item.platform} {item.service}
              </h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className={cn(
                  "text-3xl font-black bg-gradient-to-r bg-clip-text text-transparent",
                  item.gradientFrom,
                  item.gradientTo
                )}>
                  {item.amount.toLocaleString()}
                </span>
                <span className="text-white/60">{item.unit}</span>
              </div>
              <p className="text-sm text-white/50 mb-4">
                {item.description}
              </p>

              {/* Features */}
              <div className="space-y-2">
                {item.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="w-4 h-4 text-[#00C896]" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-[#00C896] to-[#0064FF] hover:from-[#00B085] hover:to-[#0052D4] text-white rounded-full px-8 py-6 text-lg shadow-lg shadow-[#00C896]/20 transition-all duration-300 hover:scale-105"
          >
            <Link href="/login">
              지금 무료 체험 받기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-white/40 text-sm mt-4">
            회원가입 후 마이페이지에서 무료 체험을 신청할 수 있습니다
          </p>
        </div>
      </div>
    </section>
  );
}

