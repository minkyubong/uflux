"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Gift, Clock, Sparkles, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuestStore } from "@/stores/guest-store";

// 전환율 요소들:
// 1. FOMO - 카운트다운 타이머 (한정 혜택)
// 2. Social Proof - 오늘 가입자 수
// 3. Loss Aversion - 놓치면 손해라는 메시지
// 4. Immediacy - 지금 바로 받을 수 있는 혜택

export function GuestBanner() {
  const isGuestMode = useGuestStore((state) => state.isGuestMode);
  const [isVisible, setIsVisible] = useState(true);
  const [todaySignups, setTodaySignups] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // 오늘 가입자 수 시뮬레이션 (시간대별로 증가)
  useEffect(() => {
    const hour = new Date().getHours();
    // 시간대별 기본값 + 랜덤 변동
    const baseSignups = Math.floor(hour * 4.5) + 20;
    const randomVariation = Math.floor(Math.random() * 15);
    setTodaySignups(baseSignups + randomVariation);

    // 30초마다 1-3명 증가
    const interval = setInterval(() => {
      setTodaySignups(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // 자정까지 남은 시간 (오늘 혜택 마감)
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isGuestMode || !isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-primary to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* 왼쪽: 메인 메시지 */}
          <div className="flex items-center gap-4 flex-1">
            <div className="hidden sm:flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">비회원 모드</span>
            </div>

            <div className="flex items-center gap-3">
              {/* 혜택 강조 */}
              <div className="flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-bold">
                  지금 가입하면 <span className="text-yellow-300">1,000P + 첫충전 20%</span> 보너스!
                </span>
              </div>

              {/* 타이머 - FOMO */}
              <div className="hidden md:flex items-center gap-1.5 bg-black/20 rounded-lg px-2.5 py-1">
                <Clock className="h-3.5 w-3.5 text-yellow-300" />
                <span className="text-xs font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}:
                  {String(timeLeft.minutes).padStart(2, '0')}:
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-xs text-white/80">남음</span>
              </div>

              {/* 오늘 가입자 수 - Social Proof */}
              <div className="hidden lg:flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-green-300" />
                <span className="text-xs">
                  오늘 <span className="font-bold text-green-300">{todaySignups}명</span> 가입
                </span>
              </div>
            </div>
          </div>

          {/* 오른쪽: CTA 버튼 */}
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button
                size="sm"
                className="bg-white text-primary hover:bg-white/90 font-semibold shadow-md"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                무료 가입하기
              </Button>
            </Link>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="배너 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

