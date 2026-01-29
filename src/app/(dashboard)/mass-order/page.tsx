// ============================================
// 대량 주문 (Mass Order) 페이지
// 여러 주문을 한번에 처리
// ============================================

'use client';

import { useState, useMemo } from 'react';
import {
  Layers,
  AlertCircle,
  CheckCircle,
  Loader2,
  HelpCircle,
  Trash2,
  Play,
  XCircle,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useServices } from '@/hooks/use-services';
import { orderKeys } from '@/hooks/use-orders';
import { supabase } from '@/lib/supabase';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// ============================================
// 타입 정의
// ============================================
interface ParsedOrder {
  line: number;
  serviceId: string;
  serviceName?: string;
  link: string;
  quantity: number;
  price: number;
  isValid: boolean;
  error?: string;
}

// ============================================
// 메인 컴포넌트
// ============================================
export default function MassOrderPage() {
  const queryClient = useQueryClient();
  const { profile, refreshProfile, isLoading: authLoading } = useAuth();
  const { services, isLoading: servicesLoading } = useServices();
  const balance = Number(profile?.balance) || 0;
  const isPageLoading = authLoading || servicesLoading;

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: [],
  });

  // 입력 파싱
  const parsedOrders = useMemo((): ParsedOrder[] => {
    if (!input.trim() || services.length === 0) return [];

    const lines = input.trim().split('\n');
    return lines.map((line, index) => {
      const parts = line.split('|').map(p => p.trim());

      if (parts.length !== 3) {
        return {
          line: index + 1,
          serviceId: '',
          link: '',
          quantity: 0,
          price: 0,
          isValid: false,
          error: '형식 오류: 서비스ID | 링크 | 수량',
        };
      }

      const [serviceId, link, quantityStr] = parts;
      const quantity = parseInt(quantityStr, 10);

      // 서비스 찾기
      const service = services.find(s => s.id === serviceId || s.name.includes(serviceId));

      if (!service) {
        return {
          line: index + 1,
          serviceId,
          link,
          quantity,
          price: 0,
          isValid: false,
          error: '서비스를 찾을 수 없습니다',
        };
      }

      // 수량 검증
      if (isNaN(quantity) || quantity <= 0) {
        return {
          line: index + 1,
          serviceId: service.id,
          serviceName: service.name,
          link,
          quantity: 0,
          price: 0,
          isValid: false,
          error: '수량이 올바르지 않습니다',
        };
      }

      if (quantity < service.min_quantity || quantity > service.max_quantity) {
        return {
          line: index + 1,
          serviceId: service.id,
          serviceName: service.name,
          link,
          quantity,
          price: 0,
          isValid: false,
          error: `수량 범위: ${service.min_quantity} ~ ${service.max_quantity}`,
        };
      }

      // 링크 검증
      if (!link || (!link.startsWith('http://') && !link.startsWith('https://'))) {
        return {
          line: index + 1,
          serviceId: service.id,
          serviceName: service.name,
          link,
          quantity,
          price: 0,
          isValid: false,
          error: '유효한 URL을 입력하세요',
        };
      }

      // 가격 계산
      const price = Math.ceil((service.price / 1000) * quantity);

      return {
        line: index + 1,
        serviceId: service.id,
        serviceName: service.name,
        link,
        quantity,
        price,
        isValid: true,
      };
    });
  }, [input, services]);

  // 유효한 주문만 필터링
  const validOrders = parsedOrders.filter(o => o.isValid);
  const invalidOrders = parsedOrders.filter(o => !o.isValid);

  // 총 금액 계산
  const totalPrice = validOrders.reduce((sum, o) => sum + o.price, 0);
  const hasEnoughBalance = balance >= totalPrice;

  // 대량 주문 처리
  const handleMassOrder = async () => {
    if (validOrders.length === 0 || isProcessing || !profile) return;

    setIsProcessing(true);
    setShowConfirmDialog(false);

    const successOrders: string[] = [];
    const failedOrders: string[] = [];

    for (const order of validOrders) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.rpc as any)('process_order', {
          p_user_id: profile.id,
          p_service_id: order.serviceId,
          p_link: order.link,
          p_quantity: order.quantity,
        });

        if (error) {
          failedOrders.push(`라인 ${order.line}: ${error.message}`);
        } else {
          successOrders.push(order.serviceId);
        }
      } catch (err) {
        failedOrders.push(`라인 ${order.line}: 처리 중 오류 발생`);
      }
    }

    // 결과 저장
    setResults({
      success: successOrders.length,
      failed: failedOrders.length,
      errors: failedOrders,
    });

    // 성공 시 처리
    if (successOrders.length > 0) {
      toast.success(`${successOrders.length}개 주문이 완료되었습니다!`, {
        description: failedOrders.length > 0 ? `${failedOrders.length}개 실패` : undefined,
      });

      // Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // 프로필 & 주문 내역 갱신
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: orderKeys.all });

      // 입력 초기화
      setInput('');
    } else {
      toast.error('모든 주문이 실패했습니다', {
        description: '입력을 확인해주세요',
      });
    }

    setIsProcessing(false);
  };

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-8 w-8 text-primary" />
            대량 주문
          </h1>
          <p className="text-muted-foreground mt-1">
            여러 주문을 한번에 처리하세요
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10">
          <span className="text-sm text-muted-foreground">보유 잔액</span>
          <span className="font-bold text-primary">{formatCurrency(balance)}</span>
        </div>
      </div>

      {/* 사용법 안내 */}
      <Alert>
        <HelpCircle className="h-4 w-4" />
        <AlertTitle>입력 형식</AlertTitle>
        <AlertDescription className="mt-2">
          <code className="bg-muted px-2 py-1 rounded text-sm">
            서비스ID | 링크 | 수량
          </code>
          <p className="text-sm mt-2 text-muted-foreground">
            한 줄에 하나의 주문을 입력하세요. 예시:
          </p>
          <pre className="bg-muted p-3 rounded-lg mt-2 text-xs overflow-x-auto">
{`abc123-service-id | https://instagram.com/username | 1000
xyz789-service-id | https://youtube.com/watch?v=abc | 5000`}
          </pre>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 영역 */}
        <Card>
          <CardHeader>
            <CardTitle>주문 입력</CardTitle>
            <CardDescription>
              서비스ID | 링크 | 수량 형식으로 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={`서비스ID | https://instagram.com/username | 1000\n서비스ID | https://youtube.com/watch?v=abc | 5000`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('')}
                disabled={!input || isProcessing}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                초기화
              </Button>
              <div className="text-sm text-muted-foreground">
                {parsedOrders.length}개 라인 입력됨
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 미리보기 영역 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              미리보기
              {validOrders.length > 0 && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  {validOrders.length}개 유효
                </Badge>
              )}
              {invalidOrders.length > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  {invalidOrders.length}개 오류
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              입력된 주문을 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parsedOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>왼쪽에 주문을 입력하면 미리보기가 표시됩니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-[250px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>서비스</TableHead>
                        <TableHead>수량</TableHead>
                        <TableHead>금액</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedOrders.map((order) => (
                        <TableRow key={order.line} className={!order.isValid ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                          <TableCell className="font-mono text-xs">{order.line}</TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate max-w-[150px]">
                                {order.serviceName || order.serviceId || '-'}
                              </p>
                              {order.error && (
                                <p className="text-xs text-red-500">{order.error}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="tabular-nums text-sm">
                            {order.quantity > 0 ? order.quantity.toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="tabular-nums text-sm font-medium">
                            {order.price > 0 ? formatCurrency(order.price) : '-'}
                          </TableCell>
                          <TableCell>
                            {order.isValid ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 총계 */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">유효한 주문</span>
                    <span className="font-bold">{validOrders.length}개</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">총 금액</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                  {!hasEnoughBalance && totalPrice > 0 && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-2">
                      <AlertCircle className="h-3 w-3" />
                      잔액이 부족합니다
                    </p>
                  )}
                </div>

                {/* 주문 버튼 */}
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={validOrders.length === 0 || !hasEnoughBalance || isProcessing}
                  className="w-full h-12 btn-gradient"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      {validOrders.length}개 주문 실행
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 결과 표시 */}
      {(results.success > 0 || results.failed > 0) && (
        <Alert className={results.failed > 0 ? 'border-amber-500' : 'border-emerald-500'}>
          {results.failed > 0 ? (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          )}
          <AlertTitle>처리 완료</AlertTitle>
          <AlertDescription>
            <p className="mt-2">
              성공: <span className="font-bold text-emerald-600">{results.success}개</span>
              {results.failed > 0 && (
                <>, 실패: <span className="font-bold text-red-600">{results.failed}개</span></>
              )}
            </p>
            {results.errors.length > 0 && (
              <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                {results.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {results.errors.length > 5 && (
                  <li>...외 {results.errors.length - 5}개</li>
                )}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* 확인 다이얼로그 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>대량 주문 확인</DialogTitle>
            <DialogDescription>
              아래 내용으로 주문하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">주문 수</span>
              <span className="font-medium">{validOrders.length}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">총 금액</span>
              <span className="font-bold text-primary">{formatCurrency(totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">결제 후 잔액</span>
              <span className={cn('font-medium', !hasEnoughBalance && 'text-red-500')}>
                {formatCurrency(balance - totalPrice)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              취소
            </Button>
            <Button onClick={handleMassOrder} className="btn-gradient">
              주문 확정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

