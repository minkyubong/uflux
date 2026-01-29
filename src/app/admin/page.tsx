// ============================================
// Admin Dashboard Home
// 관리자 대시보드 홈 (RPC + Promise.all 최적화)
// ============================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Users,
  Wallet,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatCompactNumber, cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================
interface DashboardStats {
  todaySales: number;
  yesterdaySales: number;
  todayOrders: number;
  totalUsers: number;
  newUsersToday: number;
  pendingDeposits: number;
  pendingDepositAmount: number;
  processingOrders: number;
}

interface RecentDeposit {
  id: string;
  amount: number;
  depositor_name: string;
  status: string;
  created_at: string;
}

interface RecentOrder {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  service: { name: string } | null;
}

// ============================================
// Stat Card Component
// ============================================
interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  trend?: number;
  href?: string;
  variant?: 'default' | 'warning' | 'success';
}

function StatCard({ title, value, description, icon: Icon, trend, href, variant = 'default' }: StatCardProps) {
  const content = (
    <Card className={cn(
      'transition-all hover:shadow-lg',
      variant === 'warning' && 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20',
      variant === 'success' && 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20'
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {typeof trend === 'number' && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{trend >= 0 ? '+' : ''}{trend.toFixed(1)}% 전일 대비</span>
              </div>
            )}
          </div>
          <div className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center',
            variant === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50' :
            variant === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50' :
            'bg-primary/10 text-primary'
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// ============================================
// Main Admin Dashboard Component
// ============================================
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDeposits, setRecentDeposits] = useState<RecentDeposit[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Promise.all로 병렬 처리
      const [
        todayOrdersResult,
        yesterdayOrdersResult,
        totalUsersResult,
        newUsersTodayResult,
        pendingDepositsResult,
        processingOrdersResult,
        depositsResult,
        ordersResult
      ] = await Promise.all([
        // 오늘 매출
        supabase
          .from('orders')
          .select('charge')
          .gte('created_at', today.toISOString())
          .eq('status', 'completed'),

        // 어제 매출
        supabase
          .from('orders')
          .select('charge')
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', today.toISOString())
          .eq('status', 'completed'),

        // 전체 회원수
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),

        // 오늘 가입자
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', today.toISOString()),

        // 대기 중 입금
        supabase
          .from('deposits')
          .select('amount')
          .eq('status', 'pending'),

        // 처리 중 주문
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'processing', 'in_progress']),

        // 최근 입금 5건
        supabase
          .from('deposits')
          .select('id, amount, depositor_name, status, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),

        // 최근 주문 5건
        (supabase as any)
          .from('orders')
          .select('id, charge, status, created_at, service_id')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // 매출 계산
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const todaySales = (todayOrdersResult.data || []).reduce((sum: number, o: any) => sum + (o.charge || 0), 0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const yesterdaySales = (yesterdayOrdersResult.data || []).reduce((sum: number, o: any) => sum + (o.charge || 0), 0);
      const todayOrders = todayOrdersResult.data?.length || 0;

      // 입금 대기 계산
      const pendingDepositData = pendingDepositsResult.data || [];
      const pendingDeposits = pendingDepositData.length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pendingDepositAmount = pendingDepositData.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);

      setStats({
        todaySales,
        yesterdaySales,
        todayOrders,
        totalUsers: totalUsersResult.count || 0,
        newUsersToday: newUsersTodayResult.count || 0,
        pendingDeposits,
        pendingDepositAmount,
        processingOrders: processingOrdersResult.count || 0,
      });

      setRecentDeposits(depositsResult.data as RecentDeposit[]);

      // 주문 데이터 매핑 (charge -> amount 변환)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedOrders = (ordersResult.data || []).map((o: any) => ({
        id: o.id,
        amount: o.charge || 0,
        status: o.status,
        created_at: o.created_at,
        service: o.service_id ? { name: `서비스 #${o.service_id}` } : null,
      }));
      setRecentOrders(mappedOrders as RecentOrder[]);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // 30초마다 자동 갱신
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const salesTrend = stats && stats.yesterdaySales > 0
    ? ((stats.todaySales - stats.yesterdaySales) / stats.yesterdaySales) * 100
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground mt-1">
            현재 시스템 상태와 매출 현황입니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
            새로고침
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading || !stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-[100px] mb-4" />
                <Skeleton className="h-8 w-[150px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="오늘 매출"
            value={formatCurrency(stats.todaySales)}
            description={`어제 매출: ${formatCurrency(stats.yesterdaySales)}`}
            icon={DollarSign}
            trend={salesTrend}
          />
          <StatCard
            title="전체 회원"
            value={formatCompactNumber(stats.totalUsers)}
            description={`오늘 가입: +${stats.newUsersToday}명`}
            icon={Users}
            variant="success"
          />
          <StatCard
            title="입금 대기"
            value={`${stats.pendingDeposits}건`}
            description={`총 ${formatCurrency(stats.pendingDepositAmount)}`}
            icon={Wallet}
            href="/admin/deposits"
            variant="warning"
          />
          <StatCard
            title="처리 중 주문"
            value={`${stats.processingOrders}건`}
            description="자동화 처리 중"
            icon={Package}
            href="/admin/orders"
          />
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Deposits */}
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">대기 중인 입금</CardTitle>
              <CardDescription>승인이 필요한 입금 요청</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/deposits">
                전체 보기 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : recentDeposits.length > 0 ? (
              <div className="space-y-3">
                {recentDeposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{deposit.depositor_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(deposit.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCurrency(deposit.amount)}</p>
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                        승인 대기
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                <CheckCircle2 className="h-10 w-10 mb-2 text-emerald-500/50" />
                <p>모든 입금이 처리되었습니다</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">최근 주문</CardTitle>
              <CardDescription>실시간 주문 현황</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/orders">
                전체 보기 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                        order.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/50' :
                        order.status.includes('progress') || order.status === 'processing' ? 'bg-blue-100 dark:bg-blue-900/50' :
                        'bg-gray-100 dark:bg-gray-800'
                      )}>
                        {order.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : order.status.includes('progress') || order.status === 'processing' ? (
                          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        ) : (
                          <Package className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm">
                          {order.service?.name || '삭제된 서비스'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold text-sm">{formatCurrency(order.amount)}</p>
                      <Badge variant="outline" className={cn(
                        'text-[10px] px-2 py-0 h-5',
                        order.status === 'completed' ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' :
                        order.status.includes('progress') || order.status === 'processing' ? 'text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/30' :
                        'text-gray-600 border-gray-300'
                      )}>
                        {order.status === 'completed' ? '완료' :
                         order.status === 'processing' || order.status === 'in_progress' ? '진행중' :
                         order.status === 'pending' ? '대기중' : order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
                <p>최근 주문 내역이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            빠른 관리 작업
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-all">
              <Link href="/admin/deposits">
                <Wallet className="mr-2 h-4 w-4" />
                입금 승인 대기 ({stats?.pendingDeposits || 0})
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="hover:bg-background shadow-sm">
              <Link href="/admin/services">
                <RefreshCw className="mr-2 h-4 w-4" />
                API 서비스 동기화
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/admin/orders">
                <Package className="mr-2 h-4 w-4" />
                주문 상태 업데이트
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

