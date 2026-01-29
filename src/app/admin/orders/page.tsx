// ============================================
// Admin Orders Management Page
// 관리자 주문 관리 페이지
// ============================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowDownRight,
  ExternalLink,
  User,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatCompactNumber, cn } from '@/lib/utils';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/database';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================
interface OrderWithDetails {
  id: string;
  order_number: string | null;
  user_id: string;
  service_id: string | null;
  link: string;
  quantity: number;
  amount: number;
  status: string;
  start_count: number | null;
  remains: number | null;
  provider_order_id: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    username: string | null;
  } | null;
  service?: {
    name: string;
    platform: string | null;
  } | null;
}

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
    case 'refunded':
      return <XCircle className={cn('h-4 w-4 text-red-500', className)} />;
    default:
      return <Clock className={cn('h-4 w-4 text-gray-500', className)} />;
  }
}

// Status badge colors
const STATUS_BADGE_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  partial: 'bg-orange-100 text-orange-700 border-orange-200',
  canceled: 'bg-red-100 text-red-700 border-red-200',
  refunded: 'bg-purple-100 text-purple-700 border-purple-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
};

// ============================================
// Main Component
// ============================================
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');

  const pageSize = 20;

  // 주문 목록 조회
  const fetchOrders = async () => {
    setIsLoading(true);

    try {
      // 총 개수 조회
      let countQuery = (supabase as any)
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('status', statusFilter);
      }

      const { count, error: countError } = await countQuery;
      if (countError) {
        console.error('Count error:', countError);
      }
      setTotalCount(count || 0);

      // 주문 목록 조회 (조인 없이)
      let query = (supabase as any)
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Orders query error:', error);
        throw error;
      }

      // 사용자 정보 별도 조회
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((o: any) => o.user_id).filter(Boolean))];

        if (userIds.length > 0) {
          const { data: users } = await (supabase as any)
            .from('profiles')
            .select('id, email, username')
            .in('id', userIds);

          const userMap = new Map(users?.map((u: any) => [u.id, u]) || []);

          // 주문에 사용자 정보 매핑
          const ordersWithUsers = data.map((order: any) => ({
            ...order,
            user: userMap.get(order.user_id) || null,
          }));

          setOrders(ordersWithUsers as OrderWithDetails[]);
          return;
        }
      }

      setOrders((data || []) as OrderWithDetails[]);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('주문 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  // 검색 필터링
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter(order =>
      order.id.toLowerCase().includes(query) ||
      order.order_number?.toLowerCase().includes(query) ||
      order.link.toLowerCase().includes(query) ||
      order.user?.email?.toLowerCase().includes(query) ||
      order.service?.name?.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  // 상태 변경
  const handleStatusChange = async () => {
    if (!selectedOrder || !newStatus) return;

    setIsUpdating(true);

    try {
      const { error } = await (supabase as any)
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast.success('주문 상태가 변경되었습니다.');
      setShowStatusDialog(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('상태 변경에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 페이지네이션
  const totalPages = Math.ceil(totalCount / pageSize);

  // 통계
  const stats = useMemo(() => {
    return {
      total: totalCount,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => ['processing', 'in_progress'].includes(o.status)).length,
      completed: orders.filter(o => o.status === 'completed').length,
    };
  }, [orders, totalCount]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">주문 관리</h1>
          <p className="text-muted-foreground">
            모든 사용자의 주문을 관리합니다
          </p>
        </div>
        <Button onClick={fetchOrders} disabled={isLoading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">전체 주문</p>
                <p className="text-2xl font-bold">{formatCompactNumber(stats.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">대기중</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">진행중</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">완료</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="주문번호, 링크, 이메일, 서비스명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="processing">처리중</SelectItem>
                <SelectItem value="in_progress">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="partial">부분완료</SelectItem>
                <SelectItem value="canceled">취소됨</SelectItem>
                <SelectItem value="refunded">환불됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 주문 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            주문 목록
            <Badge variant="outline" className="ml-2">
              {filteredOrders.length}건
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">주문이 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">주문번호</TableHead>
                    <TableHead>사용자</TableHead>
                    <TableHead>서비스</TableHead>
                    <TableHead>수량</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>주문일</TableHead>
                    <TableHead className="pr-6 w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="pl-6">
                        <div className="font-mono text-xs">
                          {order.order_number || order.id.slice(0, 8)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[150px]">
                            {order.user?.email || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate text-sm">
                            {order.service?.name || `Service #${order.service_id?.slice(0, 8) || 'N/A'}`}
                          </p>
                          <a
                            href={order.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="truncate">{order.link}</span>
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="tabular-nums">
                          {formatCompactNumber(order.quantity)}
                        </span>
                        {order.remains !== null && order.remains > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (남음: {formatCompactNumber(order.remains)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(order.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'flex items-center gap-1 w-fit',
                            STATUS_BADGE_COLORS[order.status] || ''
                          )}
                        >
                          <StatusIcon status={order.status} className="h-3 w-3" />
                          <span>{ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                setNewStatus(order.status);
                                setShowStatusDialog(true);
                              }}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              상태 변경
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                window.open(order.link, '_blank');
                              }}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              링크 열기
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

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                총 {totalCount}건 중 {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, totalCount)}건
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상태 변경 다이얼로그 */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>주문 상태 변경</DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_number || selectedOrder?.id.slice(0, 8)}의 상태를 변경합니다
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">현재 상태</label>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'flex items-center gap-1',
                    STATUS_BADGE_COLORS[selectedOrder?.status || ''] || ''
                  )}
                >
                  <StatusIcon status={selectedOrder?.status || ''} className="h-3 w-3" />
                  <span>{ORDER_STATUS_LABELS[(selectedOrder?.status || '') as OrderStatus] || selectedOrder?.status}</span>
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">변경할 상태</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="processing">처리중</SelectItem>
                  <SelectItem value="in_progress">진행중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="partial">부분완료</SelectItem>
                  <SelectItem value="canceled">취소됨</SelectItem>
                  <SelectItem value="refunded">환불됨</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              취소
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={isUpdating || newStatus === selectedOrder?.status}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  변경 중...
                </>
              ) : (
                '상태 변경'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

