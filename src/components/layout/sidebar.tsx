'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  History,
  Settings,
  LogOut,
  CreditCard,
  Crown,
  TrendingUp,
  ChevronRight,
  Loader2,
  Receipt,
  Headphones,
  Shield,
  Layers,
  Gift,
  BookOpen,
  Sparkles,
  Home,
  UserPlus,
  Zap,
  Star,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/layout/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import { useGuestStore } from '@/stores/guest-store';
import { toast } from 'sonner';

// 메인 네비게이션
const routes = [
  { label: '홈', icon: Home, href: '/' },
  { label: '대시보드', icon: LayoutDashboard, href: '/dashboard' },
  { label: '새 주문', icon: ShoppingCart, href: '/order' },
  { label: '대량 주문', icon: Layers, href: '/mass-order', badge: '점검중', disabled: true },
  { label: '주문내역', icon: History, href: '/orders' },
  { label: '포인트 충전', icon: CreditCard, href: '/deposit' },
  { label: '잔액 내역', icon: Receipt, href: '/transactions' },
  { label: '친구 추천', icon: Gift, href: '/referral' },
  { label: '고객센터', icon: Headphones, href: '/support' },
  { label: '설정', icon: Settings, href: '/settings' },
];

// 관리자 네비게이션
const adminRoutes = [
  { label: '관리자', icon: Shield, href: '/admin' },
];

// 티어 설정
const tierConfig = {
  basic: { label: '일반', color: 'text-muted-foreground', bg: 'bg-muted' },
  vip: { label: 'VIP', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  premium: { label: '프리미엄', color: 'text-[#00C896]', bg: 'bg-[#00C896]/10 dark:bg-[#00C896]/20' },
  enterprise: { label: '엔터프라이즈', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
};

interface SidebarProps {
  isGuestMode?: boolean;
}

export function Sidebar({ isGuestMode = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const exitGuestMode = useGuestStore((state) => state.exitGuestMode);
  const getEngagementScore = useGuestStore((state) => state.getEngagementScore);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const balance = profile?.balance || 0;
  const tier = tierConfig[profile?.tier as keyof typeof tierConfig] || tierConfig.basic;
  const isAdmin = profile?.is_admin === true;
  const engagementScore = isGuestMode ? getEngagementScore() : 0;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    toast.success('로그아웃 중...');
    await signOut();
  };

  const handleExitGuestMode = () => {
    exitGuestMode();
    router.push('/login');
  };

  return (
    <aside className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo & Theme Toggle */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-border">
        <Logo size="md" linkTo="/dashboard" />
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {/* 처음 오신 분들을 위한 가이드 - 특별 탭 */}
        <Link
          href="/guide"
          className={cn(
            "flex items-center gap-3 px-4 py-4 rounded-xl text-base font-bold transition-all duration-200 mb-3",
            "bg-gradient-to-r from-[#0064FF]/10 to-[#00C896]/10 border border-[#0064FF]/20",
            "hover:from-[#0064FF]/20 hover:to-[#00C896]/20 hover:border-[#0064FF]/30",
            pathname === "/guide"
              ? "from-[#0064FF]/20 to-[#00C896]/20 border-[#0064FF]/40 text-[#0064FF] dark:text-[#4D9FFF]"
              : "text-[#0064FF] dark:text-[#4D9FFF]"
          )}
        >
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#0064FF] to-[#00C896]">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="flex items-center gap-2">
            처음 오신 분들을 위한 가이드
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </span>
        </Link>

        {routes.map((route) => {
          const isActive = pathname === route.href;
          const routeWithBadge = route as typeof route & { badge?: string; disabled?: boolean };

          // 비활성화된 메뉴
          if (routeWithBadge.disabled) {
            return (
              <div
                key={route.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
              >
                <route.icon className="h-5 w-5" />
                {route.label}
                {routeWithBadge.badge && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-500/20 text-orange-500">
                    {routeWithBadge.badge}
                  </span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <route.icon className={cn("h-5 w-5", isActive && "text-primary-foreground")} />
              {route.label}
              {routeWithBadge.badge && (
                <span className={cn(
                  "ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded",
                  isActive ? "bg-white/20 text-white" : "bg-accent text-white"
                )}>
                  {routeWithBadge.badge}
                </span>
              )}
              {isActive && !routeWithBadge.badge && <ChevronRight className="ml-auto h-4 w-4" />}
            </Link>
          );
        })}

        {/* Admin Navigation */}
        {isAdmin && (
          <>
            <Separator className="my-4" />
            {adminRoutes.map((route) => {
              const isActive = pathname.startsWith(route.href);
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <route.icon className="h-5 w-5" />
                  {route.label}
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Balance Card - 회원용 */}
      {!isGuestMode && (
        <div className="p-4">
          <div className="glass-balance text-white rounded-2xl p-5 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border-4 border-white" />
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full border-4 border-white" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  <span className="text-sm font-medium text-white/80">내 잔액</span>
                </div>
                <div className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", tier.bg, tier.color)}>
                  <div className="flex items-center gap-1">
                    {profile?.tier === "vip" && <Crown className="h-3 w-3" />}
                    {tier.label}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold">
                  {formatCurrency(balance)}
                </div>
                <div className="flex items-center gap-1 text-white/60 text-sm mt-1">
                  <TrendingUp className="h-4 w-4" />
                  충전하고 서비스 이용하기
                </div>
              </div>

              <Button
                asChild
                variant="secondary"
                className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Link href="/deposit">
                  <CreditCard className="mr-2 h-4 w-4" />
                  충전하기
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 비회원용 가입 유도 카드 */}
      {isGuestMode && (
        <div className="p-4">
          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white rounded-2xl p-5 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border-4 border-white" />
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full border-4 border-white" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-yellow-200" />
                <span className="text-sm font-bold">지금 가입하면</span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Gift className="h-4 w-4 text-yellow-200" />
                  <span>가입 즉시 <span className="font-bold">1,000P</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-yellow-200" />
                  <span>첫충전 <span className="font-bold">20% 보너스</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-200" />
                  <span>무료 체험 서비스</span>
                </div>
              </div>

              {/* 참여도 표시 */}
              {engagementScore > 0 && (
                <div className="mb-3 bg-white/10 rounded-lg p-2">
                  <div className="text-xs text-white/80 mb-1">둘러보기 진행률</div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-300 rounded-full transition-all"
                      style={{ width: `${Math.min(engagementScore, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-white/60 mt-1">
                    {engagementScore >= 50 ? '충분히 둘러보셨네요!' : '더 둘러보세요!'}
                  </div>
                </div>
              )}

              <Button
                asChild
                variant="secondary"
                className="w-full bg-white hover:bg-white/90 text-orange-600 font-bold border-0"
              >
                <Link href="/login">
                  <UserPlus className="mr-2 h-4 w-4" />
                  30초 만에 가입하기
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Info & Logout - 회원용 */}
      {!isGuestMode && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {profile?.email?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.email || "user@example.com"}</p>
              <p className="text-xs text-muted-foreground">{tier.label} 회원</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* User Info - 비회원용 */}
      {isGuestMode && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span className="text-amber-600 font-semibold">G</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">비회원</p>
              <p className="text-xs text-muted-foreground">둘러보기 모드</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary"
              onClick={handleExitGuestMode}
              title="로그인 페이지로"
            >
              <LogIn className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}

