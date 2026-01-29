"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // 첫 렌더링에서는 프로그레스바 표시 안함
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // 페이지 변경 시작 (비동기로 처리하여 cascading renders 방지)
    const timer0 = setTimeout(() => {
      setLoading(true);
      setProgress(0);
    }, 0);

    // Progress 애니메이션
    const timer1 = setTimeout(() => setProgress(30), 100);
    const timer2 = setTimeout(() => setProgress(60), 200);
    const timer3 = setTimeout(() => setProgress(80), 300);
    const timer4 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }, 400);

    return () => {
      clearTimeout(timer0);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1">
      <div
        className={cn(
          "h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-300 ease-out",
          progress === 100 && "opacity-0"
        )}
        style={{ width: `${progress}%` }}
      />
      {/* Glow effect */}
      <div
        className={cn(
          "absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-primary/50 to-transparent blur-sm transition-all duration-300",
          progress === 100 && "opacity-0"
        )}
        style={{ transform: `translateX(${progress - 100}%)` }}
      />
    </div>
  );
}

