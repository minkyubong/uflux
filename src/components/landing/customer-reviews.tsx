// ============================================
// Customer Reviews Auto-Generation Component
// 자동 생성 고객 리뷰 섹션
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// 리뷰 내용 풀 (실제 고객 후기 스타일)
const reviewContents = [
  "여기가 1등임 말그대로 갓성비 ㄹㅇ",
  "관리도 잘해주시고 티도 안나고 최고입니다",
  "가성비 짱이구 거는속도도 빨라서 좋아요",
  "다른데 몇군데 써봤는데 여기가 제일 낫네요",
  "처음엔 반신반의했는데 진짜 잘되네요 ㄷㄷ",
  "고객센터 응대도 친절하고 빠릅니다",
  "3번째 이용중인데 한번도 문제없었어요",
  "친구 추천으로 왔는데 대만족입니다",
  "가격도 착하고 속도도 빠르고 굿굿",
  "수익창출 조건 달성했어요 감사합니다!",
  "인스타 팔로워 확실히 늘었네요 추천",
  "유튜브 조회수 올리는데 딱이에요",
  "틱톡 FYP 노출 확 늘었어요 대박",
  "진짜 자연스럽게 올라가서 좋음",
  "AS도 확실하게 해주셔서 믿음이 가요",
  "다른 업체랑 비교불가 여긴 진짜임",
  "빠른 처리 감사합니다 또 이용할게요",
  "가격 대비 퀄리티 최고입니다",
  "의심했던 제가 바보였네요 ㅋㅋ 잘됨",
  "꾸준히 이용중인데 항상 만족합니다",
  "리필도 잘 해주시고 완전 굿",
  "초보자도 쉽게 이용할 수 있어서 좋아요",
  "주문하고 5분만에 시작되더라구요 빠름",
  "여기 찐이에요 다들 여기 쓰세요",
  "구독자 1000명 달성!! 감사합니다",
  "조회수 터졌어요 ㅠㅠ 감동",
  "팔로워 늘고 광고문의도 들어와요",
  "채널 성장에 확실히 도움됩니다",
  "매번 빠른 처리 감사드려요",
  "이 가격에 이 퀄리티 실화?",
];

// 서비스 타입
const serviceTypes = [
  '유튜브 구독자',
  '유튜브 조회수',
  '유튜브 좋아요',
  '인스타 팔로워',
  '인스타 좋아요',
  '틱톡 팔로워',
  '틱톡 조회수',
  '페이스북 좋아요',
  '텔레그램 구독자',
];

// 랜덤 닉네임 생성용 단어
const adjectives = [
  '행복한', '빠른', '귀여운', '멋진', '똑똑한', '용감한', '착한', '밝은',
  '즐거운', '신나는', '활발한', '조용한', '따뜻한', '시원한', '달콤한',
  '상큼한', '푸른', '하얀', '검은', '빨간', '노란', '초록', '보라',
];

const nouns = [
  '고양이', '강아지', '토끼', '곰돌이', '펭귄', '코알라', '판다', '호랑이',
  '사자', '여우', '늑대', '독수리', '올빼미', '돌고래', '고래', '상어',
  '나비', '벌', '개미', '무당벌레', '햄스터', '다람쥐', '사슴', '기린',
];

// 랜덤 유저 아이디 생성
function generateRandomUsername(): string {
  const useKorean = Math.random() > 0.3; // 70% 확률로 한글

  if (useKorean) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.random() > 0.5 ? Math.floor(Math.random() * 999) + 1 : '';
    return `${adj}${noun}${num}`;
  } else {
    // 영문 스타일
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let name = '';
    for (let i = 0; i < 4 + Math.floor(Math.random() * 4); i++) {
      name += chars[Math.floor(Math.random() * chars.length)];
    }
    const num = Math.floor(Math.random() * 9999) + 1;
    return `${name}${num}`;
  }
}

// 랜덤 시간 생성 (1분 ~ 59분 전)
function generateRandomTime(): string {
  const minutes = Math.floor(Math.random() * 58) + 1;
  return `${minutes}분 전`;
}

// 별점 생성 (4~5점)
function generateRating(): number {
  return Math.random() > 0.3 ? 5 : 4;
}

// 리뷰 인터페이스
interface Review {
  id: string;
  username: string;
  content: string;
  rating: number;
  time: string;
  service: string;
  isNew?: boolean;
}

// 새 리뷰 생성
function generateReview(): Review {
  return {
    id: Math.random().toString(36).substr(2, 9),
    username: generateRandomUsername(),
    content: reviewContents[Math.floor(Math.random() * reviewContents.length)],
    rating: generateRating(),
    time: generateRandomTime(),
    service: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
    isNew: true,
  };
}

// 리뷰 카드 컴포넌트
function ReviewCard({ review, className }: { review: Review; className?: string }) {
  return (
    <div
      className={cn(
        "relative p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm",
        "transition-all duration-500",
        review.isNew && "animate-slide-in-right",
        className
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* 아바타 */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0064FF] to-[#00C896] flex items-center justify-center text-white text-xs font-bold">
            {review.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-white">{review.username}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            </div>
            <div className="flex items-center gap-1 text-xs text-white/40">
              <span>{review.service}</span>
              <span>•</span>
              <Clock className="w-3 h-3" />
              <span>{review.time}</span>
            </div>
          </div>
        </div>
        {/* 별점 */}
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-3.5 h-3.5",
                i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"
              )}
            />
          ))}
        </div>
      </div>

      {/* 리뷰 내용 */}
      <p className="text-sm text-white/80 leading-relaxed">{review.content}</p>
    </div>
  );
}

// 메인 컴포넌트
export function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(15847);

  // 초기 리뷰 생성
  useEffect(() => {
    const initialReviews = Array.from({ length: 6 }, () => ({
      ...generateReview(),
      isNew: false,
    }));
    setReviews(initialReviews);
  }, []);

  // 자동 리뷰 추가 (8~15초 랜덤 간격)
  useEffect(() => {
    const addNewReview = () => {
      const newReview = generateReview();

      setReviews(prev => {
        // 기존 리뷰들의 isNew 플래그 제거
        const updated = prev.map(r => ({ ...r, isNew: false }));
        // 새 리뷰 추가하고 오래된 것 제거
        return [newReview, ...updated].slice(0, 6);
      });

      // 총 리뷰 수 증가
      setTotalReviews(prev => prev + 1);
    };

    // 랜덤 간격으로 새 리뷰 추가
    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 7000; // 8~15초
      return setTimeout(() => {
        addNewReview();
        scheduleNext();
      }, delay);
    };

    const timeoutId = scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0d2840]/30 to-slate-950" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-sm font-medium mb-6">
            <MessageSquare className="w-4 h-4 text-[#00C896]" />
            <span className="text-white/80">실시간 고객 후기</span>
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4D9FFF] to-[#00C896]">
              {totalReviews.toLocaleString()}
            </span>
            명의 고객이 선택했습니다
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            실제 UFLUX를 이용한 고객님들의 생생한 후기입니다
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">4.9</div>
            <div className="flex justify-center gap-0.5 my-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <div className="text-xs text-white/40">평균 평점</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">99.2%</div>
            <div className="text-xs text-white/40 mt-2">고객 만족도</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">24시간</div>
            <div className="text-xs text-white/40 mt-2">평균 응답 시간</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">30일</div>
            <div className="text-xs text-white/40 mt-2">무료 리필 보장</div>
          </div>
        </div>
      </div>

      {/* Custom Animation */}
      <style jsx>{`
        @keyframes slide-in-right {
          0% {
            opacity: 0;
            transform: translateX(20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }
      `}</style>
    </section>
  );
}

