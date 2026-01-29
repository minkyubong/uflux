"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ViewedService {
  id: string;
  name: string;
  platform: string;
  price: number;
  viewedAt: Date;
}

interface PracticeOrder {
  serviceId: string;
  serviceName: string;
  quantity: number;
  link: string;
  totalPrice: number;
  createdAt: Date;
}

interface GuestState {
  // 비회원 모드 상태
  isGuestMode: boolean;
  guestSessionStart: Date | null;

  // 관심 서비스 추적 (전환 유도용)
  viewedServices: ViewedService[];
  favoriteServices: string[];

  // 연습 주문 내역
  practiceOrders: PracticeOrder[];

  // 페이지 방문 기록
  visitedPages: string[];

  // 전환 포인트 추적
  conversionAttempts: number; // 로그인 필요 기능 시도 횟수

  // Actions
  enterGuestMode: () => void;
  exitGuestMode: () => void;

  addViewedService: (service: ViewedService) => void;
  toggleFavorite: (serviceId: string) => void;

  addPracticeOrder: (order: PracticeOrder) => void;
  clearPracticeOrders: () => void;

  addVisitedPage: (page: string) => void;
  incrementConversionAttempt: () => void;

  // 전환율 분석용 데이터
  getEngagementScore: () => number;
  getMostViewedPlatform: () => string | null;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set, get) => ({
      isGuestMode: false,
      guestSessionStart: null,
      viewedServices: [],
      favoriteServices: [],
      practiceOrders: [],
      visitedPages: [],
      conversionAttempts: 0,

      enterGuestMode: () => {
        // 서버 컴포넌트에서 확인할 수 있도록 쿠키 설정
        if (typeof document !== 'undefined') {
          document.cookie = 'uflux_guest_mode=true; path=/; max-age=86400; SameSite=Lax';
        }
        set({
          isGuestMode: true,
          guestSessionStart: new Date(),
          conversionAttempts: 0,
        });
      },

      exitGuestMode: () => {
        // 쿠키 삭제
        if (typeof document !== 'undefined') {
          document.cookie = 'uflux_guest_mode=; path=/; max-age=0';
        }
        set({
          isGuestMode: false,
          guestSessionStart: null,
        });
      },

      addViewedService: (service) => set((state) => {
        // 중복 제거하고 최근 10개만 유지
        const filtered = state.viewedServices.filter(s => s.id !== service.id);
        return {
          viewedServices: [service, ...filtered].slice(0, 10),
        };
      }),

      toggleFavorite: (serviceId) => set((state) => {
        if (state.favoriteServices.includes(serviceId)) {
          return { favoriteServices: state.favoriteServices.filter(id => id !== serviceId) };
        }
        return { favoriteServices: [...state.favoriteServices, serviceId] };
      }),

      addPracticeOrder: (order) => set((state) => ({
        practiceOrders: [order, ...state.practiceOrders].slice(0, 5),
      })),

      clearPracticeOrders: () => set({ practiceOrders: [] }),

      addVisitedPage: (page) => set((state) => {
        if (state.visitedPages.includes(page)) return state;
        return { visitedPages: [...state.visitedPages, page] };
      }),

      incrementConversionAttempt: () => set((state) => ({
        conversionAttempts: state.conversionAttempts + 1,
      })),

      // 참여도 점수 계산 (0-100)
      getEngagementScore: () => {
        const state = get();
        let score = 0;

        // 본 서비스 수 (최대 30점)
        score += Math.min(state.viewedServices.length * 3, 30);

        // 방문 페이지 수 (최대 20점)
        score += Math.min(state.visitedPages.length * 4, 20);

        // 연습 주문 (최대 30점)
        score += Math.min(state.practiceOrders.length * 10, 30);

        // 즐겨찾기 (최대 20점)
        score += Math.min(state.favoriteServices.length * 5, 20);

        return score;
      },

      // 가장 관심있는 플랫폼
      getMostViewedPlatform: () => {
        const state = get();
        if (state.viewedServices.length === 0) return null;

        const platformCounts: Record<string, number> = {};
        state.viewedServices.forEach(s => {
          platformCounts[s.platform] = (platformCounts[s.platform] || 0) + 1;
        });

        let maxPlatform = null;
        let maxCount = 0;
        for (const [platform, count] of Object.entries(platformCounts)) {
          if (count > maxCount) {
            maxCount = count;
            maxPlatform = platform;
          }
        }

        return maxPlatform;
      },
    }),
    {
      name: "uflux-guest-session",
      partialize: (state) => ({
        viewedServices: state.viewedServices,
        favoriteServices: state.favoriteServices,
        practiceOrders: state.practiceOrders,
        visitedPages: state.visitedPages,
      }),
    }
  )
);

