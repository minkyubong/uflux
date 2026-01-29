// ============================================
// 서비스 대량 가져오기 모달
// 플랫폼별 카테고리 매핑 및 마진 설정
// ============================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Loader2,
  Download,
  Plus,
  Settings,
  DollarSign,
  Tag,
  Languages,
} from 'lucide-react';
import {
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaFacebook,
  FaTwitter,
  FaTelegram,
} from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

interface Category {
  id: string;
  platform: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface PlatformSettings {
  category_id: string;
  category_name?: string;
  margin_type: 'percent' | 'fixed';
  margin_value: number;
  name_prefix: string;
  name_suffix: string;
  auto_translate: boolean;
}

interface ImportServicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  selectedServices: ProviderService[];
  onSuccess: () => void;
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: FaInstagram,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  facebook: FaFacebook,
  twitter: FaTwitter,
  telegram: FaTelegram,
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: '인스타그램',
  youtube: '유튜브',
  tiktok: '틱톡',
  facebook: '페이스북',
  twitter: '트위터',
  telegram: '텔레그램',
  threads: '스레드',
  twitch: '트위치',
  discord: '디스코드',
  spotify: '스포티파이',
  linkedin: '링크드인',
  soundcloud: '사운드클라우드',
  other: '기타',
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

const USD_TO_KRW = 1400;

export function ImportServicesModal({
  open,
  onOpenChange,
  providerId,
  selectedServices,
  onSuccess,
}: ImportServicesModalProps) {
  const [importing, setImporting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [platformSettings, setPlatformSettings] = useState<Record<string, PlatformSettings>>({});
  const [activeTab, setActiveTab] = useState<string>('');

  // Group services by platform
  const servicesByPlatform = useMemo(() => {
    const grouped: Record<string, ProviderService[]> = {};
    selectedServices.forEach((service) => {
      const platform = service.detected_platform || 'other';
      if (!grouped[platform]) {
        grouped[platform] = [];
      }
      grouped[platform].push(service);
    });
    return grouped;
  }, [selectedServices]);

  const platforms = Object.keys(servicesByPlatform);

  // Load categories
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('admin_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (data) {
        setCategories(data);
      }
    }

    if (open) {
      fetchCategories();
    }
  }, [open]);

  // Initialize platform settings
  useEffect(() => {
    const initialSettings: Record<string, PlatformSettings> = {};
    platforms.forEach((platform) => {
      if (!platformSettings[platform]) {
        // Find default category for this platform
        const defaultCategory = categories.find(
          (c) => c.platform === platform
        );

        initialSettings[platform] = {
          category_id: defaultCategory?.id || '',
          margin_type: 'percent',
          margin_value: 30,
          name_prefix: '',
          name_suffix: '',
          auto_translate: true,
        };
      } else {
        initialSettings[platform] = platformSettings[platform];
      }
    });

    if (Object.keys(initialSettings).length > 0) {
      setPlatformSettings(initialSettings);
    }

    // Set active tab if not set
    if (!activeTab && platforms.length > 0) {
      setActiveTab(platforms[0]);
    }
  }, [platforms, categories, open]);

  // Update platform setting
  const updateSetting = (
    platform: string,
    key: keyof PlatformSettings,
    value: string | number | boolean
  ) => {
    setPlatformSettings((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [key]: value,
      },
    }));
  };

  // Calculate preview price
  const calculatePreviewPrice = (rate: number, settings: PlatformSettings) => {
    let priceKrw = rate * USD_TO_KRW;
    if (settings.margin_type === 'percent') {
      priceKrw = priceKrw * (1 + settings.margin_value / 100);
    } else {
      priceKrw = priceKrw + settings.margin_value;
    }
    return Math.ceil(priceKrw / 100) * 100;
  };

  // Get categories for platform
  const getCategoriesForPlatform = (platform: string) => {
    return categories.filter((c) => c.platform === platform);
  };

  // Handle import
  const handleImport = async () => {
    // Validate all platforms have category set
    for (const platform of platforms) {
      const settings = platformSettings[platform];
      if (!settings?.category_id && !settings?.category_name) {
        toast.error(`${PLATFORM_LABELS[platform] || platform} 플랫폼의 카테고리를 선택해주세요`);
        setActiveTab(platform);
        return;
      }
    }

    setImporting(true);

    try {
      const response = await fetch(
        `/api/admin/providers/${providerId}/import-services`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_ids: selectedServices.map((s) => s.service_id),
            settings: platformSettings,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        if (data.errors && data.errors.length > 0) {
          toast.warning(`일부 오류 발생: ${data.errors.length}개`);
          console.error('Import errors:', data.errors);
        }
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.error || '가져오기 실패');
      }
    } catch (error) {
      toast.error('가져오기 중 오류 발생');
    } finally {
      setImporting(false);
    }
  };

  if (selectedServices.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            서비스 대량 가져오기
          </DialogTitle>
          <DialogDescription>
            선택한 {selectedServices.length}개 서비스를 플랫폼별로 설정하여 상품으로 등록합니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary */}
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => {
              const Icon = PLATFORM_ICONS[platform];
              const count = servicesByPlatform[platform].length;

              return (
                <Badge
                  key={platform}
                  className={cn('gap-1 cursor-pointer', PLATFORM_COLORS[platform] || PLATFORM_COLORS.other)}
                  onClick={() => setActiveTab(platform)}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {PLATFORM_LABELS[platform] || platform}: {count}개
                </Badge>
              );
            })}
          </div>

          {/* Platform Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-1">
              {platforms.map((platform) => {
                const Icon = PLATFORM_ICONS[platform];
                return (
                  <TabsTrigger
                    key={platform}
                    value={platform}
                    className="text-xs gap-1"
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {PLATFORM_LABELS[platform] || platform}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {platforms.map((platform) => {
              const settings = platformSettings[platform];
              const platformCategories = getCategoriesForPlatform(platform);
              const services = servicesByPlatform[platform];

              if (!settings) return null;

              return (
                <TabsContent key={platform} value={platform} className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        {PLATFORM_LABELS[platform] || platform} 설정
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Category Selection */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          카테고리
                        </Label>
                        <div className="flex gap-2">
                          <Select
                            value={settings.category_id || '__new__'}
                            onValueChange={(v) => {
                              if (v === '__new__') {
                                updateSetting(platform, 'category_id', '');
                              } else {
                                updateSetting(platform, 'category_id', v);
                                updateSetting(platform, 'category_name', '');
                              }
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="카테고리 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {platformCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                              <SelectItem value="__new__">
                                <span className="flex items-center gap-1">
                                  <Plus className="h-3 w-3" />
                                  새 카테고리 생성
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {!settings.category_id && (
                            <Input
                              placeholder="새 카테고리 이름"
                              value={settings.category_name || ''}
                              onChange={(e) =>
                                updateSetting(platform, 'category_name', e.target.value)
                              }
                              className="flex-1"
                            />
                          )}
                        </div>
                      </div>

                      {/* Price Margin */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          가격 마진 (원가: USD → 판매가: KRW)
                        </Label>
                        <div className="flex gap-2">
                          <Select
                            value={settings.margin_type}
                            onValueChange={(v: 'percent' | 'fixed') =>
                              updateSetting(platform, 'margin_type', v)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percent">퍼센트 (%)</SelectItem>
                              <SelectItem value="fixed">고정 (원)</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={settings.margin_value}
                            onChange={(e) =>
                              updateSetting(platform, 'margin_value', parseFloat(e.target.value) || 0)
                            }
                            className="w-32"
                          />
                          <span className="text-sm text-muted-foreground self-center">
                            {settings.margin_type === 'percent' ? '%' : '원'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          환율: $1 = {USD_TO_KRW.toLocaleString()}원
                        </p>
                      </div>

                      {/* Name Options */}
                      <div className="space-y-2">
                        <Label>상품명 옵션</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Input
                              placeholder="접두어 (예: [HOT])"
                              value={settings.name_prefix}
                              onChange={(e) =>
                                updateSetting(platform, 'name_prefix', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="접미어 (예: - 빠른배송)"
                              value={settings.name_suffix}
                              onChange={(e) =>
                                updateSetting(platform, 'name_suffix', e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Switch
                            id={`translate-${platform}`}
                            checked={settings.auto_translate}
                            onCheckedChange={(checked) =>
                              updateSetting(platform, 'auto_translate', checked)
                            }
                          />
                          <Label
                            htmlFor={`translate-${platform}`}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <Languages className="h-4 w-4" />
                            자동 번역 (영어 → 한글 키워드)
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preview */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">미리보기 (처음 3개)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {services.slice(0, 3).map((service) => {
                          const previewPrice = calculatePreviewPrice(service.rate, settings);
                          let previewName = service.name;
                          if (settings.name_prefix) {
                            previewName = `${settings.name_prefix} ${previewName}`;
                          }
                          if (settings.name_suffix) {
                            previewName = `${previewName} ${settings.name_suffix}`;
                          }

                          return (
                            <div
                              key={service.id}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                            >
                              <span className="truncate flex-1">{previewName}</span>
                              <div className="flex items-center gap-4 shrink-0">
                                <span className="text-muted-foreground">
                                  ${service.rate?.toFixed(4)}
                                </span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-semibold">
                                  ₩{previewPrice.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {services.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center py-1">
                            외 {services.length - 3}개 더...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            취소
          </Button>
          <Button onClick={handleImport} disabled={importing}>
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                가져오는 중...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {selectedServices.length}개 상품 생성
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
