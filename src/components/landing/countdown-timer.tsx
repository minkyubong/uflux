// ============================================
// Countdown Timer Component
// 할인 이벤트 카운트다운 타이머
// ============================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Clock, Zap, ArrowRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

// 남은 시간 계산 (오늘 자정까지)
function calculateTimeLeft(): TimeLeft {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 999);

  const difference = midnight.getTime() - now.getTime();

  if (difference <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

// 숫자 패딩
function padNumber(num: number): string {
  return num.toString().padStart(2, '0');
}

// 타이머 숫자 박스
function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
          <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">
            {padNumber(value)}
          </span>
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-[#00C896]/20 blur-lg rounded-lg -z-10" />
      </div>
      <span className="text-xs text-white/60 mt-1.5">{label}</span>
    </div>
  );
}

// 구분자
function TimeSeparator() {
  return (
    <div className="flex flex-col items-center justify-center h-14 sm:h-16">
      <span className="text-2xl font-bold text-white/60">:</span>
    </div>
  );
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isClient) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600/20 via-orange-500/20 to-yellow-500/20 border border-red-500/30 p-6">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-orange-500/10 to-yellow-500/10 animate-pulse" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Content */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
            <Flame className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded animate-pulse">
                오늘만
              </span>
              <span className="text-white font-bold text-lg">한정 특가</span>
            </div>
            <p className="text-white/60 text-sm">
              전 서비스 <span className="text-yellow-400 font-bold">최대 30% 할인</span> 중!
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <TimeBox value={timeLeft.hours} label="시간" />
          <TimeSeparator />
          <TimeBox value={timeLeft.minutes} label="분" />
          <TimeSeparator />
          <TimeBox value={timeLeft.seconds} label="초" />
        </div>

        {/* CTA */}
        <Button
          asChild
          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full px-6 shadow-lg shadow-red-500/30"
        >
          <Link href="/login">
            <Zap className="w-4 h-4 mr-2" />
            지금 구매
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Hero 섹션 내 인라인 카운트다운
export function InlineCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isClient) return null;

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
      <Clock className="w-4 h-4 text-red-400" />
      <span className="text-white/80 text-sm">할인 종료까지</span>
      <span className="font-mono font-bold text-red-400">
        {padNumber(timeLeft.hours)}:{padNumber(timeLeft.minutes)}:{padNumber(timeLeft.seconds)}
      </span>
    </div>
  );
}

