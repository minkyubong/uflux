// ============================================
// 공급자 서비스 목록 페이지
// 서비스 동기화, 필터링, 대량 가져오기
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Package,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Download,
  ArrowLeft,
  Globe,
  DollarSign,
} from 'lucide-react';
import {
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaFacebook,
  FaTwitter,
  FaTelegram,
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ImportServicesModal } from './import-modal';

interface ProviderService {
  id: string;
  provider_id: string;
  service_id: string;
  name: string;
  category: string | null;
  rate: number;
  min_quantity: number;
  max_quantity: number;
  description: string | null;
  refill: boolean;
  cancel: boolean;
  detected_platform: string | null;
  detected_type: string | null;
  detected_region: string | null;
  is_imported: boolean;
  imported_product_id: string | null;
  last_synced_at: string;
}

interface Provider {
  id: string;
  name: string;
  slug: string;
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: FaInstagram,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  facebook: FaFacebook,
  twitter: FaTwitter,
  telegram: FaTelegram,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  youtube: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  tiktok: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  facebook: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  twitter: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  telegram: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const REGION_LABELS: Record<string, string> = {
  korean: '한국',
  worldwide: '글로벌',
  usa: '미국',
  india: '인도',
  brazil: '브라질',
  arab: '아랍',
  turkey: '터키',
  russia: '러시아',
  japan: '일본',
  china: '중국',
};

export default function ProviderServicesPage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.id as string;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Filters
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [importedFilter, setImportedFilter] = useState('all');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);

  // Fetch provider info
  useEffect(() => {
    async function fetchProvider() {
      const { data, error } = await (supabase as any)
        .from('api_providers')
        .select('id, name, slug')
        .eq('id', providerId)
        .single();

      if (data && !error) {
        setProvider(data);
      }
    }
    fetchProvider();
  }, [providerId]);

  // Fetch services
  const fetchServices = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append('search', search);
    if (platformFilter !== 'all') params.append('platform', platformFilter);
    if (typeFilter !== 'all') params.append('type', typeFilter);
    if (regionFilter !== 'all') params.append('region', regionFilter);
    if (importedFilter !== 'all') params.append('imported', importedFilter);

    const response = await fetch(
      `/api/admin/providers/${providerId}/services?${params.toString()}`
    );
    const data = await response.json();

    if (data.success) {
      setServices(data.services);
      setTotalCount(data.total);
    } else {
      toast.error(data.error || '서비스 목록 로드 실패');
    }

    setLoading(false);
  }, [providerId, page, limit, search, platformFilter, typeFilter, regionFilter, importedFilter]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Sync services from provider API
  const handleSync = async () => {
    setSyncing(true);
    toast.info('서비스 동기화 중...');

    try {
      const response = await fetch(
        `/api/admin/providers/${providerId}/sync-services`,
        { method: 'POST' }
      );
      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchServices();
      } else {
        toast.error(data.error || '동기화 실패');
      }
    } catch (error) {
      toast.error('동기화 중 오류 발생');
    } finally {
      setSyncing(false);
    }
  };

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === services.filter((s) => !s.is_imported).length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(services.filter((s) => !s.is_imported).map((s) => s.service_id)));
    }
  };

  const selectedServices = services.filter((s) => selectedIds.has(s.service_id));

  // Get unique values for filters
  const platforms = [...new Set(services.map((s) => s.detected_platform).filter(Boolean))];
  const types = [...new Set(services.map((s) => s.detected_type).filter(Boolean))];
  const regions = [...new Set(services.map((s) => s.detected_region).filter(Boolean))];

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/providers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              {provider?.name || '공급자'} 서비스 목록
            </h1>
            <p className="text-muted-foreground mt-1">
              총 {totalCount.toLocaleString()}개 서비스
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            서비스 동기화
          </Button>
          {selectedIds.size > 0 && (
            <Button onClick={() => setShowImportModal(true)}>
              <Download className="mr-2 h-4 w-4" />
              {selectedIds.size}개 가져오기
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 서비스
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              등록됨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {services.filter((s) => s.is_imported).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              미등록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {services.filter((s) => !s.is_imported).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              선택됨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {selectedIds.size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="서비스명 검색..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={platformFilter}
              onValueChange={(v) => {
                setPlatformFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="플랫폼" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 플랫폼</SelectItem>
                {platforms.map((p) => (
                  <SelectItem key={p} value={p!}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={regionFilter}
              onValueChange={(v) => {
                setRegionFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="지역" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 지역</SelectItem>
                <SelectItem value="korean">한국</SelectItem>
                <SelectItem value="worldwide">글로벌</SelectItem>
                {regions
                  .filter((r) => r !== 'korean' && r !== 'worldwide')
                  .map((r) => (
                    <SelectItem key={r} value={r!}>
                      {REGION_LABELS[r!] || r}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select
              value={importedFilter}
              onValueChange={(v) => {
                setImportedFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="false">미등록</SelectItem>
                <SelectItem value="true">등록됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {totalCount === 0
                  ? '동기화된 서비스가 없습니다'
                  : '검색 결과가 없습니다'}
              </p>
              {totalCount === 0 && (
                <Button onClick={handleSync} disabled={syncing}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  서비스 동기화하기
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedIds.size > 0 &&
                          selectedIds.size === services.filter((s) => !s.is_imported).length
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>서비스명</TableHead>
                    <TableHead className="w-28">플랫폼</TableHead>
                    <TableHead className="w-24">지역</TableHead>
                    <TableHead className="w-28">원가/1K</TableHead>
                    <TableHead className="w-32">수량</TableHead>
                    <TableHead className="w-24">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => {
                    const PlatformIcon =
                      PLATFORM_ICONS[service.detected_platform || ''] || Globe;
                    const platformColor =
                      PLATFORM_COLORS[service.detected_platform || ''] ||
                      PLATFORM_COLORS.other;

                    return (
                      <TableRow
                        key={service.id}
                        className={cn(
                          service.is_imported && 'bg-muted/30',
                          selectedIds.has(service.service_id) && 'bg-primary/5'
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(service.service_id)}
                            onCheckedChange={() => toggleSelect(service.service_id)}
                            disabled={service.is_imported}
                          />
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">{service.service_id}</code>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px]">
                            <p className="font-medium truncate">{service.name}</p>
                            {service.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {service.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('gap-1', platformColor)}>
                            <PlatformIcon className="h-3 w-3" />
                            {service.detected_platform || 'other'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {REGION_LABELS[service.detected_region || ''] ||
                              service.detected_region ||
                              '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono">
                              {service.rate?.toFixed(4) || '0'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {service.min_quantity?.toLocaleString()} ~{' '}
                            {service.max_quantity?.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {service.is_imported ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              등록됨
                            </Badge>
                          ) : (
                            <Badge variant="outline">미등록</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">
                  총 {totalCount.toLocaleString()}개 중 {(page - 1) * limit + 1} ~{' '}
                  {Math.min(page * limit, totalCount)}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Import Modal */}
      <ImportServicesModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        providerId={providerId}
        selectedServices={selectedServices}
        onSuccess={() => {
          setSelectedIds(new Set());
          fetchServices();
        }}
      />
    </div>
  );
}
