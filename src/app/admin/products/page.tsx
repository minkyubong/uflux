// ============================================
// 상품 관리 페이지
// 커스텀 상품 생성 + API 연결 (Fallback 포함)
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  Star,
  ArrowRight,
  Zap,
  RefreshCw,
  Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface ApiProvider {
  id: string;
  name: string;
  slug: string;
  api_url: string;
  api_key: string;
  is_active: boolean;
}

interface Category {
  id: string;
  platform: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_per_1000: number;
  min_quantity: number;
  max_quantity: number;
  primary_provider_id: string | null;
  primary_service_id: string | null;
  fallback1_provider_id: string | null;
  fallback1_service_id: string | null;
  fallback2_provider_id: string | null;
  fallback2_service_id: string | null;
  input_type: string;
  refill_days: number;
  avg_speed: string | null;
  sort_order: number;
  is_active: boolean;
  is_recommended: boolean;
  created_at: string;
  // Joined data
  category?: Category;
  primary_provider?: ApiProvider;
}

const INPUT_TYPES = [
  { value: 'link', label: '링크만' },
  { value: 'link_quantity', label: '링크 + 수량' },
  { value: 'link_comments', label: '링크 + 댓글 내용' },
  { value: 'link_usernames', label: '링크 + 사용자명' },
  { value: 'username', label: '사용자명만' },
  { value: 'custom', label: '커스텀' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showApiSection, setShowApiSection] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price_per_1000: 0,
    min_quantity: 10,
    max_quantity: 100000,
    primary_provider_id: '',
    primary_service_id: '',
    fallback1_provider_id: '',
    fallback1_service_id: '',
    fallback2_provider_id: '',
    fallback2_service_id: '',
    input_type: 'link',
    refill_days: 0,
    avg_speed: '',
    sort_order: 0,
    is_active: true,
    is_recommended: false,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch all data in parallel
    const [productsRes, categoriesRes, providersRes] = await Promise.all([
      (supabase as any)
        .from('admin_products')
        .select(`
          *,
          category:admin_categories(*),
          primary_provider:api_providers!admin_products_primary_provider_id_fkey(*)
        `)
        .order('sort_order', { ascending: true }),
      (supabase as any)
        .from('admin_categories')
        .select('*')
        .eq('is_active', true)
        .order('platform')
        .order('sort_order'),
      (supabase as any)
        .from('api_providers')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false }),
    ]);

    if (productsRes.error) {
      console.error('Products error:', productsRes.error);
      toast.error('상품 목록 로드 실패');
    } else {
      setProducts(productsRes.data || []);
    }

    if (categoriesRes.error) {
      console.error('Categories error:', categoriesRes.error);
    } else {
      setCategories(categoriesRes.data || []);
    }

    if (providersRes.error) {
      console.error('Providers error:', providersRes.error);
    } else {
      setProviders(providersRes.data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateDialog = () => {
    setSelectedProduct(null);
    setFormData({
      category_id: '',
      name: '',
      description: '',
      price_per_1000: 0,
      min_quantity: 10,
      max_quantity: 100000,
      primary_provider_id: '',
      primary_service_id: '',
      fallback1_provider_id: '',
      fallback1_service_id: '',
      fallback2_provider_id: '',
      fallback2_service_id: '',
      input_type: 'link',
      refill_days: 0,
      avg_speed: '',
      sort_order: 0,
      is_active: true,
      is_recommended: false,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      category_id: product.category_id,
      name: product.name,
      description: product.description || '',
      price_per_1000: product.price_per_1000,
      min_quantity: product.min_quantity,
      max_quantity: product.max_quantity,
      primary_provider_id: product.primary_provider_id || '',
      primary_service_id: product.primary_service_id || '',
      fallback1_provider_id: product.fallback1_provider_id || '',
      fallback1_service_id: product.fallback1_service_id || '',
      fallback2_provider_id: product.fallback2_provider_id || '',
      fallback2_service_id: product.fallback2_service_id || '',
      input_type: product.input_type || 'link',
      refill_days: product.refill_days || 0,
      avg_speed: product.avg_speed || '',
      sort_order: product.sort_order,
      is_active: product.is_active,
      is_recommended: product.is_recommended,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.category_id || !formData.name || formData.price_per_1000 <= 0) {
      toast.error('필수 필드를 입력해주세요');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        category_id: formData.category_id,
        name: formData.name,
        description: formData.description || null,
        price_per_1000: formData.price_per_1000,
        min_quantity: formData.min_quantity,
        max_quantity: formData.max_quantity,
        primary_provider_id: formData.primary_provider_id || null,
        primary_service_id: formData.primary_service_id || null,
        fallback1_provider_id: formData.fallback1_provider_id || null,
        fallback1_service_id: formData.fallback1_service_id || null,
        fallback2_provider_id: formData.fallback2_provider_id || null,
        fallback2_service_id: formData.fallback2_service_id || null,
        input_type: formData.input_type,
        refill_days: formData.refill_days,
        avg_speed: formData.avg_speed || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
        is_recommended: formData.is_recommended,
      };

      if (selectedProduct) {
        const { error } = await (supabase as any)
          .from('admin_products')
          .update(payload)
          .eq('id', selectedProduct.id);

        if (error) throw error;
        toast.success('상품이 수정되었습니다');
      } else {
        const { error } = await (supabase as any).from('admin_products').insert(payload);

        if (error) throw error;
        toast.success('새 상품이 추가되었습니다');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await (supabase as any)
        .from('admin_products')
        .delete()
        .eq('id', selectedProduct.id);

      if (error) throw error;
      toast.success('상품이 삭제되었습니다');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || '삭제 실패');
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      const { error } = await (supabase as any)
        .from('admin_products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;
      fetchData();
      toast.success(product.is_active ? '비활성화됨' : '활성화됨');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleRecommended = async (product: Product) => {
    try {
      const { error } = await (supabase as any)
        .from('admin_products')
        .update({ is_recommended: !product.is_recommended })
        .eq('id', product.id);

      if (error) throw error;
      fetchData();
      toast.success(product.is_recommended ? '추천 해제' : '추천 설정');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getProviderName = (providerId: string | null) => {
    if (!providerId) return '-';
    const provider = providers.find((p) => p.id === providerId);
    return provider?.name || '-';
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || product.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            상품 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            커스텀 상품을 만들고 API를 연결합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            상품 추가
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 상품
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              활성 상품
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {products.filter((p) => p.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              추천 상품
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {products.filter((p) => p.is_recommended).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API 연결됨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {products.filter((p) => p.primary_provider_id).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="상품명, 카테고리 검색..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="카테고리 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    [{cat.platform}] {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>상품 목록</CardTitle>
          <CardDescription>
            총 {filteredProducts.length}개의 상품
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">등록된 상품이 없습니다</p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                첫 상품 추가하기
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상태</TableHead>
                  <TableHead>상품명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>가격 (1,000개)</TableHead>
                  <TableHead>수량</TableHead>
                  <TableHead>API 연결</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.is_active}
                          onCheckedChange={() => toggleActive(product)}
                        />
                        {product.is_recommended && (
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      {product.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {product.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product.category?.platform} / {product.category?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(product.price_per_1000)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {product.min_quantity.toLocaleString()} ~{' '}
                        {product.max_quantity.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        {product.primary_provider_id ? (
                          <>
                            <Badge variant="secondary" className="text-xs">
                              {getProviderName(product.primary_provider_id)}
                            </Badge>
                            {product.fallback1_provider_id && (
                              <>
                                <ArrowRight className="h-3 w-3" />
                                <Badge variant="outline" className="text-xs">
                                  {getProviderName(product.fallback1_provider_id)}
                                </Badge>
                              </>
                            )}
                            {product.fallback2_provider_id && (
                              <>
                                <ArrowRight className="h-3 w-3" />
                                <Badge variant="outline" className="text-xs">
                                  {getProviderName(product.fallback2_provider_id)}
                                </Badge>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">미연결</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleRecommended(product)}
                          title={product.is_recommended ? '추천 해제' : '추천 설정'}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              product.is_recommended
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(product)}
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? '상품 수정' : '새 상품 추가'}
            </DialogTitle>
            <DialogDescription>
              상품 정보와 API 연결을 설정합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                기본 정보
              </h3>

              <div className="space-y-2">
                <Label htmlFor="category_id">카테고리 *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        [{cat.platform}] {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">상품명 *</Label>
                <Input
                  id="name"
                  placeholder="예: 인스타 한국인 팔로워 [실제/고품질]"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">상품 설명</Label>
                <Textarea
                  id="description"
                  placeholder="상품에 대한 상세 설명..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_per_1000">1,000개당 가격 (원) *</Label>
                  <Input
                    id="price_per_1000"
                    type="number"
                    placeholder="5000"
                    value={formData.price_per_1000}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_per_1000: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_quantity">최소 수량</Label>
                  <Input
                    id="min_quantity"
                    type="number"
                    placeholder="10"
                    value={formData.min_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_quantity: parseInt(e.target.value) || 10,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_quantity">최대 수량</Label>
                  <Input
                    id="max_quantity"
                    type="number"
                    placeholder="100000"
                    value={formData.max_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_quantity: parseInt(e.target.value) || 100000,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="input_type">입력 타입</Label>
                  <Select
                    value={formData.input_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, input_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INPUT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refill_days">리필 보장 (일)</Label>
                  <Input
                    id="refill_days"
                    type="number"
                    placeholder="0"
                    value={formData.refill_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        refill_days: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avg_speed">평균 속도</Label>
                  <Input
                    id="avg_speed"
                    placeholder="예: 1K/시간"
                    value={formData.avg_speed}
                    onChange={(e) =>
                      setFormData({ ...formData, avg_speed: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* API 연결 섹션 */}
            <Collapsible open={showApiSection} onOpenChange={setShowApiSection}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full">
                <div className="flex items-center gap-2 font-semibold">
                  <Server className="h-4 w-4" />
                  API 연결 (Fallback)
                </div>
                <ChevronDown
                  className={`h-4 w-4 ml-auto transition-transform ${
                    showApiSection ? 'rotate-180' : ''
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Primary API */}
                <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Badge className="bg-green-600">1순위</Badge>
                      Primary API
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">API 공급자</Label>
                        <Select
                          value={formData.primary_provider_id || '__none__'}
                          onValueChange={(value) =>
                            setFormData({ ...formData, primary_provider_id: value === '__none__' ? '' : value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="공급자 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">없음</SelectItem>
                            {providers.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id}>
                                {provider.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">서비스 ID</Label>
                        <Input
                          placeholder="예: 1234"
                          value={formData.primary_service_id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              primary_service_id: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fallback 1 */}
                <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Badge className="bg-amber-600">2순위</Badge>
                      Fallback #1
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">API 공급자</Label>
                        <Select
                          value={formData.fallback1_provider_id || '__none__'}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              fallback1_provider_id: value === '__none__' ? '' : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="공급자 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">없음</SelectItem>
                            {providers.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id}>
                                {provider.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">서비스 ID</Label>
                        <Input
                          placeholder="예: 5678"
                          value={formData.fallback1_service_id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fallback1_service_id: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fallback 2 */}
                <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Badge className="bg-red-600">3순위</Badge>
                      Fallback #2
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">API 공급자</Label>
                        <Select
                          value={formData.fallback2_provider_id || '__none__'}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              fallback2_provider_id: value === '__none__' ? '' : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="공급자 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">없음</SelectItem>
                            {providers.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id}>
                                {provider.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">서비스 ID</Label>
                        <Input
                          placeholder="예: 9012"
                          value={formData.fallback2_service_id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fallback2_service_id: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs text-muted-foreground">
                  <Zap className="inline h-3 w-3 mr-1" />
                  1순위 API 실패 시 자동으로 2순위 → 3순위 순으로 시도합니다
                </p>
              </CollapsibleContent>
            </Collapsible>

            {/* 추가 설정 */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">활성화</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_recommended"
                  checked={formData.is_recommended}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_recommended: checked })
                  }
                />
                <Label htmlFor="is_recommended">추천 상품</Label>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Label htmlFor="sort_order" className="text-sm">
                  정렬 순서:
                </Label>
                <Input
                  id="sort_order"
                  type="number"
                  className="w-20"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sort_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedProduct ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상품 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 &quot;{selectedProduct?.name}&quot; 상품을 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
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

