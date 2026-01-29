// ============================================
// Admin Deposits Management Page
// 관리자 입금 관리 페이지
// ============================================

'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Calendar,
  Wallet,
  AlertTriangle,
  Building2,
  Bitcoin,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Deposit, Profile, PaymentMethod } from '@/types/database';

// ============================================
// Types
// ============================================
interface DepositWithUser extends Deposit {
  user?: Pick<Profile, 'id' | 'email' | 'full_name' | 'balance'> | null;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

// ============================================
// Mock Data
// ============================================
const MOCK_DEPOSITS: DepositWithUser[] = [
  {
    id: 'dep-001',
    user_id: 'user-1',
    amount: 100000,
    depositor_name: '홍길동',
    bank_name: '카카오뱅크',
    account_number: null,
    receipt_url: null,
    status: 'pending',
    admin_note: null,
    approved_by: null,
    approved_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    payment_method: 'bank_transfer',
    tx_id: null,
    exchange_rate: null,
    crypto_amount: null,
    crypto_currency: null,
    network: null,
    user: { id: 'user-1', email: 'hong@example.com', full_name: '홍길동', balance: 50000 },
  },
  {
    id: 'dep-002',
    user_id: 'user-2',
    amount: 145000,
    depositor_name: '김철수',
    bank_name: null,
    account_number: null,
    receipt_url: null,
    status: 'pending',
    admin_note: null,
    approved_by: null,
    approved_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updated_at: new Date().toISOString(),
    payment_method: 'crypto',
    tx_id: 'abc123def456789012345678901234567890abcdef1234567890abcdef12345678',
    exchange_rate: 1450,
    crypto_amount: 100,
    crypto_currency: 'USDT',
    network: 'TRC-20',
    user: { id: 'user-2', email: 'kim@example.com', full_name: '김철수', balance: 25000 },
  },
  {
    id: 'dep-003',
    user_id: 'user-3',
    amount: 200000,
    depositor_name: '이영희',
    bank_name: '국민은행',
    account_number: null,
    receipt_url: null,
    status: 'approved',
    admin_note: null,
    approved_by: 'admin-1',
    approved_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    updated_at: new Date().toISOString(),
    payment_method: 'bank_transfer',
    tx_id: null,
    exchange_rate: null,
    crypto_amount: null,
    crypto_currency: null,
    network: null,
    user: { id: 'user-3', email: 'lee@example.com', full_name: '이영희', balance: 200000 },
  },
  {
    id: 'dep-004',
    user_id: 'user-4',
    amount: 30000,
    depositor_name: '박지민',
    bank_name: '우리은행',
    account_number: null,
    receipt_url: null,
    status: 'rejected',
    admin_note: '입금자명 불일치',
    approved_by: null,
    approved_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updated_at: new Date().toISOString(),
    payment_method: 'bank_transfer',
    tx_id: null,
    exchange_rate: null,
    crypto_amount: null,
    crypto_currency: null,
    network: null,
    user: { id: 'user-4', email: 'park@example.com', full_name: '박지민', balance: 0 },
  },
];

// ============================================
// Status Badge Component
// ============================================
function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { label: '대기중', icon: Clock, className: 'bg-amber-100 text-amber-700 border-amber-200' },
    approved: { label: '승인완료', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    rejected: { label: '거절됨', icon: XCircle, className: 'bg-red-100 text-red-700 border-red-200' },
    canceled: { label: '취소됨', icon: XCircle, className: 'bg-gray-100 text-gray-700 border-gray-200' },
  }[status] || { label: status, icon: Clock, className: '' };

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('flex items-center gap-1', config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// ============================================
// Payment Method Badge Component
// ============================================
function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const config = {
    bank_transfer: {
      label: '무통장',
      icon: Building2,
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    crypto: {
      label: 'USDT',
      icon: Bitcoin,
      className: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    kakaopay: {
      label: '카카오페이',
      icon: Wallet,
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
  }[method] || { label: method, icon: Wallet, className: '' };

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('flex items-center gap-1', config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// ============================================
// TXID Link Component
// ============================================
function TxIdLink({ txId, network }: { txId: string | null; network: string | null }) {
  if (!txId) {
    return <span className="text-muted-foreground">-</span>;
  }

  const truncatedId = `${txId.slice(0, 8)}...${txId.slice(-6)}`;

  // TRC-20 네트워크인 경우 Tronscan 링크
  const explorerUrl = network === 'TRC-20'
    ? `https://tronscan.org/#/transaction/${txId}`
    : `https://tronscan.org/#/transaction/${txId}`; // 기본값도 Tronscan

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(txId);
      toast.success('TXID가 복사되었습니다');
    } catch {
      toast.error('복사에 실패했습니다');
    }
  };

  return (
    <div className="flex items-center gap-1">
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
        title={`블록체인 탐색기에서 확인: ${txId}`}
      >
        <code className="font-mono text-xs">{truncatedId}</code>
        <ExternalLink className="h-3 w-3" />
      </a>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={handleCopy}
        title="TXID 복사"
      >
        <Copy className="h-3 w-3 text-muted-foreground" />
      </Button>
    </div>
  );
}

// ============================================
// Main Admin Deposits Page
// ============================================
export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<DepositWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('pending');
  const [selectedDeposit, setSelectedDeposit] = useState<DepositWithUser | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Fetch deposits
  const fetchDeposits = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('deposits')
        .select(`
          *,
          user:profiles!user_id(id, email, full_name, balance)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeposits((data as DepositWithUser[]) || []);
    } catch (error) {
      console.error('Error fetching deposits:', error);
      setDeposits(MOCK_DEPOSITS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  // Filter deposits
  const filteredDeposits = deposits.filter((deposit) => {
    const matchesSearch =
      !searchQuery ||
      deposit.depositor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.tx_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || deposit.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    pending: deposits.filter((d) => d.status === 'pending').length,
    approved: deposits.filter((d) => d.status === 'approved').length,
    rejected: deposits.filter((d) => d.status === 'rejected').length,
    pendingAmount: deposits
      .filter((d) => d.status === 'pending')
      .reduce((sum, d) => sum + d.amount, 0),
  };

  // Approve deposit
  const handleApprove = async () => {
    if (!selectedDeposit) return;

    setIsProcessing(true);
    try {
      // 1. Get current user (admin)
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error('관리자 인증 필요');

      // 2. Start transaction: Update deposit status
      const { error: depositError } = await supabase
        .from('deposits')
        .update({
          status: 'approved',
          approved_by: adminUser.id,
          approved_at: new Date().toISOString(),
        } as never)
        .eq('id', selectedDeposit.id);

      if (depositError) throw depositError;

      // 3. Add balance to user using database function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: balanceError } = await (supabase.rpc as any)('add_balance', {
        p_user_id: selectedDeposit.user_id,
        p_amount: selectedDeposit.amount,
        p_type: 'deposit',
        p_description: `입금 승인 - ${selectedDeposit.depositor_name}`,
        p_reference_id: selectedDeposit.id,
        p_reference_type: 'deposit',
      });

      if (balanceError) {
        // Rollback deposit status if balance update fails
        await supabase
          .from('deposits')
          .update({
            status: 'pending',
            approved_by: null,
            approved_at: null,
          } as never)
          .eq('id', selectedDeposit.id);
        throw balanceError;
      }

      toast.success(`${formatCurrency(selectedDeposit.amount)} 입금이 승인되었습니다`);
      setShowApproveDialog(false);
      setSelectedDeposit(null);
      fetchDeposits();
    } catch (error) {
      console.error('Error approving deposit:', error);
      toast.error('입금 승인 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject deposit
  const handleReject = async () => {
    if (!selectedDeposit) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('deposits')
        .update({
          status: 'rejected',
          admin_note: rejectNote || null,
        } as never)
        .eq('id', selectedDeposit.id);

      if (error) throw error;

      toast.success('입금 요청이 거절되었습니다');
      setShowRejectDialog(false);
      setSelectedDeposit(null);
      setRejectNote('');
      fetchDeposits();
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      toast.error('처리 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">입금 관리</h1>
          <p className="text-muted-foreground">
            입금 요청을 확인하고 승인하세요
          </p>
        </div>
        <Button variant="outline" onClick={fetchDeposits} disabled={isLoading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
          새로고침
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-600 font-medium">대기중</p>
                <p className="text-2xl font-bold">{stats.pending}건</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-emerald-600 font-medium">승인완료</p>
                <p className="text-2xl font-bold">{stats.approved}건</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">거절됨</p>
                <p className="text-2xl font-bold">{stats.rejected}건</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)} className="flex-1">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              대기중
              <Badge variant="secondary" className="ml-1">{stats.pending}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">승인완료</TabsTrigger>
            <TabsTrigger value="rejected">거절됨</TabsTrigger>
            <TabsTrigger value="all">전체</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="입금자명, 이메일, TXID 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Deposits Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            입금 목록
            {filteredDeposits.length > 0 && (
              <Badge variant="outline">{filteredDeposits.length}건</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredDeposits.length > 0 ? (
            <div className="overflow-x-auto -mx-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">입금자</TableHead>
                    <TableHead>회원정보</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>결제수단</TableHead>
                    <TableHead>TXID</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>요청일시</TableHead>
                    <TableHead className="pr-6 text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeposits.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{deposit.depositor_name}</p>
                            <p className="text-xs text-muted-foreground">{deposit.bank_name || '-'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{deposit.user?.email || '-'}</p>
                          <p className="text-xs text-muted-foreground">
                            현재 잔액: {formatCurrency(deposit.user?.balance || 0)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-bold text-lg">{formatCurrency(deposit.amount)}</span>
                          {deposit.payment_method === 'crypto' && deposit.crypto_amount && (
                            <p className="text-xs text-muted-foreground">
                              {deposit.crypto_amount} {deposit.crypto_currency || 'USDT'}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PaymentMethodBadge method={deposit.payment_method} />
                      </TableCell>
                      <TableCell>
                        <TxIdLink txId={deposit.tx_id} network={deposit.network} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={deposit.status} />
                        {deposit.admin_note && (
                          <p className="text-xs text-muted-foreground mt-1">{deposit.admin_note}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatRelativeTime(deposit.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        {deposit.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setShowApproveDialog(true);
                              }}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              거절
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">모든 입금이 처리되었습니다</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'pending'
                  ? '대기 중인 입금 요청이 없습니다'
                  : '해당 조건의 입금 내역이 없습니다'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입금 승인</AlertDialogTitle>
            <AlertDialogDescription>
              이 입금을 승인하시겠습니까? 회원의 잔액이 즉시 충전됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedDeposit && (
            <div className="py-4 space-y-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">입금자명</div>
                  <div className="font-medium">{selectedDeposit.depositor_name}</div>
                  <div className="text-muted-foreground">결제수단</div>
                  <div><PaymentMethodBadge method={selectedDeposit.payment_method} /></div>
                  <div className="text-muted-foreground">입금액</div>
                  <div className="font-bold text-lg text-primary">
                    {formatCurrency(selectedDeposit.amount)}
                  </div>
                  {selectedDeposit.payment_method === 'crypto' && (
                    <>
                      <div className="text-muted-foreground">USDT 수량</div>
                      <div className="font-medium">
                        {selectedDeposit.crypto_amount} {selectedDeposit.crypto_currency || 'USDT'}
                      </div>
                      <div className="text-muted-foreground">적용 환율</div>
                      <div>₩{selectedDeposit.exchange_rate?.toLocaleString()}/USDT</div>
                      <div className="text-muted-foreground">TXID</div>
                      <div><TxIdLink txId={selectedDeposit.tx_id} network={selectedDeposit.network} /></div>
                    </>
                  )}
                  <div className="text-muted-foreground">회원 이메일</div>
                  <div>{selectedDeposit.user?.email || '-'}</div>
                  <div className="text-muted-foreground">현재 잔액</div>
                  <div>{formatCurrency(selectedDeposit.user?.balance || 0)}</div>
                  <div className="text-muted-foreground">충전 후 잔액</div>
                  <div className="font-medium text-emerald-600">
                    {formatCurrency((selectedDeposit.user?.balance || 0) + selectedDeposit.amount)}
                  </div>
                </div>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  승인
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              입금 거절
            </DialogTitle>
            <DialogDescription>
              이 입금 요청을 거절하시겠습니까? 사유를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">입금자명</div>
                  <div className="font-medium">{selectedDeposit.depositor_name}</div>
                  <div className="text-muted-foreground">입금액</div>
                  <div className="font-bold">{formatCurrency(selectedDeposit.amount)}</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">거절 사유 (선택)</label>
                <Textarea
                  placeholder="예: 입금자명 불일치, 금액 불일치 등"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isProcessing}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  거절
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

