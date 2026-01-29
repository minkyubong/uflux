// ============================================
// Admin Services Management Page
// 관리자 서비스 관리 및 동기화 페이지
// ============================================

'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Download,
  Package,
  Percent,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Filter,
  Edit2,
  CheckSquare,
  Square,
  Trash2,
  Power,
  PowerOff,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Star,
  StarOff,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { fetchProviderServices } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Service, Provider, Category } from '@/types/database';

// ============================================
// Types
// ============================================
interface ServiceWithDetails extends Service {
  category?: Category | null;
  provider?: Provider | null;
}

// ============================================
// Constants
// ============================================
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
const DEFAULT_MARGIN = 30;

// ============================================
// Helpers
// ============================================

// description JSON 또는 서비스명에서 플랫폼 추출
function extractPlatform(service: { name: string; description?: string | null }): string {
  // 1. description JSON에서 추출 시도
  if (service.description) {
    try {
      const meta = JSON.parse(service.description);
      if (meta.platform) return meta.platform;
    } catch {}
  }

  // 2. 서비스명에서 추출
  const name = service.name.toLowerCase();
  if (name.includes('instagram') || name.includes('인스타')) return 'Instagram';
  if (name.includes('youtube') || name.includes('유튜브')) return 'YouTube';
  if (name.includes('tiktok') || name.includes('틱톡')) return 'TikTok';
  if (name.includes('facebook') || name.includes('페이스북')) return 'Facebook';
  if (name.includes('twitter') || name.includes('트위터')) return 'Twitter';
  if (name.includes('telegram') || name.includes('텔레그램')) return 'Telegram';
  if (name.includes('twitch') || name.includes('트위치')) return 'Twitch';
  if (name.includes('discord') || name.includes('디스코드')) return 'Discord';
  if (name.includes('spotify') || name.includes('스포티파이')) return 'Spotify';
  if (name.includes('threads') || name.includes('쓰레드')) return 'Threads';

  return '-';
}

// ============================================
// Main Admin Services Page
// ============================================
export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceWithDetails[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Margin settings
  const [showMarginDialog, setShowMarginDialog] = useState(false);
  const [globalMargin, setGlobalMargin] = useState(DEFAULT_MARGIN);
  const [isApplyingMargin, setIsApplyingMargin] = useState(false);
  const [marginTarget, setMarginTarget] = useState<'all' | 'selected' | 'filtered'>('all');

  // Sync dialog
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceWithDetails | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: 0,
    margin: 0,
    min_quantity: 0,
    max_quantity: 0,
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // ============================================
  // Data Fetching
  // ============================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch providers
      const { data: providersData, error: providersError } = await (supabase as any)
        .from('providers')
        .select('*')
        .eq('is_active', true);

      // 테이블이 없는 경우 조기 반환
      if (providersError?.code === '42P01') {
        console.log('providers 테이블이 없습니다. 이 페이지는 기존 서비스 관리용입니다.');
        setServices([]);
        setProviders([]);
        setIsLoading(false);
        return;
      }

      // 서비스는 페이지네이션으로 전체 조회 (Supabase 1000개 제한 우회)
      let allServices: ServiceWithDetails[] = [];
      let page = 0;
      const fetchPageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await (supabase as any)
          .from('services')
          .select(`
            *,
            category:categories(*),
            provider:providers(*)
          `)
          .order('provider_service_id', { ascending: true })
          .range(page * fetchPageSize, (page + 1) * fetchPageSize - 1);

        // 테이블이 없는 경우
        if (error?.code === '42P01') {
          console.log('services 테이블이 없습니다.');
          break;
        }

        if (error) throw error;

        if (data && data.length > 0) {
          allServices = [...allServices, ...(data as ServiceWithDetails[])];
          page++;
          hasMore = data.length === fetchPageSize;
        } else {
          hasMore = false;
        }
      }

      setServices(allServices);
      setProviders(providersData || []);
    } catch (error: unknown) {
      let errorMessage = '데이터를 불러오는데 실패했습니다';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const err = error as { message?: string; code?: string; details?: string };
        // 테이블 없음 에러는 무시
        if (err.code === '42P01') {
          setServices([]);
          setProviders([]);
          setIsLoading(false);
          return;
        }
        errorMessage = err.message || err.details || err.code || errorMessage;
      }
      console.error('Error fetching data:', errorMessage, error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================
  // Computed Values
  // ============================================

  // Get unique platforms from services (extracted from name/description)
  const platforms = useMemo(() => {
    const platformSet = new Set<string>();
    services.forEach(s => {
      const platform = extractPlatform(s);
      if (platform && platform !== '-') {
        platformSet.add(platform);
      }
    });
    return Array.from(platformSet).sort();
  }, [services]);

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        !searchQuery ||
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.provider_service_id?.includes(searchQuery);

      const servicePlatform = extractPlatform(service);
      const matchesPlatform = platformFilter === 'all' || servicePlatform === platformFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && service.is_active) ||
        (statusFilter === 'inactive' && !service.is_active) ||
        (statusFilter === 'featured' && service.is_featured);

      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [services, searchQuery, platformFilter, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredServices.length / pageSize);
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredServices.slice(startIndex, startIndex + pageSize);
  }, [filteredServices, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, platformFilter, statusFilter, pageSize]);

  // Stats
  const stats = useMemo(() => ({
    total: services.length,
    active: services.filter((s) => s.is_active).length,
    filtered: filteredServices.length,
    avgMargin: services.length > 0
      ? Math.round(services.reduce((sum, s) => sum + (s.margin || 0), 0) / services.length)
      : 0,
  }), [services, filteredServices]);

  // Selection states
  const isAllPageSelected = paginatedServices.length > 0 &&
    paginatedServices.every(s => selectedIds.has(s.id));
  const isSomePageSelected = paginatedServices.some(s => selectedIds.has(s.id)) && !isAllPageSelected;

  // ============================================
  // Handlers
  // ============================================

  // Toggle page selection
  const handleSelectPage = () => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (isAllPageSelected) {
        paginatedServices.forEach(s => newSet.delete(s.id));
      } else {
        paginatedServices.forEach(s => newSet.add(s.id));
      }
      return newSet;
    });
  };

  // Select all filtered
  const handleSelectAllFiltered = () => {
    setSelectedIds(new Set(filteredServices.map(s => s.id)));
    toast.success(`${filteredServices.length}개 서비스가 선택되었습니다`);
  };

  // Toggle single selection
  const toggleSelection = (serviceId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Sync services from provider
  const handleSyncServices = async () => {
    if (!selectedProvider) {
      toast.error('도매처를 선택해주세요');
      return;
    }

    const provider = providers.find((p) => p.id === selectedProvider);
    if (!provider) {
      toast.error('도매처를 찾을 수 없습니다');
      return;
    }

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 0 });

    try {
      const providerServices = await fetchProviderServices({
        id: provider.id,
        name: provider.name,
        apiUrl: provider.api_url,
        apiKey: provider.api_key,
      });

      if (!providerServices || providerServices.length === 0) {
        toast.error('도매처에서 서비스를 가져올 수 없습니다');
        return;
      }

      setSyncProgress({ current: 0, total: providerServices.length });

      let successCount = 0;
      for (let i = 0; i < providerServices.length; i++) {
        const ps = providerServices[i];
        setSyncProgress({ current: i + 1, total: providerServices.length });

        try {
          const { data: existingData } = await supabase
            .from('services')
            .select('id')
            .eq('provider_id', provider.id)
            .eq('provider_service_id', ps.providerServiceId)
            .single();
          const existing = existingData as { id: string } | null;

          const baseRate = ps.rate || 0;
          const priceWithMargin = Math.ceil(baseRate * (1 + globalMargin / 100));

          const serviceData = {
            provider_id: provider.id,
            provider_service_id: ps.providerServiceId,
            name: ps.name,
            description: ps.description || null,
            rate: baseRate,
            price: priceWithMargin,
            margin: globalMargin,
            min_quantity: ps.min,
            max_quantity: ps.max,
            average_time: ps.averageTime || null,
            is_active: false,
            is_refill: ps.hasRefill || false,
            is_cancel: ps.hasCancel || false,
            is_drip_feed: ps.hasDripfeed || false,
          };

          if (existing) {
            await supabase
              .from('services')
              .update(serviceData as never)
              .eq('id', existing.id);
          } else {
            await supabase
              .from('services')
              .insert(serviceData as never);
          }

          successCount++;
        } catch (err) {
          console.error('Error syncing service:', ps.providerServiceId, err);
        }
      }

      toast.success(`${successCount}개 서비스가 동기화되었습니다`);
      setShowSyncDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error syncing services:', error);
      toast.error('서비스 동기화 중 오류가 발생했습니다');
    } finally {
      setIsSyncing(false);
    }
  };

  // Apply margin
  const handleApplyMargin = async () => {
    setIsApplyingMargin(true);

    let targetServices: ServiceWithDetails[] = [];

    if (marginTarget === 'selected' && selectedIds.size > 0) {
      targetServices = services.filter(s => selectedIds.has(s.id));
    } else if (marginTarget === 'filtered') {
      targetServices = filteredServices;
    } else {
      targetServices = services;
    }

    if (targetServices.length === 0) {
      toast.error('적용할 서비스가 없습니다');
      setIsApplyingMargin(false);
      return;
    }

    try {
      let successCount = 0;
      const batchSize = 100;

      for (let i = 0; i < targetServices.length; i += batchSize) {
        const batch = targetServices.slice(i, i + batchSize);

        await Promise.all(batch.map(async (service) => {
          const baseRate = service.rate || 0;
          const newPrice = Math.ceil(baseRate * (1 + globalMargin / 100));

          const { error } = await supabase
            .from('services')
            .update({ margin: globalMargin, price: newPrice } as never)
            .eq('id', service.id);

          if (!error) successCount++;
        }));
      }

      // Update local state
      setServices(prev => prev.map(s => {
        if (targetServices.find(ts => ts.id === s.id)) {
          const baseRate = s.rate || 0;
          return {
            ...s,
            margin: globalMargin,
            price: Math.ceil(baseRate * (1 + globalMargin / 100))
          };
        }
        return s;
      }));

      toast.success(`${successCount}개 서비스에 ${globalMargin}% 마진이 적용되었습니다`);
      setShowMarginDialog(false);
    } catch (error) {
      console.error('Error applying margin:', error);
      toast.error('마진 적용 중 오류가 발생했습니다');
    } finally {
      setIsApplyingMargin(false);
    }
  };

  // Toggle service active status
  const handleToggleActive = async (serviceId: string, isActive: boolean) => {
    try {
      await supabase
        .from('services')
        .update({ is_active: isActive } as never)
        .eq('id', serviceId);

      setServices(prev =>
        prev.map(s => (s.id === serviceId ? { ...s, is_active: isActive } : s))
      );

      toast.success(isActive ? '서비스 활성화됨' : '서비스 비활성화됨');
    } catch (error) {
      console.error('Error toggling service:', error);
      toast.error('처리 중 오류가 발생했습니다');
    }
  };

  // Open edit dialog
  const openEditDialog = (service: ServiceWithDetails) => {
    setSelectedService(service);
    setEditForm({
      name: service.name,
      price: service.price,
      margin: service.margin || DEFAULT_MARGIN,
      min_quantity: service.min_quantity,
      max_quantity: service.max_quantity,
    });
    setShowEditDialog(true);
  };

  // Handle edit service
  const handleEditService = async () => {
    if (!selectedService) return;

    setIsEditSubmitting(true);
    try {
      const { error } = await supabase
        .from('services')
        .update({
          name: editForm.name,
          price: editForm.price,
          margin: editForm.margin,
          min_quantity: editForm.min_quantity,
          max_quantity: editForm.max_quantity,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', selectedService.id);

      if (error) throw error;

      setServices(prev =>
        prev.map(s =>
          s.id === selectedService.id ? { ...s, ...editForm } : s
        )
      );

      toast.success('서비스가 수정되었습니다');
      setShowEditDialog(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('서비스 수정에 실패했습니다');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Bulk activate
  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;

    setIsBulkProcessing(true);
    try {
      const idsArray = Array.from(selectedIds);

      const { error } = await supabase
        .from('services')
        .update({ is_active: true } as never)
        .in('id', idsArray);

      if (error) throw error;

      setServices(prev =>
        prev.map(s => (selectedIds.has(s.id) ? { ...s, is_active: true } : s))
      );

      toast.success(`${selectedIds.size}개 서비스가 활성화되었습니다`);
      clearSelection();
    } catch (error) {
      console.error('Error bulk activating:', error);
      toast.error('일괄 활성화 중 오류가 발생했습니다');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Bulk deactivate
  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;

    setIsBulkProcessing(true);
    try {
      const idsArray = Array.from(selectedIds);

      const { error } = await supabase
        .from('services')
        .update({ is_active: false } as never)
        .in('id', idsArray);

      if (error) throw error;

      setServices(prev =>
        prev.map(s => (selectedIds.has(s.id) ? { ...s, is_active: false } : s))
      );

      toast.success(`${selectedIds.size}개 서비스가 비활성화되었습니다`);
      clearSelection();
    } catch (error) {
      console.error('Error bulk deactivating:', error);
      toast.error('일괄 비활성화 중 오류가 발생했습니다');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `정말 ${selectedIds.size}개 서비스를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );
    if (!confirmed) return;

    setIsBulkProcessing(true);
    try {
      const idsArray = Array.from(selectedIds);

      const { error } = await supabase
        .from('services')
        .delete()
        .in('id', idsArray);

      if (error) throw error;

      setServices(prev => prev.filter(s => !selectedIds.has(s.id)));

      toast.success(`${selectedIds.size}개 서비스가 삭제되었습니다`);
      clearSelection();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('일괄 삭제 중 오류가 발생했습니다');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Bulk margin (selected only)
  const openBulkMarginDialog = () => {
    setMarginTarget('selected');
    setShowMarginDialog(true);
  };

  // Toggle featured (추천)
  const handleToggleFeatured = async (serviceId: string, isFeatured: boolean) => {
    try {
      await supabase
        .from('services')
        .update({ is_featured: isFeatured } as never)
        .eq('id', serviceId);

      setServices(prev =>
        prev.map(s => (s.id === serviceId ? { ...s, is_featured: isFeatured } : s))
      );

      toast.success(isFeatured ? '추천 서비스로 설정됨' : '추천 해제됨');
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('처리 중 오류가 발생했습니다');
    }
  };

  // Bulk set featured
  const handleBulkFeatured = async (featured: boolean) => {
    if (selectedIds.size === 0) return;

    setIsBulkProcessing(true);
    try {
      const idsArray = Array.from(selectedIds);

      const { error } = await supabase
        .from('services')
        .update({ is_featured: featured } as never)
        .in('id', idsArray);

      if (error) throw error;

      setServices(prev =>
        prev.map(s => (selectedIds.has(s.id) ? { ...s, is_featured: featured } : s))
      );

      toast.success(`${selectedIds.size}개 서비스 ${featured ? '추천 설정' : '추천 해제'}됨`);
      clearSelection();
    } catch (error) {
      console.error('Error bulk featured:', error);
      toast.error('일괄 처리 중 오류가 발생했습니다');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // ============================================
  // Render
  // ============================================
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">서비스 관리</h1>
          <p className="text-muted-foreground text-sm">
            총 {stats.total.toLocaleString()}개 서비스 | 활성 {stats.active.toLocaleString()}개
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setMarginTarget('all'); setShowMarginDialog(true); }}>
            <Percent className="mr-2 h-4 w-4" />
            마진 설정
          </Button>
          <Button size="sm" onClick={() => setShowSyncDialog(true)}>
            <Download className="mr-2 h-4 w-4" />
            동기화
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">전체</span>
            <span className="ml-auto font-bold">{stats.total.toLocaleString()}</span>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground">활성</span>
            <span className="ml-auto font-bold text-emerald-600">{stats.active.toLocaleString()}</span>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">필터됨</span>
            <span className="ml-auto font-bold text-blue-600">{stats.filtered.toLocaleString()}</span>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-muted-foreground">평균마진</span>
            <span className="ml-auto font-bold text-amber-600">{stats.avgMargin}%</span>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="서비스명, ID로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-9">
                <SelectValue placeholder="플랫폼" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 플랫폼</SelectItem>
                {platforms.map(platform => (
                  <SelectItem key={platform} value={platform || ''}>
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[120px] h-9">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
                <SelectItem value="featured">추천만</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="h-9">
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                <span className="font-medium">{selectedIds.size}개 선택</span>
                {selectedIds.size < filteredServices.length && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={handleSelectAllFiltered}>
                    필터된 전체 {filteredServices.length}개 선택
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkActivate}
                  disabled={isBulkProcessing}
                  className="h-8 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                >
                  <Power className="mr-1 h-3 w-3" />
                  활성화
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeactivate}
                  disabled={isBulkProcessing}
                  className="h-8 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                >
                  <PowerOff className="mr-1 h-3 w-3" />
                  비활성화
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openBulkMarginDialog}
                  disabled={isBulkProcessing}
                  className="h-8"
                >
                  <Percent className="mr-1 h-3 w-3" />
                  마진설정
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkFeatured(true)}
                  disabled={isBulkProcessing}
                  className="h-8 bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  <Star className="mr-1 h-3 w-3" />
                  추천설정
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkFeatured(false)}
                  disabled={isBulkProcessing}
                  className="h-8"
                >
                  <StarOff className="mr-1 h-3 w-3" />
                  추천해제
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isBulkProcessing}
                  className="h-8 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  삭제
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection} className="h-8">
                  <X className="mr-1 h-3 w-3" />
                  해제
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Table */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              서비스 목록
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">표시:</span>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <SelectItem key={size} value={String(size)}>{size}개</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : paginatedServices.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[40px] pl-4">
                        <button
                          onClick={handleSelectPage}
                          className="flex items-center justify-center w-5 h-5 rounded border hover:bg-muted transition-colors"
                        >
                          {isAllPageSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : isSomePageSelected ? (
                            <div className="w-2.5 h-2.5 bg-primary/60 rounded-sm" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="w-[60px]">ID</TableHead>
                      <TableHead className="min-w-[200px]">서비스명</TableHead>
                      <TableHead className="w-[90px]">플랫폼</TableHead>
                      <TableHead className="w-[80px] text-right">원가</TableHead>
                      <TableHead className="w-[80px] text-right">판매가</TableHead>
                      <TableHead className="w-[60px] text-center">마진</TableHead>
                      <TableHead className="w-[50px] text-center">추천</TableHead>
                      <TableHead className="w-[50px] text-center">상태</TableHead>
                      <TableHead className="w-[40px] pr-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedServices.map((service) => {
                      const platform = extractPlatform(service);
                      return (
                        <TableRow
                          key={service.id}
                          className={cn(
                            'hover:bg-muted/50',
                            !service.is_active && 'opacity-60',
                            selectedIds.has(service.id) && 'bg-primary/5',
                            service.is_featured && 'bg-yellow-50/50'
                          )}
                        >
                          <TableCell className="pl-4">
                            <button
                              onClick={() => toggleSelection(service.id)}
                              className="flex items-center justify-center w-5 h-5 rounded border hover:bg-muted transition-colors"
                            >
                              {selectedIds.has(service.id) ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                              ) : (
                                <Square className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {service.provider_service_id}
                          </TableCell>
                          <TableCell>
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="font-medium text-sm truncate max-w-[250px] cursor-help">
                                    {service.is_featured && <Star className="inline h-3 w-3 text-yellow-500 mr-1" />}
                                    {service.name}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-md">
                                  <p className="text-sm">{service.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {platform}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {formatCurrency(service.rate || 0)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatCurrency(service.price)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs',
                                (service.margin || 0) >= 30 && 'bg-emerald-100 text-emerald-700'
                              )}
                            >
                              {service.margin || 0}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => handleToggleFeatured(service.id, !service.is_featured)}
                              className={cn(
                                'p-1 rounded hover:bg-muted transition-colors',
                                service.is_featured && 'text-yellow-500'
                              )}
                            >
                              {service.is_featured ? (
                                <Star className="h-4 w-4 fill-current" />
                              ) : (
                                <Star className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={service.is_active}
                              onCheckedChange={(checked) => handleToggleActive(service.id, checked)}
                              className="scale-75"
                            />
                          </TableCell>
                          <TableCell className="pr-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditDialog(service)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredServices.length)} / {filteredServices.length}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1 mx-2">
                    <Input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => goToPage(Number(e.target.value))}
                      className="w-14 h-8 text-center"
                    />
                    <span className="text-sm text-muted-foreground">/ {totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">서비스가 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || platformFilter !== 'all' || statusFilter !== 'all'
                  ? '검색 조건에 맞는 서비스가 없습니다'
                  : '도매처에서 서비스를 동기화해주세요'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Dialog */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              도매처 서비스 동기화
            </DialogTitle>
            <DialogDescription>
              도매처 API에서 서비스 목록을 가져옵니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>도매처 선택</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="도매처를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>기본 마진율: {globalMargin}%</Label>
              <Slider
                value={[globalMargin]}
                onValueChange={(v) => setGlobalMargin(v[0])}
                min={0}
                max={100}
                step={5}
              />
            </div>

            {isSyncing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>동기화 중...</span>
                  <span>{syncProgress.current} / {syncProgress.total}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: syncProgress.total > 0
                        ? `${(syncProgress.current / syncProgress.total) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSyncDialog(false)} disabled={isSyncing}>
              취소
            </Button>
            <Button onClick={handleSyncServices} disabled={isSyncing || !selectedProvider}>
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  동기화 중...
                </>
              ) : (
                '동기화 시작'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Margin Dialog */}
      <Dialog open={showMarginDialog} onOpenChange={setShowMarginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              마진율 설정
            </DialogTitle>
            <DialogDescription>
              {marginTarget === 'selected'
                ? `선택된 ${selectedIds.size}개 서비스에 마진을 적용합니다.`
                : marginTarget === 'filtered'
                ? `필터된 ${filteredServices.length}개 서비스에 마진을 적용합니다.`
                : `전체 ${services.length}개 서비스에 마진을 적용합니다.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {marginTarget === 'all' && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    모든 서비스의 판매가격이 변경됩니다.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>적용 대상</Label>
              <Select value={marginTarget} onValueChange={(v) => setMarginTarget(v as typeof marginTarget)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 서비스 ({services.length}개)</SelectItem>
                  <SelectItem value="filtered">필터된 서비스 ({filteredServices.length}개)</SelectItem>
                  {selectedIds.size > 0 && (
                    <SelectItem value="selected">선택된 서비스 ({selectedIds.size}개)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>마진율: {globalMargin}%</Label>
              <Slider
                value={[globalMargin]}
                onValueChange={(v) => setGlobalMargin(v[0])}
                min={0}
                max={100}
                step={5}
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">예시 (원가 ₩1,000)</span>
                <span className="font-medium">→ 판매가 {formatCurrency(Math.ceil(1000 * (1 + globalMargin / 100)))}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarginDialog(false)} disabled={isApplyingMargin}>
              취소
            </Button>
            <Button onClick={handleApplyMargin} disabled={isApplyingMargin}>
              {isApplyingMargin ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  적용 중...
                </>
              ) : (
                '적용하기'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              서비스 수정
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>서비스명</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>판매가 (원)</Label>
                <Input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>마진율 (%)</Label>
                <Input
                  type="number"
                  value={editForm.margin}
                  onChange={(e) => setEditForm({ ...editForm, margin: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>최소 수량</Label>
                <Input
                  type="number"
                  value={editForm.min_quantity}
                  onChange={(e) => setEditForm({ ...editForm, min_quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>최대 수량</Label>
                <Input
                  type="number"
                  value={editForm.max_quantity}
                  onChange={(e) => setEditForm({ ...editForm, max_quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {selectedService && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono">{selectedService.provider_service_id}</span>
                  <span className="text-muted-foreground">원가</span>
                  <span>{formatCurrency(selectedService.rate || 0)}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isEditSubmitting}>
              취소
            </Button>
            <Button onClick={handleEditService} disabled={isEditSubmitting}>
              {isEditSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

