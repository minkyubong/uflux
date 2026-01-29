"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  CreditCard,
  HelpCircle,
  Settings,
  LogOut,
  ChevronRight,
  Wallet,
  Crown,
  TrendingUp,
  BookOpen,
  Sparkles,
  Layers,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";

interface SidebarProps {
  user?: {
    email: string;
    balance: number;
    tier: string;
    isAdmin?: boolean;
  };
}

const navigation = [
  {
    name: "대시보드",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "새 주문",
    href: "/order",
    icon: ShoppingCart,
  },
  {
    name: "대량 주문",
    href: "/mass-order",
    icon: Layers,
    badge: "점검중",
    disabled: true,
  },
  {
    name: "주문 내역",
    href: "/orders",
    icon: History,
  },
  {
    name: "충전하기",
    href: "/deposit",
    icon: CreditCard,
  },
  {
    name: "무료 체험",
    href: "/free-trial",
    icon: Sparkles,
    badge: "FREE",
  },
];

const secondaryNav = [
  {
    name: "고객센터",
    href: "/support",
    icon: HelpCircle,
  },
  {
    name: "설정",
    href: "/settings",
    icon: Settings,
  },
];

const adminNav = [
  {
    name: "관리자",
    href: "/admin",
    icon: Settings,
    adminOnly: true,
  },
];

const tierConfig = {
  basic: { label: "일반", color: "text-muted-foreground", bg: "bg-muted" },
  vip: { label: "VIP", color: "text-amber-600", bg: "bg-amber-100" },
  premium: { label: "프리미엄", color: "text-[#00C896]", bg: "bg-[#00C896]/10" },
  enterprise: { label: "엔터프라이즈", color: "text-blue-600", bg: "bg-blue-100" },
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const tier = tierConfig[user?.tier as keyof typeof tierConfig] || tierConfig.basic;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-border">
        <Logo size="md" />
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

        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const navItem = item as typeof item & { badge?: string; disabled?: boolean };

          if (navItem.disabled) {
            return (
              <div
                key={item.name}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
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
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary-foreground")} />
              {item.name}
              {navItem.badge && (
                <span className={cn(
                  "ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded",
                  isActive ? "bg-white/20 text-white" : "bg-accent text-white"
                )}>
                  {navItem.badge}
                </span>
              )}
              {isActive && !navItem.badge && <ChevronRight className="ml-auto h-4 w-4" />}
            </Link>
          );
        })}

        <Separator className="my-4" />

        {secondaryNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}

        {/* Admin Navigation - Only for admins */}
        {user?.isAdmin && (
          <>
            <Separator className="my-4" />
            {adminNav.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
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

      {/* Balance Card */}
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
                  {user?.tier === "vip" && <Crown className="h-3 w-3" />}
                  {tier.label}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-3xl font-bold">
                {formatCurrency(user?.balance || 0)}
              </div>
              <div className="flex items-center gap-1 text-white/60 text-sm mt-1">
                <TrendingUp className="h-4 w-4" />
                이번 달 +15% 절약
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

      {/* User Info & Logout */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email || "user@example.com"}</p>
            <p className="text-xs text-muted-foreground">{tier.label} 회원</p>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

