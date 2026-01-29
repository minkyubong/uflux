// ============================================
// 잔액 내역 페이지
// 충전/사용 내역 조회
// ============================================

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  Gift,
  ShoppingCart,
  RotateCcw,
  Wrench,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useAuth } from '@/hooks/use-auth';
import { useTransactions } from '@/hooks/use-transactions';
import { formatCurrency, cn } from '@/lib/utils';
import { TRANSACTION_TYPE_LABELS, type TransactionType, type Transaction } from '@/types/database';
import { toast } from 'sonner';

// ============================================
// 거래 유형별 설정
// ============================================
const TRANSACTION_CONFIG: Record<TransactionType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  deposit: {
    icon: TrendingUp,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  refund: {
    icon: RotateCcw,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  order: {
    icon: ShoppingCart,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  bonus: {
    icon: Gift,
    color: 'text-[#00C896]',
    bgColor: 'bg-[#00C896]/10',
  },
  adjustment: {
    icon: Wrench,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

// ============================================
// 필터 탭 설정
// ============================================
const FILTER_TABS = [
  { value: 'all', label: '전체' },
  { value: 'deposit', label: '충전' },
  { value: 'order', label: '주문' },
  { value: 'refund', label: '환불' },
  { value: 'bonus', label: '보너스' },
] as const;

// ============================================
// CSV 내보내기
// ============================================
function exportTransactionsToCSV(transactions: Transaction[]) {
  const headers = ['거래일시', '유형', '금액', '잔액 전', '잔액 후', '설명'];
  const rows = transactions.map(tx => [
    new Date(tx.created_at).toLocaleString('ko-KR'),
    TRANSACTION_TYPE_LABELS[tx.type],
    tx.amount.toString(),
    tx.balance_before.toString(),
    tx.balance_after.toString(),
    tx.description || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `UFLUX_transactions_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// 메인 컴포넌트
// ============================================
export default function TransactionsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { data: transactions, isLoading: txLoading, refetch } = useTransactions();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const balance = Number(profile?.balance) || 0;
  const isLoading = authLoading || txLoading;

  // 필터링된 거래 내역
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter(tx => {
      // 유형 필터
      if (filterType !== 'all' && tx.type !== filterType) return false;

      // 검색 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          tx.description?.toLowerCase().includes(query) ||
          tx.type.toLowerCase().includes(query) ||
          tx.amount.toString().includes(query)
        );
      }

      return true;
    });
  }, [transactions, filterType, searchQuery]);

  // 통계 계산
  const stats = useMemo(() => {
    if (!transactions) return { totalDeposit: 0, totalSpent: 0, totalRefund: 0 };

    return transactions.reduce((acc, tx) => {
      if (tx.type === 'deposit' || tx.type === 'bonus') {
        acc.totalDeposit += tx.amount;
      } else if (tx.type === 'order') {
        acc.totalSpent += Math.abs(tx.amount);
      } else if (tx.type === 'refund') {
        acc.totalRefund += tx.amount;
      }
      return acc;
    }, { totalDeposit: 0, totalSpent: 0, totalRefund: 0 });
  }, [transactions]);

  // CSV 내보내기
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('내보낼 거래 내역이 없습니다');
      return;
    }
    exportTransactionsToCSV(filteredTransactions);
    toast.success(`${filteredTransactions.length}건의 거래 내역이 다운로드되었습니다`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">잔액 내역</h1>
          <p className="text-muted-foreground mt-1">
            모든 충전 및 사용 내역을 확인하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={filteredTransactions.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">CSV 내보내기</span>
            <FileSpreadsheet className="h-4 w-4 sm:hidden" />
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">새로고침</span>
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">현재 잔액</p>
                <p className="text-xl font-bold">{formatCurrency(balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 충전</p>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(stats.totalDeposit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 사용</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 환불</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.totalRefund)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 탭 */}
      <Tabs value={filterType} onValueChange={setFilterType}>
        <TabsList className="grid w-full grid-cols-5 h-auto p-1">
          {FILTER_TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="py-2.5">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* 검색 */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="금액, 설명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 거래 내역 테이블 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            거래 내역
            {filteredTransactions.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {filteredTransactions.length}건
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            최근 거래부터 표시됩니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                <Wallet className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">거래 내역이 없습니다</h3>
              <p className="text-muted-foreground mb-6">
                {filterType !== 'all' ? '다른 필터를 선택해보세요' : '첫 충전을 해보세요!'}
              </p>
              {filterType === 'all' && (
                <Button asChild>
                  <Link href="/deposit">
                    <Wallet className="mr-2 h-4 w-4" />
                    충전하러 가기
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">유형</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>잔액 변화</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead className="pr-6">일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const config = TRANSACTION_CONFIG[tx.type];
                    const Icon = config.icon;
                    const isPositive = tx.amount > 0;

                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'h-8 w-8 rounded-lg flex items-center justify-center',
                              config.bgColor
                            )}>
                              <Icon className={cn('h-4 w-4', config.color)} />
                            </div>
                            <Badge variant="secondary" className="font-normal">
                              {TRANSACTION_TYPE_LABELS[tx.type]}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'font-semibold tabular-nums',
                            isPositive ? 'text-emerald-600' : 'text-red-600'
                          )}>
                            {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            <span className="tabular-nums">{formatCurrency(tx.balance_before)}</span>
                            <span className="mx-1">→</span>
                            <span className="tabular-nums font-medium text-foreground">
                              {formatCurrency(tx.balance_after)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {tx.description || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="pr-6">
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

