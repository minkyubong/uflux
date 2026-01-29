// ============================================
// Kakao Channel Chat Button
// 카카오톡 상담 플로팅 버튼
// ============================================

'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_xgpUAX';

export function KakaoChatButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {/* Tooltip */}
      <div
        className={cn(
          "absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap",
          "px-3 py-2 bg-[#FEE500] text-[#3C1E1E] text-sm font-medium rounded-lg shadow-lg",
          "transition-all duration-200",
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
        )}
      >
        카카오톡 상담하기
        {/* Arrow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
          <div className="border-8 border-transparent border-l-[#FEE500]" />
        </div>
      </div>

      {/* Button - a 태그로 변경 */}
      <a
        href={KAKAO_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center",
          "bg-[#FEE500] hover:bg-[#FDD835] transition-all duration-200",
          "hover:scale-110 hover:shadow-xl",
          "focus:outline-none focus:ring-2 focus:ring-[#FEE500] focus:ring-offset-2"
        )}
        aria-label="카카오톡 상담"
      >
        {/* Kakao Icon */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="#3C1E1E"
        >
          <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.88 5.31 4.71 6.72l-.97 3.59c-.08.29.24.54.5.38l4.13-2.7c.53.05 1.07.08 1.63.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
        </svg>
      </a>

      {/* Pulse Animation */}
      <span className="absolute inset-0 rounded-full bg-[#FEE500] animate-ping opacity-30 pointer-events-none" />
    </div>
  );
}

// 상단 카카오톡 배너 (옵션)
export function KakaoTopBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce-slow">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#FEE500] text-[#3C1E1E] rounded-full shadow-lg">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E">
          <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.88 5.31 4.71 6.72l-.97 3.59c-.08.29.24.54.5.38l4.13-2.7c.53.05 1.07.08 1.63.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
        </svg>
        <span className="text-sm font-medium">궁금한 점이 있으신가요?</span>
        <a
          href={KAKAO_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-1 bg-[#3C1E1E] text-[#FEE500] text-xs font-bold rounded-full hover:bg-[#2C1010] transition-colors"
        >
          채팅하기
        </a>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-[#3C1E1E]/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

