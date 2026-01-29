// ============================================
// Dashboard Layout
// 서버사이드 인증 + 사이드바 + 헤더
// 비회원 모드 지원 (쿠키 기반)
// ============================================

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ClientSidebar } from './client-sidebar';
import { MobileNav } from './mobile-nav';
import { GuestLayoutWrapper } from './guest-layout-wrapper';
import { DashboardWidgets } from './dashboard-widgets';
import { User, Bell, UserCircle } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 비회원 모드 확인 (쿠키)
  const cookieStore = await cookies();
  const isGuestMode = cookieStore.get('UFLUX_guest_mode')?.value === 'true';

  // 로그인도 안 되어있고 비회원 모드도 아니면 로그인 페이지로
  if (!user && !isGuestMode) {
    redirect('/login');
  }

  // 비회원 모드 컨텐츠
  const content = (
    <div className="flex h-full min-h-screen bg-background">
      {/* PC 사이드바 */}
      <div className={`hidden h-full md:flex md:w-72 md:flex-col md:fixed z-[80] ${isGuestMode ? 'md:top-12 md:bottom-0' : 'md:inset-y-0'}`}>
        <Suspense fallback={<SidebarSkeleton />}>
          <ClientSidebar isGuestMode={isGuestMode} />
        </Suspense>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="md:pl-72 flex-1 h-full relative min-w-0 overflow-x-hidden">
        {/* 상단 헤더 */}
        <header className={`h-16 border-b border-border flex items-center px-4 md:px-6 bg-background sticky z-40 ${isGuestMode ? 'top-12' : 'top-0'}`}>
          {/* 모바일 네비게이션 */}
          <div className="md:hidden">
            <Suspense fallback={null}>
              <MobileNav isGuestMode={isGuestMode} />
            </Suspense>
          </div>

          {/* 모바일 로고 */}
          <span className="font-bold text-xl md:hidden bg-gradient-to-r from-[#0064FF] to-[#00C896] bg-clip-text text-transparent ml-3">
            UFLUX
          </span>

          {/* 우측 영역 */}
          <div className="ml-auto flex items-center gap-3">
            {/* 알림 - 비회원은 숨김 */}
            {!isGuestMode && (
              <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
              </button>
            )}

            {/* 사용자 정보 */}
            {isGuestMode ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-sm border border-amber-500/30">
                <UserCircle className="w-4 h-4 text-amber-600" />
                <span className="text-amber-700 font-medium">비회원 모드</span>
              </div>
            ) : user ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-sm">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-muted-foreground truncate max-w-[150px]">
                  {user.email}
                </span>
              </div>
            ) : null}
          </div>
        </header>

        {/* 페이지 내용 */}
        <div className="p-4 pt-6 md:p-6 md:pt-8 lg:p-8 lg:pt-8 min-w-0">
          {children}
        </div>

        {/* 전역 위젯 (카카오톡 버튼 등) */}
        <DashboardWidgets />
      </main>
    </div>
  );

  // 비회원 모드일 때만 GuestLayoutWrapper로 감싸기
  if (isGuestMode) {
    return <GuestLayoutWrapper>{content}</GuestLayoutWrapper>;
  }

  return content;
}

// 사이드바 로딩 스켈레톤
function SidebarSkeleton() {
  return (
    <aside className="flex flex-col h-full bg-card border-r border-border animate-pulse">
      <div className="h-16 px-6 border-b border-border flex items-center">
        <div className="h-8 w-32 bg-muted rounded" />
      </div>
      <div className="flex-1 p-4 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="p-4">
        <div className="h-40 bg-muted rounded-2xl" />
      </div>
    </aside>
  );
}

