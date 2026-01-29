// ============================================
// Dashboard Widgets (Client Component)
// 대시보드 전역 위젯 (카카오톡 버튼 등)
// ============================================

'use client';

import { KakaoChatButton } from '@/components/kakao-chat-button';

export function DashboardWidgets() {
  return (
    <>
      <KakaoChatButton />
    </>
  );
}

