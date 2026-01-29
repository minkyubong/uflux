// ============================================
// Order History Page
// 주문 내역 페이지
// ============================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
  ExternalLink,
  Copy,
  MoreHorizontal,
  Package,
  ShoppingCart,
  ArrowDownRight,
  Repeat,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useOrders, useSyncOrderStatus, type OrderWithDetails } from '@/hooks/use-orders';
import { useAuth } from '@/hooks/use-auth';
import { formatCurrency, formatRelativeTime, formatCompactNumber, copyToClipboard, cn } from '@/lib/utils';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/database';
import { toast } from 'sonner';

// ============================================
// Status Filter Tabs Configuration
// ============================================
const STATUS_TABS = [
  { value: 'all', label: '전체', icon: Package },
  { value: 'in_progress', label: '진행중', icon: Loader2 },
  { value: 'completed', label: '완료', icon: CheckCircle2 },
  { value: 'canceled', label: '취소', icon: XCircle },
] as const;

// ============================================
// Mock Orders (for demo)
// ============================================
const MOCK_ORDERS: OrderWithDetails[] = [
  {
    id: 'ord-001',
    user_id: 'user-1',
    service_id: 'svc-1',
    provider_id: 'prov-1',
    provider_order_id: '1234567',
    link: 'https://instagram.com/example_user',
    quantity: 1000,
    amount: 15000,
    status: 'completed',
    start_count: 5000,
    remains: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updated_at: new Date().toISOString(),
    service: {
      id: 'svc-1',
      category_id: 'cat-1',
      provider_id: 'prov-1',
      provider_service_id: '1',
      name: 'Instagram 팔로워 [고품질]',
      description: '고품질 팔로워',
      platform: 'instagram',
      price: 15,
      min_quantity: 100,
      max_quantity: 100000,
      is_active: true,
      is_drip_feed: true,
      is_refill: true,
      is_cancel: false,
      average_time: '1-2시간',
      sort_order: 1,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: 'ord-002',
    user_id: 'user-1',
    service_id: 'svc-2',
    provider_id: 'prov-1',
    provider_order_id: '1234568',
    link: 'https://youtube.com/watch?v=abc123',
    quantity: 5000,
    amount: 25000,
    status: 'processing',
    start_count: 10000,
    remains: 2500,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updated_at: new Date().toISOString(),
    service: {
      id: 'svc-2',
      category_id: 'cat-2',
      provider_id: 'prov-1',
      provider_service_id: '10',
      name: 'YouTube 조회수 [실시간]',
      description: '실시간 조회수',
      platform: 'youtube',
      price: 5,
      min_quantity: 500,
      max_quantity: 1000000,
      is_active: true,
      is_drip_feed: true,
      is_refill: false,
      is_cancel: true,
      average_time: '0-6시간',
      sort_order: 1,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: 'ord-003',
    user_id: 'user-1',
    service_id: 'svc-3',
    provider_id: 'prov-1',
    provider_order_id: '1234569',
    link: 'https://tiktok.com/@example/video/123',
    quantity: 2000,
    amount: 10000,
    status: 'pending',
    start_count: 0,
    remains: 2000,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updated_at: new Date().toISOString(),
    service: {
      id: 'svc-3',
      category_id: 'cat-3',
      provider_id: 'prov-1',
      provider_service_id: '21',
      name: 'TikTok 좋아요',
      description: '실제 좋아요',
      platform: 'tiktok',
      price: 5,
      min_quantity: 100,
      max_quantity: 100000,
      is_active: true,
      is_drip_feed: false,
      average_time: '0-1시간',
      is_refill: false,
      is_cancel: true,
      sort_order: 1,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: 'ord-004',
    user_id: 'user-1',
    service_id: 'svc-1',
    provider_id: 'prov-1',
    provider_order_id: '1234570',
    link: 'https://instagram.com/example_post',
    quantity: 500,
    amount: 4000,
    status: 'canceled',
    start_count: 0,
    remains: 500,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date().toISOString(),
    service: {
      id: 'svc-1',
      category_id: 'cat-1',
      provider_id: 'prov-1',
      provider_service_id: '2',
      name: 'Instagram 좋아요 [즉시]',
      description: '즉시 시작',
      platform: 'instagram',
      price: 8,
      min_quantity: 50,
      max_quantity: 50000,
      is_active: true,
      is_drip_feed: false,
      is_refill: false,
      is_cancel: true,
      average_time: '0-30분',
      sort_order: 2,
      created_at: '',
      updated_at: '',
    },
  },
];

// ============================================
// Status Icon Component
// ============================================
function StatusIcon({ status, className }: { status: string; className?: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className={cn('h-4 w-4 text-emerald-500', className)} />;
    case 'processing':
    case 'in_progress':
      return <Loader2 className={cn('h-4 w-4 text-blue-500 animate-spin', className)} />;
    case 'pending':
      return <Clock className={cn('h-4 w-4 text-amber-500', className)} />;
    case 'partial':
      return <ArrowDownRight className={cn('h-4 w-4 text-orange-500', className)} />;
    case 'canceled':
    case 'failed':
      return <XCircle className={cn('h-4 w-4 text-red-500', className)} />;
    default:
      return <Clock className={cn('h-4 w-4 text-gray-500', className)} />;
  }
}

// ============================================
// Order Detail Dialog
// ============================================
interface OrderDetailProps {
  order: OrderWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSync: () => void;
  isSyncing: boolean;
}

function OrderDetailDialog({ order, open, onOpenChange, onSync, isSyncing }: OrderDetailProps) {
  const handleCopyLink = async () => {
    const success = await copyToClipboard(order.link);
    if (success) {
      toast.success('링크가 복사되었습니다');
    }
  };

  const handleCopyOrderId = async () => {
    const success = await copyToClipboard(order.id);
    if (success) {
      toast.success('주문 번호가 복사되었습니다');
    }
  };

  const progress = order.quantity > 0
    ? Math.round(((order.quantity - (order.remains || 0)) / order.quantity) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            주문 상세 정보
          </DialogTitle>
          <DialogDescription>
            주문 번호: {order.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Service Info */}
          <div className="p-4 rounded-xl bg-muted/50">
            <h4 className="font-medium mb-2">{order.service?.name || '서비스'}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <a
                href={order.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary truncate"
              >
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{order.link}</span>
              </a>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyLink}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Status & Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">상태</span>
              <Badge className={ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || ''}>
                <StatusIcon status={order.status} />
                <span className="ml-1">
                  {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                </span>
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">진행률</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    order.status === 'completed' ? 'bg-emerald-500' :
                    order.status === 'processing' || order.status === 'in_progress' ? 'bg-blue-500' :
                    order.status === 'canceled' ? 'bg-red-500' :
                    'bg-amber-500'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">주문 수량</span>
              <span>{formatCompactNumber(order.quantity)}개</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">시작 카운트</span>
              <span>{formatCompactNumber(order.start_count || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">남은 수량</span>
              <span>{formatCompactNumber(order.remains || 0)}개</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">결제 금액</span>
              <span className="font-medium">{formatCurrency(order.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">주문 일시</span>
              <span>{new Date(order.created_at).toLocaleString('ko-KR')}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCopyOrderId}>
            <Copy className="mr-2 h-4 w-4" />
            주문번호 복사
          </Button>
          <Button
            className="flex-1"
            onClick={onSync}
            disabled={isSyncing || order.status === 'completed' || order.status === 'canceled'}
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                동기화 중...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                상태 새로고침
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Empty State Component
// ============================================
function EmptyState({ hasFilter, onReset }: { hasFilter: boolean; onReset: () => void }) {
  if (hasFilter) {
    return (
      <div className="text-center py-16">
        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">검색 결과가 없습니다</h3>
        <p className="text-muted-foreground mb-6">
          다른 검색어나 필터를 시도해보세요
        </p>
        <Button variant="outline" onClick={onReset}>
          필터 초기화
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
        <ShoppingCart className="h-10 w-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">아직 주문 내역이 없습니다</h3>
      <p className="text-muted-foreground mb-6">
        첫 주문을 해보세요!
      </p>
      <Button asChild>
        <Link href="/order">
          <Package className="mr-2 h-4 w-4" />
          주문하러 가기
        </Link>
      </Button>
    </div>
  );
}

// ============================================
// Loading Skeleton
// ============================================
function TableSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// CSV Export Utility
// ============================================
function exportOrdersToCSV(orders: OrderWithDetails[]) {
  const headers = ['주문번호', '서비스명', '링크', '수량', '금액', '상태', '주문일시'];
  const rows = orders.map(order => [
    order.id,
    order.service?.name || '서비스',
    order.link,
    order.quantity.toString(),
    order.amount.toString(),
    ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status,
    new Date(order.created_at).toLocaleString('ko-KR'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `UFLUX_orders_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// Main History Page Component
// ============================================
export default function HistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);

  // 비회원 모드에서는 쿼리 비활성화
  const { data: orders, isLoading, refetch } = useOrders({}, !!user);
  const syncStatus = useSyncOrderStatus();

  // 재주문 함수
  const handleReorder = (order: OrderWithDetails) => {
    // localStorage에 재주문 데이터 저장
    const reorderData = {
      serviceId: order.service_id,
      link: order.link,
      quantity: order.quantity,
    };
    localStorage.setItem('UFLUX_reorder', JSON.stringify(reorderData));
    toast.success('주문 정보가 복사되었습니다', {
      description: '주문 페이지로 이동합니다',
    });
    router.push('/order');
  };

  // CSV 내보내기
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('내보낼 주문 내역이 없습니다');
      return;
    }
    exportOrdersToCSV(filteredOrders);
    toast.success(`${filteredOrders.length}건의 주문 내역이 다운로드되었습니다`);
  };

  // Use mock data if no real orders
  const displayOrders = orders && orders.length > 0 ? orders : MOCK_ORDERS;

  // Filter orders
  const filteredOrders = displayOrders.filter((order) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.link.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.service?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'in_progress') {
        // 진행중: pending, processing, in_progress
        matchesStatus = ['pending', 'processing', 'in_progress'].includes(order.status);
      } else if (statusFilter === 'completed') {
        // 완료: completed, partial
        matchesStatus = ['completed', 'partial'].includes(order.status);
      } else if (statusFilter === 'canceled') {
        // 취소: canceled, failed
        matchesStatus = ['canceled', 'failed'].includes(order.status);
      }
    }

    return matchesSearch && matchesStatus;
  });

  // Stats by filter
  const stats = {
    all: displayOrders.length,
    in_progress: displayOrders.filter((o) => ['pending', 'processing', 'in_progress'].includes(o.status)).length,
    completed: displayOrders.filter((o) => ['completed', 'partial'].includes(o.status)).length,
    canceled: displayOrders.filter((o) => ['canceled', 'failed'].includes(o.status)).length,
  };

  const handleSync = async (orderId: string) => {
    await syncStatus.mutateAsync(orderId);
  };

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const hasFilter = searchQuery !== '' || statusFilter !== 'all';
  const showEmptyState = filteredOrders.length === 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">주문 내역</h1>
          <p className="text-muted-foreground mt-1">
            모든 주문 내역을 확인하고 관리하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={filteredOrders.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">CSV 내보내기</span>
            <FileSpreadsheet className="h-4 w-4 sm:hidden" />
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
            <span className="hidden sm:inline">새로고침</span>
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          {STATUS_TABS.map((tab) => {
            const Icon = tab.icon;
            const count = stats[tab.value as keyof typeof stats];
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background"
              >
                <Icon className={cn(
                  'h-4 w-4',
                  tab.value === 'in_progress' && statusFilter === tab.value && 'animate-spin'
                )} />
                <span className="hidden sm:inline">{tab.label}</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="주문번호, 링크, 서비스명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            주문 목록
            {filteredOrders.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {filteredOrders.length}건
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : showEmptyState ? (
            <EmptyState hasFilter={hasFilter} onReset={handleReset} />
          ) : (
            <div className="overflow-x-auto -mx-6">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">서비스</TableHead>
                    <TableHead>수량</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>주문일</TableHead>
                    <TableHead className="w-[50px] pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <TableCell className="pl-6">
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">
                            {order.service?.name || '서비스'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {order.link}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="tabular-nums">{formatCompactNumber(order.quantity)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'flex items-center gap-1 w-fit',
                            ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || ''
                          )}
                        >
                          <StatusIcon status={order.status} className="h-3 w-3" />
                          <span className="text-xs">
                            {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium tabular-nums">{formatCurrency(order.amount)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(order.created_at)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                              <Package className="mr-2 h-4 w-4" />
                              상세 보기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReorder(order);
                              }}
                            >
                              <Repeat className="mr-2 h-4 w-4" />
                              재주문
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSync(order.id);
                              }}
                              disabled={order.status === 'completed' || order.status === 'canceled'}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              상태 동기화
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(order.link);
                                toast.success('링크가 복사되었습니다');
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              링크 복사
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <OrderDetailDialog
          order={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
          onSync={() => handleSync(selectedOrder.id)}
          isSyncing={syncStatus.isPending}
        />
      )}
    </div>
  );
}

