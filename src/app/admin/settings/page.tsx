"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SiteSettings {
  site_name: string;
  support_email: string;
  support_phone: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  allow_registration: boolean;
  maintenance_mode: boolean;
  auto_order_processing: boolean;
  min_deposit_amount: number;
  kakao_channel_url: string;
}

const defaultSettings: SiteSettings = {
  site_name: "UFLUX",
  support_email: "support@UFLUX-lab.com",
  support_phone: "02-1234-5678",
  bank_name: "국민은행",
  account_number: "123-456-789012",
  account_holder: "리치엔에비뉴",
  allow_registration: true,
  maintenance_mode: false,
  auto_order_processing: true,
  min_deposit_amount: 10000,
  kakao_channel_url: "https://pf.kakao.com/_xgpUAX",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("site_settings")
        .select("*")
        .single();

      if (error) {
        // 모든 에러에서 기본값 사용 (테이블 없음, 데이터 없음 등)
        console.log("Settings not found, using defaults:", error.code);
        setSettings(defaultSettings);
        setIsLoading(false);
        return;
      }

      if (data) {
        const d = data as SiteSettings;
        setSettings({
          site_name: d.site_name || defaultSettings.site_name,
          support_email: d.support_email || defaultSettings.support_email,
          support_phone: d.support_phone || defaultSettings.support_phone,
          bank_name: d.bank_name || defaultSettings.bank_name,
          account_number: d.account_number || defaultSettings.account_number,
          account_holder: d.account_holder || defaultSettings.account_holder,
          allow_registration: d.allow_registration ?? defaultSettings.allow_registration,
          maintenance_mode: d.maintenance_mode ?? defaultSettings.maintenance_mode,
          auto_order_processing: d.auto_order_processing ?? defaultSettings.auto_order_processing,
          min_deposit_amount: d.min_deposit_amount || defaultSettings.min_deposit_amount,
          kakao_channel_url: d.kakao_channel_url || defaultSettings.kakao_channel_url,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Use defaults on error
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // First try to update
      const { error: updateError } = await supabase
        .from("site_settings")
        .upsert({
          id: 1, // Single row for settings
          ...settings,
          updated_at: new Date().toISOString(),
        } as never);

      if (updateError) {
        // If table doesn't exist, just show success with localStorage backup
        if (updateError.code === "42P01") {
          localStorage.setItem("UFLUX_settings", JSON.stringify(settings));
          toast.success("설정이 저장되었습니다 (로컬)");
          setHasChanges(false);
          return;
        }
        throw updateError;
      }

      toast.success("설정이 저장되었습니다");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      // Fallback to localStorage
      localStorage.setItem("UFLUX_settings", JSON.stringify(settings));
      toast.success("설정이 저장되었습니다 (로컬)");
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">설정</h1>
          <p className="text-muted-foreground">시스템 설정 및 환경 구성</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchSettings} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            저장
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>일반 설정</CardTitle>
            <CardDescription>사이트 기본 설정을 관리합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="site-name">사이트 이름</Label>
                <Input
                  id="site-name"
                  value={settings.site_name}
                  onChange={(e) => updateSetting("site_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">고객센터 이메일</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => updateSetting("support_email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-phone">고객센터 전화번호</Label>
                <Input
                  id="support-phone"
                  value={settings.support_phone}
                  onChange={(e) => updateSetting("support_phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kakao-url">카카오톡 채널 URL</Label>
                <Input
                  id="kakao-url"
                  value={settings.kakao_channel_url}
                  onChange={(e) => updateSetting("kakao_channel_url", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>결제 설정</CardTitle>
            <CardDescription>입금 및 결제 관련 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bank-name">입금 은행</Label>
                <Input
                  id="bank-name"
                  value={settings.bank_name}
                  onChange={(e) => updateSetting("bank_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-number">계좌번호</Label>
                <Input
                  id="account-number"
                  value={settings.account_number}
                  onChange={(e) => updateSetting("account_number", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-holder">예금주</Label>
                <Input
                  id="account-holder"
                  value={settings.account_holder}
                  onChange={(e) => updateSetting("account_holder", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-deposit">최소 입금액 (원)</Label>
                <Input
                  id="min-deposit"
                  type="number"
                  value={settings.min_deposit_amount}
                  onChange={(e) => updateSetting("min_deposit_amount", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>시스템 설정</CardTitle>
            <CardDescription>시스템 동작 관련 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>신규 가입 허용</Label>
                <p className="text-sm text-muted-foreground">새로운 사용자의 회원가입을 허용합니다.</p>
              </div>
              <Switch
                checked={settings.allow_registration}
                onCheckedChange={(checked) => updateSetting("allow_registration", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>점검 모드</Label>
                <p className="text-sm text-muted-foreground">사이트를 점검 모드로 전환합니다.</p>
              </div>
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) => updateSetting("maintenance_mode", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>자동 주문 처리</Label>
                <p className="text-sm text-muted-foreground">주문을 자동으로 API에 전송합니다.</p>
              </div>
              <Switch
                checked={settings.auto_order_processing}
                onCheckedChange={(checked) => updateSetting("auto_order_processing", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {hasChanges && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              설정 저장
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

