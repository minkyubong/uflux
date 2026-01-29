// ============================================
// Real-time Order Ticker Component
// 실시간 주문 알림 티커
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, CheckCircle } from 'lucide-react';
import { FaYoutube, FaInstagram, FaTiktok, FaFacebook, FaTelegram, FaTwitter } from 'react-icons/fa';
import { cn } from '@/lib/utils';

// 서비스 타입별 데이터
const serviceTypes = [
  { platform: 'youtube', service: '구독자', icon: FaYoutube, color: '#FF0000', quantities: [100, 500, 1000, 2000, 5000] },
  { platform: 'youtube', service: '조회수', icon: FaYoutube, color: '#FF0000', quantities: [1000, 5000, 10000, 50000] },
  { platform: 'youtube', service: '좋아요', icon: FaYoutube, color: '#FF0000', quantities: [100, 500, 1000, 2000] },
  { platform: 'instagram', service: '팔로워', icon: FaInstagram, color: '#E1306C', quantities: [100, 500, 1000, 5000, 10000] },
  { platform: 'instagram', service: '좋아요', icon: FaInstagram, color: '#E1306C', quantities: [100, 500, 1000, 2000] },
  { platform: 'instagram', service: '릴스 조회수', icon: FaInstagram, color: '#E1306C', quantities: [1000, 5000, 10000, 50000] },
  { platform: 'tiktok', service: '팔로워', icon: FaTiktok, color: '#ffffff', quantities: [100, 500, 1000, 5000] },
  { platform: 'tiktok', service: '좋아요', icon: FaTiktok, color: '#ffffff', quantities: [100, 500, 1000, 2000] },
  { platform: 'tiktok', service: '조회수', icon: FaTiktok, color: '#ffffff', quantities: [1000, 5000, 10000, 50000] },
  { platform: 'facebook', service: '페이지 좋아요', icon: FaFacebook, color: '#1877F2', quantities: [100, 500, 1000] },
  { platform: 'telegram', service: '채널 구독자', icon: FaTelegram, color: '#0088CC', quantities: [100, 500, 1000, 2000] },
  { platform: 'twitter', service: '팔로워', icon: FaTwitter, color: '#1DA1F2', quantities: [100, 500, 1000, 2000] },
];

// 랜덤 닉네임 생성용 단어
const prefixes = [
  '행복한', '빠른', '멋진', '귀여운', '똑똑한', '용감한', '밝은', '즐거운',
  '신나는', '활발한', '따뜻한', '푸른', '하얀', '빨간', '노란', '초록',
  '달콤한', '상큼한', '시원한', '새로운', '특별한', '소중한'
];

const suffixes = [
  '고양이', '강아지', '토끼', '곰돌이', '펭귄', '코알라', '판다', '호랑이',
  '사자', '여우', '늑대', '독수리', '올빼미', '돌고래', '나비', '햄스터',
  '다람쥐', '사슴', '크리에이터', '마케터', '작가', '디자이너', '개발자'
];

// 랜덤 닉네임 생성 (마스킹 처리)
function generateMaskedUsername(): string {
  const useKorean = Math.random() > 0.4; // 60% 확률로 한글

  if (useKorean) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const num = Math.random() > 0.5 ? Math.floor(Math.random() * 99) + 1 : '';
    const fullName = `${prefix}${suffix}${num}`;
    // 마스킹: 첫 2글자만 표시
    return fullName.substring(0, 2) + '***';
  } else {
    // 영문 스타일
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let name = '';
    for (let i = 0; i < 3; i++) {
      name += chars[Math.floor(Math.random() * chars.length)];
    }
    return name + '***';
  }
}

// 주문 인터페이스
interface Order {
  id: string;
  username: string;
  platform: string;
  service: string;
  quantity: number;
  icon: React.ElementType;
  color: string;
  timestamp: Date;
}

// 새 주문 생성
function generateOrder(): Order {
  const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
  const quantity = serviceType.quantities[Math.floor(Math.random() * serviceType.quantities.length)];

  return {
    id: Math.random().toString(36).substr(2, 9),
    username: generateMaskedUsername(),
    platform: serviceType.platform,
    service: serviceType.service,
    quantity,
    icon: serviceType.icon,
    color: serviceType.color,
    timestamp: new Date(),
  };
}

// 수량 포맷
function formatQuantity(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '만';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + '천';
  }
  return num.toLocaleString();
}

// 티커 아이템 컴포넌트
function TickerItem({ order, onComplete }: { order: Order; onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const Icon = order.icon;

  useEffect(() => {
    // 등장 애니메이션
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // 퇴장 시작
    const exitTimer = setTimeout(() => setIsExiting(true), 4500);

    // 완전히 제거
    const removeTimer = setTimeout(() => onComplete(), 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed bottom-6 left-6 z-50 transition-all duration-500 ease-out",
        isVisible && !isExiting ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur-md">
        {/* 아이콘 */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${order.color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: order.color }} />
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-slate-900 dark:text-white">
              {order.username}
            </span>
            <span className="text-slate-500 dark:text-slate-400">님이</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium" style={{ color: order.color }}>
              {order.service}
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatQuantity(order.quantity)}개
            </span>
            <span className="text-slate-500 dark:text-slate-400">주문</span>
          </div>
        </div>

        {/* 완료 배지 */}
        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
          <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          <span className="text-xs font-medium text-green-600 dark:text-green-400">방금</span>
        </div>
      </div>
    </div>
  );
}

// 메인 컴포넌트
export function OrderTicker() {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 주문 완료 핸들러
  const handleOrderComplete = useCallback(() => {
    setCurrentOrder(null);
  }, []);

  // 자동 주문 생성 (8~15초 랜덤 간격)
  useEffect(() => {
    if (!isClient) return;

    // 초기 딜레이 (3~5초 후 첫 주문)
    const initialDelay = 3000 + Math.random() * 2000;

    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 7000; // 8~15초
      return setTimeout(() => {
        setCurrentOrder(generateOrder());
        scheduleNext();
      }, delay);
    };

    const initialTimer = setTimeout(() => {
      setCurrentOrder(generateOrder());
      scheduleNext();
    }, initialDelay);

    return () => clearTimeout(initialTimer);
  }, [isClient]);

  if (!isClient || !currentOrder) return null;

  return <TickerItem order={currentOrder} onComplete={handleOrderComplete} />;
}

