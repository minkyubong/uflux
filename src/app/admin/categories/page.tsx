// ============================================
// 카테고리 관리 페이지
// 플랫폼별 카테고리 추가/수정/삭제
// ============================================

'use client';

import { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Loader2,
  AlertCircle,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  MessageCircle,
  Music2,
  Globe,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Category {
  id: string;
  platform: string;
  name: string;
  name_en: string | null;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const PLATFORMS = [
  { id: 'instagram', name: '인스타그램', icon: Instagram, color: 'bg-pink-500' },
  { id: 'youtube', name: '유튜브', icon: Youtube, color: 'bg-red-500' },
  { id: 'tiktok', name: '틱톡', icon: Music2, color: 'bg-black' },
  { id: 'facebook', name: '페이스북', icon: Facebook, color: 'bg-blue-600' },
  { id: 'twitter', name: '트위터/X', icon: Twitter, color: 'bg-sky-500' },
  { id: 'telegram', name: '텔레그램', icon: MessageCircle, color: 'bg-blue-400' },
  { id: 'other', name: '기타', icon: Globe, color: 'bg-gray-500' },
];

const CATEGORY_ICONS = [
  'heart', 'users', 'eye', 'play', 'message-circle', 'share', 'bookmark',
  'thumbs-up', 'user-plus', 'video', 'image', 'star', 'zap', 'trending-up',
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    platform: 'instagram',
    name: '',
    name_en: '',
    slug: '',
    icon: '',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('admin_categories')
      .select('*')
      .order('platform')
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error('카테고리 목록 로드 실패');
      console.error(error);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const openCreateDialog = (platform?: string) => {
    setSelectedCategory(null);
    setFormData({
      platform: platform || selectedPlatform,
      name: '',
      name_en: '',
      slug: '',
      icon: '',
      sort_order: 0,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      platform: category.platform,
      name: category.name,
      name_en: category.name_en || '',
      slug: category.slug,
      icon: category.icon || '',
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug || !formData.platform) {
      toast.error('필수 필드를 입력해주세요');
      return;
    }

    setSaving(true);

    try {
      if (selectedCategory) {
        // Update
        const { error } = await (supabase as any)
          .from('admin_categories')
          .update({
            platform: formData.platform,
            name: formData.name,
            name_en: formData.name_en || null,
            slug: formData.slug,
            icon: formData.icon || null,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
          })
          .eq('id', selectedCategory.id);

        if (error) throw error;
        toast.success('카테고리가 수정되었습니다');
      } else {
        // Create
        const { error } = await (supabase as any)
          .from('admin_categories')
          .insert({
            platform: formData.platform,
            name: formData.name,
            name_en: formData.name_en || null,
            slug: formData.slug,
            icon: formData.icon || null,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast.success('새 카테고리가 추가되었습니다');
      }

      setIsDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      const { error } = await (supabase as any)
        .from('admin_categories')
        .delete()
        .eq('id', selectedCategory.id);

      if (error) throw error;
      toast.success('카테고리가 삭제되었습니다');
      setIsDeleteDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || '삭제 실패');
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      const { error } = await (supabase as any)
        .from('admin_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;
      fetchCategories();
      toast.success(category.is_active ? '비활성화됨' : '활성화됨');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[가-힣]/g, '') // Remove Korean characters
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .trim();
  };

  const getCategoriesByPlatform = (platform: string) => {
    return categories.filter((c) => c.platform === platform);
  };

  const getPlatformInfo = (platformId: string) => {
    return PLATFORMS.find((p) => p.id === platformId) || PLATFORMS[6]; // Default to 'other'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderTree className="h-6 w-6" />
            카테고리 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            플랫폼별 서비스 카테고리를 관리합니다
          </p>
        </div>
        <Button onClick={() => openCreateDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          카테고리 추가
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 카테고리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              활성 카테고리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {categories.filter((c) => c.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              플랫폼 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Set(categories.map((c) => c.platform)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              비활성 카테고리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {categories.filter((c) => !c.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>플랫폼별 카테고리</CardTitle>
          <CardDescription>각 플랫폼의 카테고리를 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <TabsList className="mb-4 flex-wrap h-auto gap-2">
                {PLATFORMS.map((platform) => {
                  const PlatformIcon = platform.icon;
                  const count = getCategoriesByPlatform(platform.id).length;
                  return (
                    <TabsTrigger
                      key={platform.id}
                      value={platform.id}
                      className="flex items-center gap-2"
                    >
                      <PlatformIcon className="h-4 w-4" />
                      {platform.name}
                      {count > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {PLATFORMS.map((platform) => (
                <TabsContent key={platform.id} value={platform.id}>
                  {getCategoriesByPlatform(platform.id).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {platform.name}에 등록된 카테고리가 없습니다
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => openCreateDialog(platform.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        첫 카테고리 추가하기
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead>카테고리명</TableHead>
                          <TableHead>영문명</TableHead>
                          <TableHead>슬러그</TableHead>
                          <TableHead>순서</TableHead>
                          <TableHead className="text-right">액션</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getCategoriesByPlatform(platform.id).map((category) => (
                          <TableRow key={category.id}>
                            <TableCell>
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={category.is_active}
                                onCheckedChange={() => toggleActive(category)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{category.name}</div>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground">
                                {category.name_en || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {category.slug}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{category.sort_order}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(category)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => openDeleteDialog(category)}
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
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? '카테고리 수정' : '새 카테고리 추가'}
            </DialogTitle>
            <DialogDescription>카테고리 정보를 입력하세요</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="platform">플랫폼</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) =>
                  setFormData({ ...formData, platform: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="플랫폼 선택" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => {
                    const PlatformIcon = platform.icon;
                    return (
                      <SelectItem key={platform.id} value={platform.id}>
                        <div className="flex items-center gap-2">
                          <PlatformIcon className="h-4 w-4" />
                          {platform.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">카테고리명 (한글)</Label>
                <Input
                  id="name"
                  placeholder="예: 팔로워"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      ...formData,
                      name,
                      slug: formData.slug || generateSlug(formData.name_en || name),
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">영문명</Label>
                <Input
                  id="name_en"
                  placeholder="예: Followers"
                  value={formData.name_en}
                  onChange={(e) => {
                    const name_en = e.target.value;
                    setFormData({
                      ...formData,
                      name_en,
                      slug: generateSlug(name_en) || formData.slug,
                    });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">슬러그</Label>
                <Input
                  id="slug"
                  placeholder="예: followers"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/\s/g, '-'),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">정렬 순서</Label>
                <Input
                  id="sort_order"
                  type="number"
                  placeholder="0"
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

            <div className="space-y-2">
              <Label htmlFor="icon">아이콘</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="아이콘 선택 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedCategory ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 &quot;{selectedCategory?.name}&quot; 카테고리를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없으며, 해당 카테고리의 모든 상품도 함께 삭제됩니다.
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

