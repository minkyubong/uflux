// ============================================
// 새 주문 페이지
// admin_categories + admin_products 사용
// 라이크스토어/인스타겟 스타일 참고
// ============================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  ShoppingCart,
  Link as LinkIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Star,
  Zap,
  Clock,
  Shield,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  Package,
  CreditCard,
  Info,
} from 'lucide-react';
import {
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaFacebook,
  FaTelegram,
  FaTwitter,
  FaDiscord,
  FaSpotify,
  FaSoundcloud,
} from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';

// 플랫폼 아이콘 매핑
const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: FaInstagram,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  facebook: FaFacebook,
  twitter: FaTwitter,
  telegram: FaTelegram,
  threads: SiThreads,
  discord: FaDiscord,
  spotify: FaSpotify,
  soundcloud: FaSoundcloud,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-500',
  youtube: 'from-red-500 to-red-600',
  tiktok: 'from-gray-900 to-gray-800',
  facebook: 'from-blue-600 to-blue-700',
  twitter: 'from-sky-400 to-sky-500',
  telegram: 'from-blue-400 to-blue-500',
  threads: 'from-gray-800 to-gray-900',
  discord: 'from-indigo-500 to-indigo-600',
  spotify: 'from-green-500 to-green-600',
  soundcloud: 'from-orange-500 to-orange-600',
};

const PLATFORM_NAMES: Record<string, string> = {
  instagram: '인스타그램',
  youtube: '유튜브',
  tiktok: '틱톡',
  facebook: '페이스북',
  twitter: '트위터/X',
  telegram: '텔레그램',
  threads: '스레드',
  discord: '디스코드',
  spotify: '스포티파이',
  soundcloud: '사운드클라우드',
  other: '기타',
};

// 플랫폼별 링크 플레이스홀더
const PLATFORM_PLACEHOLDERS: Record<string, string> = {
  instagram: 'https://instagram.com/username 또는 게시물 링크',
  youtube: 'https://youtube.com/watch?v=... 또는 채널 링크',
  tiktok: 'https://tiktok.com/@username/video/...',
  facebook: 'https://facebook.com/... 페이지 또는 게시물 링크',
  twitter: 'https://twitter.com/username 또는 트윗 링크',
  telegram: 'https://t.me/channel_name 또는 게시물 링크',
  threads: 'https://threads.net/@username',
  discord: 'https://discord.gg/invite_code',
  spotify: 'https://open.spotify.com/track/... 또는 아티스트 링크',
  soundcloud: 'https://soundcloud.com/artist/track',
  other: '서비스 링크를 입력하세요',
};

interface Category {
  id: string;
  platform: string;
  name: string;
  name_en: string | null;
  slug: string;
  sort_order: number;
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
  input_type: string;
  refill_days: number;
  avg_speed: string | null;
  is_active: boolean;
  is_recommended: boolean;
  sort_order: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { profile } = useAuth();

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Order form states
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState<number>(100);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories and products
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [categoriesRes, productsRes] = await Promise.all([
        supabase
          .from('admin_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('admin_products')
          .select('*')
          .eq('is_active', true)
          .order('sort_order'),
      ]);

      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      if (productsRes.data) {
        setProducts(productsRes.data);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  // Get unique platforms from categories
  const platforms = useMemo(() => {
    const platformSet = new Set(categories.map((c) => c.platform));
    return Array.from(platformSet);
  }, [categories]);

  // Get categories for selected platform
  const platformCategories = useMemo(() => {
    return categories.filter((c) => c.platform === selectedPlatform);
  }, [categories, selectedPlatform]);

  // Get products for selected category
  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter((p) => p.category_id === selectedCategory);
  }, [products, selectedCategory]);

  // Calculate price
  const totalPrice = useMemo(() => {
    if (!selectedProduct || !quantity) return 0;
    return (selectedProduct.price_per_1000 / 1000) * quantity;
  }, [selectedProduct, quantity]);

  // Handle platform change
  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform);
    setSelectedCategory('');
    setSelectedProduct(null);
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedProduct(null);
  };

  // Handle product change
  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product || null);
    if (product) {
      setQuantity(product.min_quantity);
    }
  };

  // Validate order
  const validateOrder = () => {
    if (!selectedProduct) {
      toast.error('상품을 선택해주세요');
      return false;
    }
    if (!link.trim()) {
      toast.error('링크를 입력해주세요');
      return false;
    }
    if (quantity < selectedProduct.min_quantity || quantity > selectedProduct.max_quantity) {
      toast.error(`수량은 ${selectedProduct.min_quantity} ~ ${selectedProduct.max_quantity} 사이여야 합니다`);
      return false;
    }
    if (!profile) {
      toast.error('로그인이 필요합니다');
      return false;
    }
    if ((profile.balance || 0) < totalPrice) {
      toast.error('잔액이 부족합니다');
      return false;
    }
    return true;
  };

  // Submit order
  const handleSubmit = async () => {
    if (!validateOrder()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct!.id,
          link: link.trim(),
          quantity,
          comments: comments.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Success confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast.success('주문이 완료되었습니다!');

        // Reset form
        setLink('');
        setQuantity(selectedProduct?.min_quantity || 100);
        setComments('');

        // Redirect to orders
        router.push('/orders');
      } else {
        toast.error(data.error || '주문 처리 실패');
      }
    } catch (error) {
      toast.error('주문 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (platforms.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">새 주문</h1>
            <p className="text-muted-foreground">SNS 서비스를 주문하세요</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">서비스 준비 중</h3>
            <p className="text-muted-foreground mb-4">
              현재 서비스를 준비하고 있습니다.<br />
              곧 새로운 상품들로 찾아뵙겠습니다.
            </p>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              대시보드로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            새 주문
          </h1>
          <p className="text-muted-foreground">원하는 서비스를 선택하고 주문하세요</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">내 잔액</p>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(profile?.balance || 0)}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Selection Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Tabs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">1. 플랫폼 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => {
                  const Icon = PLATFORM_ICONS[platform] || Package;
                  const isActive = selectedPlatform === platform;
                  const colorClass = PLATFORM_COLORS[platform] || 'from-gray-500 to-gray-600';

                  return (
                    <Button
                      key={platform}
                      variant={isActive ? 'default' : 'outline'}
                      className={cn(
                        'flex items-center gap-2 transition-all',
                        isActive && `bg-gradient-to-r ${colorClass} border-0 text-white`
                      )}
                      onClick={() => handlePlatformChange(platform)}
                    >
                      <Icon className="h-4 w-4" />
                      {PLATFORM_NAMES[platform] || platform}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Category Selection */}
          {platformCategories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">2. 카테고리 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {platformCategories.map((category) => {
                    const isActive = selectedCategory === category.id;
                    return (
                      <Button
                        key={category.id}
                        variant={isActive ? 'default' : 'outline'}
                        className={cn(
                          'h-auto py-3 flex flex-col items-center gap-1',
                          isActive && 'ring-2 ring-primary ring-offset-2'
                        )}
                        onClick={() => handleCategoryChange(category.id)}
                      >
                        <span className="font-medium">{category.name}</span>
                        {category.name_en && (
                          <span className="text-xs opacity-70">{category.name_en}</span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Selection */}
          {selectedCategory && categoryProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">3. 상품 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedProduct?.id || ''}
                  onValueChange={handleProductChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="상품을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          {product.is_recommended && (
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          )}
                          <span>{product.name}</span>
                          <span className="text-muted-foreground">
                            ({formatCurrency(product.price_per_1000)}/1K)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selected Product Details */}
                {selectedProduct && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {selectedProduct.name}
                          {selectedProduct.is_recommended && (
                            <Badge className="bg-amber-500 text-white">추천</Badge>
                          )}
                        </h4>
                        {selectedProduct.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedProduct.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">
                          {formatCurrency(selectedProduct.price_per_1000)}
                        </p>
                        <p className="text-xs text-muted-foreground">1,000개당</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {selectedProduct.min_quantity.toLocaleString()} ~ {selectedProduct.max_quantity.toLocaleString()}
                      </Badge>
                      {selectedProduct.avg_speed && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {selectedProduct.avg_speed}
                        </Badge>
                      )}
                      {selectedProduct.refill_days > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          {selectedProduct.refill_days}일 리필
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Form */}
          {selectedProduct && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">4. 주문 정보 입력</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Link Input */}
                <div className="space-y-2">
                  <Label htmlFor="link" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    링크 *
                  </Label>
                  <Input
                    id="link"
                    placeholder={PLATFORM_PLACEHOLDERS[selectedPlatform] || PLATFORM_PLACEHOLDERS.other}
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    서비스를 적용할 게시물/프로필 링크를 입력하세요
                  </p>
                </div>

                {/* Quantity Input */}
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    수량 *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={selectedProduct.min_quantity}
                    max={selectedProduct.max_quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    최소 {selectedProduct.min_quantity.toLocaleString()} ~ 최대 {selectedProduct.max_quantity.toLocaleString()}
                  </p>
                </div>

                {/* Comments (for comment services) */}
                {selectedProduct.input_type === 'link_comments' && (
                  <div className="space-y-2">
                    <Label htmlFor="comments" className="flex items-center gap-2">
                      댓글 내용
                    </Label>
                    <Textarea
                      id="comments"
                      placeholder="댓글 내용을 입력하세요 (줄바꿈으로 구분)"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={4}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                주문 요약
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProduct ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">상품</span>
                      <span className="font-medium truncate max-w-[150px]">
                        {selectedProduct.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">단가</span>
                      <span>{formatCurrency(selectedProduct.price_per_1000)}/1K</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">수량</span>
                      <span>{quantity.toLocaleString()}개</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">총 결제금액</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Balance Check */}
                  {profile && (
                    <div className={cn(
                      'p-3 rounded-lg text-sm',
                      (profile.balance || 0) >= totalPrice
                        ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                        : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                    )}>
                      <div className="flex items-center gap-2">
                        {(profile.balance || 0) >= totalPrice ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span>
                          {(profile.balance || 0) >= totalPrice
                            ? `결제 가능 (잔액: ${formatCurrency(profile.balance || 0)})`
                            : `잔액 부족 (${formatCurrency((profile.balance || 0) - totalPrice)} 부족)`}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full h-12 text-lg"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !link || (profile?.balance || 0) < totalPrice}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        주문 처리 중...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        주문하기
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>상품을 선택해주세요</p>
                </div>
              )}

              {/* Info */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>주문 후 자동으로 처리됩니다</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>안전한 결제 시스템</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Charge Card */}
          {profile && (profile.balance || 0) < totalPrice && (
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">잔액이 부족하신가요?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  지금 충전하고 바로 주문하세요!
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/deposit')}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  충전하러 가기
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

