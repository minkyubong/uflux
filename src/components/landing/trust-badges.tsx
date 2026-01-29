// ============================================
// Trust Badges Component
// 90일 AS 보장, 한국인 실계정 등 신뢰 배지
// ============================================

'use client';

import { Shield, Users, Clock, Award, CheckCircle, Zap, HeadphonesIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustBadge {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const trustBadges: TrustBadge[] = [
  {
    icon: Shield,
    title: '90일 AS 보장',
    description: '이탈 발생 시 무료 재충전',
    color: 'text-[#00C896]',
    bgColor: 'bg-[#00C896]/10',
  },
  {
    icon: Users,
    title: '한국인 실계정',
    description: '실제 활동 중인 계정만 사용',
    color: 'text-[#0064FF]',
    bgColor: 'bg-[#0064FF]/10',
  },
  {
    icon: Zap,
    title: '즉시 시작',
    description: '결제 후 5분 내 작업 시작',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: HeadphonesIcon,
    title: '24시간 상담',
    description: '언제든 빠른 응대',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
];

// 컴팩트한 인라인 배지 (Hero 섹션용)
export function TrustBadgesInline() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
      {trustBadges.slice(0, 3).map((badge, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm",
            "hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          )}
        >
          <badge.icon className={cn("w-4 h-4", badge.color)} />
          <span className="text-sm text-white/80 font-medium">{badge.title}</span>
        </div>
      ))}
    </div>
  );
}

// 전체 배지 섹션
export function TrustBadgesSection() {
  return (
    <section className="py-16 bg-slate-900/50 border-y border-white/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-white mb-2">
            믿을 수 있는 서비스
          </h3>
          <p className="text-white/50">
            UFLUX만의 차별화된 보장 서비스
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {trustBadges.map((badge, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              {/* Icon */}
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", badge.bgColor)}>
                <badge.icon className={cn("w-6 h-6", badge.color)} />
              </div>

              {/* Content */}
              <h4 className="text-white font-bold mb-1">{badge.title}</h4>
              <p className="text-white/50 text-sm">{badge.description}</p>

              {/* Checkmark */}
              <div className="absolute top-4 right-4">
                <CheckCircle className="w-5 h-5 text-[#00C896]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA 옆에 들어가는 미니 배지
export function MiniTrustBadges() {
  const miniBadges = [
    { icon: Shield, text: '90일 보장' },
    { icon: Users, text: '실계정 100%' },
    { icon: Clock, text: '즉시 시작' },
  ];

  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      {miniBadges.map((badge, index) => (
        <div key={index} className="flex items-center gap-1.5 text-white/60">
          <badge.icon className="w-3.5 h-3.5 text-[#00C896]" />
          <span className="text-xs">{badge.text}</span>
        </div>
      ))}
    </div>
  );
}

