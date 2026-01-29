'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  LayoutDashboard,
  ShoppingCart,
  History,
  CreditCard,
  Settings,
  LogOut,
  Wallet,
  Crown,
  Zap,
  Loader2,
  BookOpen,
  Sparkles,
  Home,
  Layers,
  Receipt,
  Gift,
  Headphones,
  Shield,
  UserPlus,
  Star,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useGuestStore } from '@/stores/guest-store';
import { toast } from 'sonner';

const navigation = [
  { name: '홈', href: '/', icon: Home },
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '새 주문', href: '/order', icon: ShoppingCart },
  { name: '대량 주문', href: '/mass-order', icon: Layers, badge: '점검중', disabled: true },
  { name: '주문내역', href: '/orders', icon: History },
  { name: '포인트 충전', href: '/deposit', icon: CreditCard },
  { name: '무료 체험', href: '/free-trial', icon: Sparkles, badge: 'FREE' },
  { name: '잔액 내역', href: '/transactions', icon: Receipt },
  { name: '친구 추천', href: '/referral', icon: Gift },
  { name: '고객센터', href: '/support', icon: Headphones },
  { name: '설정', href: '/settings', icon: Settings },
];

const adminNavigation = [
  { name: '관리자', href: '/admin', icon: Shield },
];

const tierConfig = {
  basic: { label: '일반', color: 'text-muted-foreground', bg: 'bg-muted' },
  vip: { label: 'VIP', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  premium: { label: '프리미엄', color: 'text-[#00C896]', bg: 'bg-[#00C896]/10 dark:bg-[#00C896]/20' },
  enterprise: { label: '엔터프라이즈', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
};

interface MobileNavProps {
  isGuestMode?: boolean;
}

export function MobileNav({ isGuestMode = false }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { profile, signOut } = useAuth();
  const exitGuestMode = useGuestStore((state) => state.exitGuestMode);
  const getEngagementScore = useGuestStore((state) => state.getEngagementScore);

  const tier = tierConfig[profile?.tier as keyof typeof tierConfig] || tierConfig.basic;
  const isAdmin = profile?.is_admin === true;
  const engagementScore = isGuestMode ? getEngagementScore() : 0;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setOpen(false);
    toast.success('로그아웃 중...');
    await signOut();
  };

  const handleExitGuestMode = () => {
    exitGuestMode();
    setOpen(false);
    router.push('/login');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetTitle className="sr-only">메뉴</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
              <Zap className="w-7 h-7 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#0064FF] to-[#00C896] bg-clip-text text-transparent">
                UFLUX
              </span>
            </Link>
          </div>

          {/* Balance Card - 회원용 */}
          {!isGuestMode && (
            <div className="p-4">
              <div className="glass-balance text-white rounded-2xl p-4 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span className="text-sm text-white/80">내 잔액</span>
                  </div>
                  <div className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", tier.bg, tier.color)}>
                    <div className="flex items-center gap-1">
                      {profile?.tier === "vip" && <Crown className="h-3 w-3" />}
                      {tier.label}
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(profile?.balance || 0)}
                </div>
              </div>
            </div>
          )}

          {/* 비회원용 가입 유도 카드 */}
          {isGuestMode && (
            <div className="p-4">
              <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white rounded-2xl p-4 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-yellow-200" />
                  <span className="text-sm font-bold">지금 가입하면</span>
                </div>
                <div className="space-y-1.5 mb-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Gift className="h-3.5 w-3.5 text-yellow-200" />
                    <span>가입 즉시 <span className="font-bold">1,000P</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-yellow-200" />
                    <span>첫충전 <span className="font-bold">20% 보너스</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-yellow-200" />
                    <span>무료 체험 서비스</span>
                  </div>
                </div>
                {engagementScore > 0 && (
                  <div className="bg-white/10 rounded-lg p-2 mb-3">
                    <div className="text-xs text-white/80 mb-1">둘러보기 진행률</div>
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-300 rounded-full"
                        style={{ width: `${Math.min(engagementScore, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full bg-white hover:bg-white/90 text-orange-600 font-bold border-0"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    30초 만에 가입하기
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 overflow-y-auto">
            {/* 처음 오신 분들을 위한 가이드 - 특별 탭 */}
            <Link
              href="/guide"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-4 rounded-xl text-base font-bold transition-all duration-200 mb-3",
                "bg-gradient-to-r from-[#0064FF]/10 to-[#00C896]/10 border border-[#0064FF]/20",
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

            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const navItem = item as typeof item & { badge?: string; disabled?: boolean };

              if (navItem.disabled) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium text-muted-foreground/50 cursor-not-allowed mb-1"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                    {navItem.badge && (
                      <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-500/20 text-orange-500">
                        {navItem.badge}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 mb-1",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                  {navItem.badge && (
                    <span className={cn(
                      "ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded",
                      isActive ? "bg-white/20 text-white" : "bg-accent text-white"
                    )}>
                      {navItem.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Admin Navigation */}
            {isAdmin && (
              <>
                <Separator className="my-3" />
                {adminNavigation.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 mb-1",
                        isActive
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* User Info & Logout - 회원용 */}
          {!isGuestMode && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">
                    {profile?.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{profile?.email || "user@example.com"}</p>
                  <p className="text-sm text-muted-foreground">{tier.label} 회원</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                로그아웃
              </Button>
            </div>
          )}

          {/* User Info - 비회원용 */}
          {isGuestMode && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <span className="text-amber-600 font-semibold text-lg">G</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">비회원</p>
                  <p className="text-sm text-muted-foreground">둘러보기 모드</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full text-primary hover:text-primary hover:bg-primary/10"
                onClick={handleExitGuestMode}
              >
                <LogIn className="mr-2 h-4 w-4" />
                로그인 / 회원가입
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

