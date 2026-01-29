// ============================================
// 사이드바 메뉴 관리 페이지
// 동적 메뉴 추가/수정/삭제/정렬
// ============================================

'use client';

import { useState, useEffect } from 'react';
import {
  Menu,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Loader2,
  AlertCircle,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
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
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AdminMenu {
  id: string;
  name: string;
  href: string;
  icon: string | null;
  badge: string | null;
  badge_color: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  is_admin_only: boolean;
  created_at: string;
  updated_at: string;
}

// Lucide 아이콘 목록
const AVAILABLE_ICONS = [
  'home', 'layout-dashboard', 'shopping-cart', 'history', 'credit-card',
  'settings', 'help-circle', 'user', 'users', 'bell', 'mail', 'message-circle',
  'heart', 'star', 'bookmark', 'folder', 'file-text', 'image', 'video',
  'music', 'calendar', 'clock', 'map-pin', 'globe', 'link', 'share',
  'download', 'upload', 'refresh-cw', 'trending-up', 'bar-chart', 'pie-chart',
  'gift', 'zap', 'sparkles', 'crown', 'shield', 'lock', 'key',
  'instagram', 'youtube', 'facebook', 'twitter', 'tiktok',
];

const BADGE_COLORS = [
  { value: 'default', label: '기본 (회색)', class: 'bg-muted text-muted-foreground' },
  { value: 'primary', label: '파란색', class: 'bg-primary text-primary-foreground' },
  { value: 'success', label: '초록색', class: 'bg-green-500 text-white' },
  { value: 'warning', label: '노란색', class: 'bg-amber-500 text-white' },
  { value: 'danger', label: '빨간색', class: 'bg-red-500 text-white' },
  { value: 'purple', label: '보라색', class: 'bg-purple-500 text-white' },
  { value: 'pink', label: '분홍색', class: 'bg-pink-500 text-white' },
];

export default function MenusPage() {
  const [menus, setMenus] = useState<AdminMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<AdminMenu | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    href: '',
    icon: '',
    badge: '',
    badge_color: '',
    parent_id: '',
    sort_order: 0,
    is_active: true,
    is_admin_only: false,
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('admin_menus')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error('메뉴 목록 로드 실패');
      console.error(error);
    } else {
      setMenus(data || []);
    }
    setLoading(false);
  };

  const openCreateDialog = () => {
    setSelectedMenu(null);
    setFormData({
      name: '',
      href: '',
      icon: '',
      badge: '',
      badge_color: '',
      parent_id: '',
      sort_order: menus.length,
      is_active: true,
      is_admin_only: false,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (menu: AdminMenu) => {
    setSelectedMenu(menu);
    setFormData({
      name: menu.name,
      href: menu.href,
      icon: menu.icon || '',
      badge: menu.badge || '',
      badge_color: menu.badge_color || '',
      parent_id: menu.parent_id || '',
      sort_order: menu.sort_order,
      is_active: menu.is_active,
      is_admin_only: menu.is_admin_only,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (menu: AdminMenu) => {
    setSelectedMenu(menu);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.href) {
      toast.error('메뉴 이름과 경로를 입력해주세요');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        href: formData.href,
        icon: formData.icon || null,
        badge: formData.badge || null,
        badge_color: formData.badge_color || null,
        parent_id: formData.parent_id || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
        is_admin_only: formData.is_admin_only,
      };

      if (selectedMenu) {
        const { error } = await (supabase as any)
          .from('admin_menus')
          .update(payload)
          .eq('id', selectedMenu.id);

        if (error) throw error;
        toast.success('메뉴가 수정되었습니다');
      } else {
        const { error } = await (supabase as any).from('admin_menus').insert(payload);

        if (error) throw error;
        toast.success('새 메뉴가 추가되었습니다');
      }

      setIsDialogOpen(false);
      fetchMenus();
    } catch (error: any) {
      toast.error(error.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMenu) return;

    try {
      const { error } = await (supabase as any)
        .from('admin_menus')
        .delete()
        .eq('id', selectedMenu.id);

      if (error) throw error;
      toast.success('메뉴가 삭제되었습니다');
      setIsDeleteDialogOpen(false);
      fetchMenus();
    } catch (error: any) {
      toast.error(error.message || '삭제 실패');
    }
  };

  const toggleActive = async (menu: AdminMenu) => {
    try {
      const { error } = await (supabase as any)
        .from('admin_menus')
        .update({ is_active: !menu.is_active })
        .eq('id', menu.id);

      if (error) throw error;
      fetchMenus();
      toast.success(menu.is_active ? '비활성화됨' : '활성화됨');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getBadgeClass = (color: string | null) => {
    const found = BADGE_COLORS.find((c) => c.value === color);
    return found?.class || BADGE_COLORS[0].class;
  };

  const getParentMenus = () => {
    return menus.filter((m) => !m.parent_id);
  };

  const getChildMenus = (parentId: string) => {
    return menus.filter((m) => m.parent_id === parentId);
  };

  const renderMenuRow = (menu: AdminMenu, isChild = false) => (
    <TableRow key={menu.id} className={isChild ? 'bg-muted/30' : ''}>
      <TableCell>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          {isChild && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </TableCell>
      <TableCell>
        <Switch
          checked={menu.is_active}
          onCheckedChange={() => toggleActive(menu)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {menu.icon && (
            <Badge variant="outline" className="text-xs">
              {menu.icon}
            </Badge>
          )}
          <span className="font-medium">{menu.name}</span>
          {menu.badge && (
            <Badge className={`text-xs ${getBadgeClass(menu.badge_color)}`}>
              {menu.badge}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <code className="text-xs bg-muted px-2 py-1 rounded">{menu.href}</code>
      </TableCell>
      <TableCell>
        {menu.is_admin_only ? (
          <Badge variant="secondary" className="text-xs">
            관리자 전용
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            전체
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline">{menu.sort_order}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(menu)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => openDeleteDialog(menu)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Menu className="h-6 w-6" />
            메뉴 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            사이드바 메뉴를 동적으로 관리합니다
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          메뉴 추가
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 메뉴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menus.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              활성 메뉴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {menus.filter((m) => m.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              최상위 메뉴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {menus.filter((m) => !m.parent_id).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              관리자 전용
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {menus.filter((m) => m.is_admin_only).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                메뉴 관리 안내
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                이 기능은 DB에 메뉴 설정을 저장합니다. 실제 사이드바에 적용하려면
                프론트엔드 코드에서 이 데이터를 불러와 렌더링해야 합니다.
                현재는 설정 관리 용도로 사용됩니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menus Table */}
      <Card>
        <CardHeader>
          <CardTitle>메뉴 목록</CardTitle>
          <CardDescription>드래그하여 순서를 변경할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : menus.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">등록된 메뉴가 없습니다</p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                첫 메뉴 추가하기
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-16">상태</TableHead>
                  <TableHead>메뉴명</TableHead>
                  <TableHead>경로</TableHead>
                  <TableHead>접근</TableHead>
                  <TableHead className="w-16">순서</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getParentMenus().map((menu) => (
                  <>
                    {renderMenuRow(menu)}
                    {getChildMenus(menu.id).map((child) => renderMenuRow(child, true))}
                  </>
                ))}
                {/* 부모 없는 서브메뉴들 */}
                {menus
                  .filter(
                    (m) =>
                      m.parent_id && !menus.find((p) => p.id === m.parent_id)
                  )
                  .map((menu) => renderMenuRow(menu))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedMenu ? '메뉴 수정' : '새 메뉴 추가'}</DialogTitle>
            <DialogDescription>메뉴 정보를 입력하세요</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">메뉴 이름 *</Label>
                <Input
                  id="name"
                  placeholder="예: 대시보드"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="href">경로 *</Label>
                <Input
                  id="href"
                  placeholder="예: /dashboard"
                  value={formData.href}
                  onChange={(e) =>
                    setFormData({ ...formData, href: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">아이콘</Label>
                <Select
                  value={formData.icon || '__none__'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, icon: value === '__none__' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="아이콘 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">없음</SelectItem>
                    {AVAILABLE_ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_id">상위 메뉴</Label>
                <Select
                  value={formData.parent_id || '__none__'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parent_id: value === '__none__' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="최상위 메뉴" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">최상위 메뉴</SelectItem>
                    {menus
                      .filter((m) => !m.parent_id && m.id !== selectedMenu?.id)
                      .map((menu) => (
                        <SelectItem key={menu.id} value={menu.id}>
                          {menu.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="badge">배지 텍스트</Label>
                <Input
                  id="badge"
                  placeholder="예: NEW, HOT"
                  value={formData.badge}
                  onChange={(e) =>
                    setFormData({ ...formData, badge: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="badge_color">배지 색상</Label>
                <Select
                  value={formData.badge_color}
                  onValueChange={(value) =>
                    setFormData({ ...formData, badge_color: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="색상 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${color.class}`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

            <div className="flex items-center gap-6">
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
                  id="is_admin_only"
                  checked={formData.is_admin_only}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_admin_only: checked })
                  }
                />
                <Label htmlFor="is_admin_only">관리자 전용</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedMenu ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메뉴 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 &quot;{selectedMenu?.name}&quot; 메뉴를 삭제하시겠습니까?
              <br />
              하위 메뉴가 있는 경우 함께 삭제됩니다.
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

