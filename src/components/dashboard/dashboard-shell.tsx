// ============================================
// Dashboard Shell - 실시간 사용자 데이터 연동
// ============================================

'use client';

import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from './sidebar';
import { MobileHeader } from './mobile-header';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { profile } = useAuth();

  // 사용자 데이터 구성 (로딩 중에도 기본값으로 표시)
  const user = {
    email: profile?.email || '로딩중...',
    balance: Number(profile?.balance) || 0,
    tier: profile?.tier || 'basic',
    isAdmin: profile?.is_admin === true,
  };

  return (
    <>
      {/* Sidebar - Desktop */}
      <Sidebar user={user} />

      {/* Mobile Header */}
      <MobileHeader user={user} />

      {/* Main Content */}
      <main className="lg:pl-72">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </>
  );
}

