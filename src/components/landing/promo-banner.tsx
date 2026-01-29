// ============================================
// Promotional Banner Component
// 첫충전 20% 보너스 + 회원가입 1,000P 이벤트 배너
// ============================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Gift, Sparkles, ArrowRight, Coins, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // 2초 후에 배너 표시
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 w-[340px] transition-all duration-300 ease-out",
        isClosing ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
      )}
    >
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0064FF] via-[#0052D4] to-[#00C896]" />

        {/* Animated Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shine_3s_ease-in-out_infinite]" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          aria-label="닫기"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="relative p-5">
          {/* Top Badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              신규 회원 한정
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#00C896]/30 text-[#7FFFD4] text-xs font-medium animate-pulse">
              진행중
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-3 mb-4">
            {/* 첫충전 보너스 */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10">
              <div className="w-10 h-10 rounded-lg bg-yellow-400/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">첫 충전 보너스</div>
                <div className="text-white/80 text-xs">충전금의 <span className="text-yellow-400 font-bold">20%</span> 추가 지급</div>
              </div>
            </div>

            {/* 회원가입 포인트 */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10">
              <div className="w-10 h-10 rounded-lg bg-[#00C896]/20 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-[#00C896]" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">회원가입 혜택</div>
                <div className="text-white/80 text-xs">가입 즉시 <span className="text-[#00C896] font-bold">1,000P</span> 지급</div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            asChild
            className="w-full bg-white text-[#0064FF] hover:bg-white/90 font-bold rounded-xl"
          >
            <Link href="/login">
              <Gift className="w-4 h-4 mr-2" />
              지금 혜택 받기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Keyframes for shine animation */}
      <style jsx global>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          50%, 100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// 상단 고정 띠배너 (옵션)
export function TopPromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-[#0064FF] via-[#0052D4] to-[#00C896] text-white py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="font-medium">
              첫 충전 <span className="text-yellow-400 font-bold">20% 보너스</span> +
              회원가입 <span className="text-[#7FFFD4] font-bold">1,000P</span> 지급
            </span>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-medium transition-colors"
          >
            혜택 받기
            <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={() => setIsVisible(false)}
            className="absolute right-4 p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

