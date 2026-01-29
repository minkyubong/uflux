"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  LayoutDashboard,
  ShoppingCart,
  History,
  CreditCard,
  HelpCircle,
  Settings,
  LogOut,
  Wallet,
  Crown,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";

interface MobileHeaderProps {
  user?: {
    email: string;
    balance: number;
    tier: string;
    isAdmin?: boolean;
  };
}

const navigation = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { name: "새 주문", href: "/order", icon: ShoppingCart },
  { name: "주문 내역", href: "/orders", icon: History },
  { name: "충전하기", href: "/deposit", icon: CreditCard },
  { name: "고객센터", href: "/support", icon: HelpCircle },
  { name: "설정", href: "/settings", icon: Settings },
];

const adminNavigation = [
  { name: "관리자", href: "/admin", icon: Settings },
];

const tierConfig = {
  basic: { label: "일반", color: "text-muted-foreground", bg: "bg-muted" },
  vip: { label: "VIP", color: "text-amber-600", bg: "bg-amber-100" },
  premium: { label: "프리미엄", color: "text-[#00C896]", bg: "bg-[#00C896]/10" },
  enterprise: { label: "엔터프라이즈", color: "text-blue-600", bg: "bg-blue-100" },
};

export function MobileHeader({ user }: MobileHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const tier = tierConfig[user?.tier as keyof typeof tierConfig] || tierConfig.basic;

  return (
    <header className="lg:hidden sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Hamburger Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetTitle className="sr-only">메뉴</SheetTitle>
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex items-center h-16 px-6 border-b border-border">
                <Logo size="md" linkTo="/dashboard" />
              </div>

              {/* Balance Card */}
              <div className="p-4">
                <div className="glass-balance text-white rounded-2xl p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span className="text-sm text-white/80">내 잔액</span>
                    </div>
                    <div className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", tier.bg, tier.color)}>
                      <div className="flex items-center gap-1">
                        {user?.tier === "vip" && <Crown className="h-3 w-3" />}
                        {tier.label}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(user?.balance || 0)}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-2 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
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
                    </Link>
                  );
                })}

                {/* Admin Navigation */}
                {user?.isAdmin && (
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

              {/* User Info & Logout */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user?.email || "user@example.com"}</p>
                    <p className="text-sm text-muted-foreground">{tier.label} 회원</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setOpen(false)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Logo size="sm" />

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Balance Badge */}
          <Link
            href="/deposit"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full"
          >
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {formatCurrency(user?.balance || 0)}
            </span>
          </Link>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
          </Button>
        </div>
      </div>
    </header>
  );
}

