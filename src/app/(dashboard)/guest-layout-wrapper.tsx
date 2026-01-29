"use client";

import { useEffect } from "react";
import { GuestBanner } from "@/components/guest/guest-banner";
import { LiveOrderTicker } from "@/components/guest/live-order-ticker";
import { useGuestStore } from "@/stores/guest-store";

interface GuestLayoutWrapperProps {
  children: React.ReactNode;
}

export function GuestLayoutWrapper({ children }: GuestLayoutWrapperProps) {
  const addVisitedPage = useGuestStore((state) => state.addVisitedPage);

  // 페이지 방문 추적
  useEffect(() => {
    if (typeof window !== "undefined") {
      addVisitedPage(window.location.pathname);
    }
  }, [addVisitedPage]);

  return (
    <>
      {/* 상단 비회원 배너 */}
      <GuestBanner />

      {/* 실시간 주문 티커 - Social Proof */}
      <LiveOrderTicker position="bottom-left" />

      {/* 페이지 내용 */}
      {children}
    </>
  );
}

