// ============================================
// API Provider 관리 페이지
// SMM API 공급자 추가/수정/삭제/잔액확인
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Server,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Check,
  X,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  AlertCircle,
  DollarSign,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { toast } from 'sonner';

interface ApiProvider {
  id: string;
  name: string;
  slug: string;
  api_url: string;
  api_key: string;
  is_active: boolean;
  priority: number;
  balance: number | null;
  last_balance_check: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [checkingBalance, setCheckingBalance] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1450); // 기본값

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    api_url: '',
    api_key: '',
    priority: 0,
    is_active: true,
  });

  // 실시간 환율 조회
  useEffect(() => {
    async function fetchExchangeRate() {
      try {
        const response = await fetch('/api/exchange-rate');
        const data = await response.json();
        if (data.success && data.rate) {
          setExchangeRate(data.rate);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
      }
    }
    fetchExchangeRate();
  }, []);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('api_providers')
      .select('*')
      .order('priority', { ascending: false });

    if (error) {
      toast.error('공급자 목록 로드 실패');
      console.error(error);
    } else {
      setProviders(data || []);
    }
    setLoading(false);
  };

  const openCreateDialog = () => {
    setSelectedProvider(null);
    setFormData({
      name: '',
      slug: '',
      api_url: '',
      api_key: '',
      priority: 0,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (provider: ApiProvider) => {
    setSelectedProvider(provider);
    setFormData({
      name: provider.name,
      slug: provider.slug,
      api_url: provider.api_url,
      api_key: provider.api_key,
      priority: provider.priority,
      is_active: provider.is_active,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (provider: ApiProvider) => {
    setSelectedProvider(provider);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug || !formData.api_url || !formData.api_key) {
      toast.error('모든 필드를 입력해주세요');
      return;
    }

    setSaving(true);

    try {
      if (selectedProvider) {
        // Update
        const { error } = await (supabase as any)
          .from('api_providers')
          .update({
            name: formData.name,
            slug: formData.slug,
            api_url: formData.api_url,
            api_key: formData.api_key,
            priority: formData.priority,
            is_active: formData.is_active,
          })
          .eq('id', selectedProvider.id);

        if (error) throw error;
        toast.success('공급자 정보가 수정되었습니다');
      } else {
        // Create
        const { error } = await (supabase as any)
          .from('api_providers')
          .insert({
            name: formData.name,
            slug: formData.slug,
            api_url: formData.api_url,
            api_key: formData.api_key,
            priority: formData.priority,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast.success('새 공급자가 추가되었습니다');
      }

      setIsDialogOpen(false);
      fetchProviders();
    } catch (error: any) {
      toast.error(error.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProvider) return;

    try {
      const { error } = await (supabase as any)
        .from('api_providers')
        .delete()
        .eq('id', selectedProvider.id);

      if (error) throw error;
      toast.success('공급자가 삭제되었습니다');
      setIsDeleteDialogOpen(false);
      fetchProviders();
    } catch (error: any) {
      toast.error(error.message || '삭제 실패');
    }
  };

  const toggleActive = async (provider: ApiProvider) => {
    try {
      const { error } = await (supabase as any)
        .from('api_providers')
        .update({ is_active: !provider.is_active })
        .eq('id', provider.id);

      if (error) throw error;
      fetchProviders();
      toast.success(provider.is_active ? '비활성화됨' : '활성화됨');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const checkBalance = async (provider: ApiProvider) => {
    setCheckingBalance(provider.id);

    try {
      // API 호출로 잔액 확인
      const response = await fetch('/api/admin/check-provider-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: provider.id,
          api_url: provider.api_url,
          api_key: provider.api_key,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // DB 업데이트
        await (supabase as any)
          .from('api_providers')
          .update({
            balance: data.balance,
            last_balance_check: new Date().toISOString(),
          })
          .eq('id', provider.id);

        const balanceUsd = parseFloat(data.balance);
        const balanceKrw = Math.round(balanceUsd * exchangeRate);
        toast.success(`잔액: $${balanceUsd.toFixed(2)} (≈${balanceKrw.toLocaleString()}원)`);
        fetchProviders();
      } else {
        toast.error(data.error || '잔액 확인 실패');
      }
    } catch (error) {
      toast.error('잔액 확인 중 오류 발생');
    } finally {
      setCheckingBalance(null);
    }
  };

  const toggleShowApiKey = (id: string) => {
    setShowApiKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="h-6 w-6" />
            API 공급자 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            SMM 서비스 API 공급자를 관리합니다
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          공급자 추가
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 공급자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              활성 공급자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {providers.filter((p) => p.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 잔액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${providers.reduce((sum, p) => sum + (p.balance || 0), 0).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              ≈ {Math.round(providers.reduce((sum, p) => sum + (p.balance || 0), 0) * exchangeRate).toLocaleString()}원
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle>공급자 목록</CardTitle>
          <CardDescription>등록된 API 공급자들을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">등록된 공급자가 없습니다</p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                첫 공급자 추가하기
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상태</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>API URL</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>우선순위</TableHead>
                  <TableHead>잔액</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <Switch
                        checked={provider.is_active}
                        onCheckedChange={() => toggleActive(provider)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {provider.slug}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={provider.api_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                      >
                        {provider.api_url.substring(0, 30)}...
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {showApiKeys[provider.id]
                            ? provider.api_key
                            : '••••••••••••••••'}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleShowApiKey(provider.id)}
                        >
                          {showApiKeys[provider.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{provider.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="font-medium">
                            {provider.balance != null
                              ? `$${provider.balance.toFixed(2)}`
                              : '-'}
                          </span>
                          {provider.balance != null && (
                            <div className="text-xs text-muted-foreground">
                              ≈ {Math.round(provider.balance * exchangeRate).toLocaleString()}원
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => checkBalance(provider)}
                          disabled={checkingBalance === provider.id}
                        >
                          {checkingBalance === provider.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      {provider.last_balance_check && (
                        <div className="text-xs text-muted-foreground">
                          {new Date(provider.last_balance_check).toLocaleString(
                            'ko-KR'
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/admin/providers/${provider.id}/services`)}
                          title="서비스 보기"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(provider)}
                          title="수정"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(provider)}
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedProvider ? '공급자 수정' : '새 공급자 추가'}
            </DialogTitle>
            <DialogDescription>
              SMM API 공급자 정보를 입력하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">공급자 이름</Label>
                <Input
                  id="name"
                  placeholder="예: YTResellers"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">슬러그</Label>
                <Input
                  id="slug"
                  placeholder="예: ytresellers"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/\s/g, '-'),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_url">API URL</Label>
              <Input
                id="api_url"
                placeholder="https://example.com/api/v2"
                value={formData.api_url}
                onChange={(e) =>
                  setFormData({ ...formData, api_url: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                placeholder="API 키를 입력하세요"
                value={formData.api_key}
                onChange={(e) =>
                  setFormData({ ...formData, api_key: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">우선순위</Label>
                <Input
                  id="priority"
                  type="number"
                  placeholder="0"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  높을수록 먼저 사용됩니다
                </p>
              </div>
              <div className="space-y-2">
                <Label>활성화</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <span className="text-sm">
                    {formData.is_active ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedProvider ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공급자 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 &quot;{selectedProvider?.name}&quot; 공급자를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없으며, 연결된 상품들의 API 설정도 초기화됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

