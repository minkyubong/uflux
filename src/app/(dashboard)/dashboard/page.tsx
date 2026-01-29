"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { FaInstagram, FaYoutube, FaTiktok, FaFacebook, FaTelegram, FaTwitter } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { useServices } from "@/hooks/use-services";
import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";

// 아이콘 매핑
const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: FaInstagram,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  facebook: FaFacebook,
  telegram: FaTelegram,
  twitter: FaTwitter,
};

// 플랫폼 색상 매핑
const PLATFORM_GRADIENT: Record<string, string> = {
  instagram: "from-[#E1306C] to-[#F77737]",
  youtube: "from-red-500 to-orange-500",
  tiktok: "from-gray-900 to-gray-700",
  facebook: "from-blue-600 to-blue-700",
  telegram: "from-sky-500 to-blue-500",
  twitter: "from-sky-400 to-sky-500",
};

const statusColors: Record<string, string> = {
  completed: "badge-success",
  processing: "badge-info",
  in_progress: "badge-warning",
  pending: "badge-warning",
  canceled: "badge-error",
};

const statusLabels: Record<string, string> = {
  completed: "완료",
  processing: "처리중",
  in_progress: "진행중",
  pending: "대기",
  canceled: "취소",
};

export default function DashboardPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { services, categories, isLoading: servicesLoading } = useServices();
  const { data: orders = [], isLoading: ordersLoading } = useOrders({ limit: 5 });

  // 인기 서비스 계산 (각 주요 플랫폼별 가장 저렴한 서비스)
  const popularServices = useMemo(() => {
    const mainPlatforms = ['instagram', 'youtube', 'tiktok', 'facebook'];

    return mainPlatforms.map(platformSlug => {
      // 해당 플랫폼 카테고리 찾기
      const category = categories.find(c => c.slug?.toLowerCase() === platformSlug);
      if (!category) return null;

      // 해당 카테고리의 서비스 중 가장 저렴한 것
      const platformServices = services.filter(s => s.category_id === category.id);
      if (platformServices.length === 0) return null;

      const cheapest = platformServices.reduce((min, s) =>
        s.price < min.price ? s : min, platformServices[0]
      );

      return {
        id: cheapest.id,
        name: cheapest.name,
        price: cheapest.price,
        platform: platformSlug,
        icon: PLATFORM_ICONS[platformSlug] || FaInstagram,
        color: PLATFORM_GRADIENT[platformSlug] || "from-gray-500 to-gray-600",
      };
    }).filter(Boolean);
  }, [services, categories]);

  // 통계 계산
  const stats = useMemo(() => {
    const thisMonthOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    });

    const totalSpent = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const processingOrders = orders.filter(o =>
      o.status === 'processing' || o.status === 'in_progress' || o.status === 'pending'
    );
    const completedOrders = orders.filter(o => o.status === 'completed');
    const completionRate = orders.length > 0
      ? ((completedOrders.length / orders.length) * 100).toFixed(1)
      : "0.0";

    return [
      {
        title: "이번 달 주문",
        value: thisMonthOrders.length,
        change: "+12%",
        trend: "up" as const,
        icon: ShoppingCart,
        color: "text-blue-600",
        bg: "bg-blue-100",
      },
      {
        title: "총 지출",
        value: totalSpent,
        change: "+8%",
        trend: "up" as const,
        icon: DollarSign,
        color: "text-green-600",
        bg: "bg-green-100",
        isCurrency: true,
      },
      {
        title: "진행중 주문",
        value: processingOrders.length,
        change: `-${processingOrders.length}`,
        trend: "down" as const,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-100",
      },
      {
        title: "완료율",
        value: `${completionRate}%`,
        change: "+0.5%",
        trend: "up" as const,
        icon: TrendingUp,
        color: "text-[#00C896]",
        bg: "bg-[#00C896]/10",
      },
    ];
  }, [orders]);

  const isLoading = authLoading || servicesLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">대시보드</h1>
          <p className="text-muted-foreground mt-1">
            안녕하세요{profile?.username ? `, ${profile.username}님` : ''}! 오늘도 성공적인 마케팅 되세요.
          </p>
        </div>
        <Button asChild className="btn-gradient">
          <Link href="/order">
            <ShoppingCart className="mr-2 h-4 w-4" />
            새 주문하기
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="card-interactive">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">
                  {stat.isCurrency
                    ? formatCurrency(stat.value as number)
                    : stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>최근 주문</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders">전체보기</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>아직 주문 내역이 없습니다</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/order">첫 주문하기</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => {
                  const service = services.find(s => s.id === order.service_id);
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">
                            {service?.name || '서비스'}
                          </p>
                          <Badge
                            variant="outline"
                            className={statusColors[order.status]}
                          >
                            {statusLabels[order.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="truncate max-w-[150px]">{order.link}</span>
                          <span>•</span>
                          <span>{formatNumber(order.quantity)}개</span>
                          <span>•</span>
                          <span>{formatRelativeTime(order.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold">{formatCurrency(Number(order.amount))}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Services */}
        <Card>
          <CardHeader>
            <CardTitle>인기 서비스</CardTitle>
          </CardHeader>
          <CardContent>
            {popularServices.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin opacity-30" />
                <p>서비스를 불러오는 중...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {popularServices.map((service) => service && (
                  <Link
                    key={service.id}
                    href="/order"
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted transition-colors group"
                  >
                    <div
                      className={`p-2.5 rounded-xl bg-gradient-to-br ${service.color} text-white`}
                    >
                      <service.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-primary transition-colors truncate">
                        {service.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        1,000개당
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatCurrency(service.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Button className="w-full mt-4" variant="outline" asChild>
              <Link href="/order">모든 서비스 보기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions / Announcement Banner */}
      <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {profile?.balance
                    ? `현재 잔액: ${formatCurrency(Number(profile.balance))}`
                    : 'VIP 등급 달성까지 50,000원!'
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  충전하고 더 많은 서비스를 이용해보세요.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/deposit">지금 충전하기</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

