-- =============================================
-- 공급자 서비스 캐시 테이블
-- API 공급자의 서비스 목록을 저장하고 가져오기 기능 지원
-- 2026-01-27
-- =============================================

-- 공급자별 원본 서비스 캐시 테이블
CREATE TABLE IF NOT EXISTS provider_services_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES api_providers(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,           -- 공급자의 서비스 ID (예: "4521")
  name TEXT NOT NULL,                 -- 원본 서비스명
  category TEXT,                      -- 공급자의 카테고리
  rate DECIMAL(10, 6),                -- 원가 (USD per 1000)
  min_quantity INTEGER DEFAULT 10,
  max_quantity INTEGER DEFAULT 100000,
  description TEXT,
  refill BOOLEAN DEFAULT false,       -- 리필 지원 여부
  cancel BOOLEAN DEFAULT false,       -- 취소 지원 여부

  -- 자동 감지 결과
  detected_platform TEXT,             -- instagram, youtube, tiktok 등
  detected_type TEXT,                 -- followers, likes, views 등
  detected_region TEXT,               -- korean, worldwide, etc.

  -- 상태
  is_imported BOOLEAN DEFAULT false,  -- 이미 우리 상품에 추가됨?
  imported_product_id UUID REFERENCES admin_products(id) ON DELETE SET NULL,

  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(provider_id, service_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_provider_services_provider ON provider_services_cache(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_services_platform ON provider_services_cache(detected_platform);
CREATE INDEX IF NOT EXISTS idx_provider_services_imported ON provider_services_cache(is_imported);

-- RLS 정책
ALTER TABLE provider_services_cache ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능
CREATE POLICY "Admins can manage provider_services_cache" ON provider_services_cache
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 플랫폼 감지 함수
CREATE OR REPLACE FUNCTION detect_platform_from_name(service_name TEXT)
RETURNS TEXT AS $$
BEGIN
  IF service_name ~* 'instagram|insta|ig\s' THEN
    RETURN 'instagram';
  ELSIF service_name ~* 'youtube|yt\s|yt-' THEN
    RETURN 'youtube';
  ELSIF service_name ~* 'tiktok|tik tok|tt\s' THEN
    RETURN 'tiktok';
  ELSIF service_name ~* 'facebook|fb\s' THEN
    RETURN 'facebook';
  ELSIF service_name ~* 'twitter|tweet|x\s' THEN
    RETURN 'twitter';
  ELSIF service_name ~* 'telegram|tg\s' THEN
    RETURN 'telegram';
  ELSIF service_name ~* 'threads' THEN
    RETURN 'threads';
  ELSIF service_name ~* 'twitch' THEN
    RETURN 'twitch';
  ELSIF service_name ~* 'discord' THEN
    RETURN 'discord';
  ELSIF service_name ~* 'spotify' THEN
    RETURN 'spotify';
  ELSIF service_name ~* 'linkedin' THEN
    RETURN 'linkedin';
  ELSIF service_name ~* 'soundcloud' THEN
    RETURN 'soundcloud';
  ELSE
    RETURN 'other';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 타입 감지 함수
CREATE OR REPLACE FUNCTION detect_type_from_name(service_name TEXT)
RETURNS TEXT AS $$
BEGIN
  IF service_name ~* 'follower|follow' THEN
    RETURN 'followers';
  ELSIF service_name ~* 'like|heart' THEN
    RETURN 'likes';
  ELSIF service_name ~* 'view|watch' THEN
    RETURN 'views';
  ELSIF service_name ~* 'comment' THEN
    RETURN 'comments';
  ELSIF service_name ~* 'share|repost|retweet' THEN
    RETURN 'shares';
  ELSIF service_name ~* 'subscribe|subscription|sub\s' THEN
    RETURN 'subscribers';
  ELSIF service_name ~* 'save|bookmark' THEN
    RETURN 'saves';
  ELSIF service_name ~* 'impression' THEN
    RETURN 'impressions';
  ELSIF service_name ~* 'reach' THEN
    RETURN 'reach';
  ELSIF service_name ~* 'member|join' THEN
    RETURN 'members';
  ELSE
    RETURN 'other';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 지역 감지 함수
CREATE OR REPLACE FUNCTION detect_region_from_name(service_name TEXT)
RETURNS TEXT AS $$
BEGIN
  IF service_name ~* 'korean|korea|한국|kr\s' THEN
    RETURN 'korean';
  ELSIF service_name ~* 'worldwide|global|ww\s|mixed' THEN
    RETURN 'worldwide';
  ELSIF service_name ~* 'usa|american|us\s' THEN
    RETURN 'usa';
  ELSIF service_name ~* 'indian|india' THEN
    RETURN 'india';
  ELSIF service_name ~* 'brazil|brazilian' THEN
    RETURN 'brazil';
  ELSIF service_name ~* 'arab|arabic' THEN
    RETURN 'arab';
  ELSIF service_name ~* 'turkish|turkey' THEN
    RETURN 'turkey';
  ELSIF service_name ~* 'russian|russia' THEN
    RETURN 'russia';
  ELSIF service_name ~* 'japanese|japan' THEN
    RETURN 'japan';
  ELSIF service_name ~* 'chinese|china' THEN
    RETURN 'china';
  ELSE
    RETURN 'worldwide';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 서비스 추가시 자동 감지
CREATE OR REPLACE FUNCTION auto_detect_service_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.detected_platform := detect_platform_from_name(NEW.name);
  NEW.detected_type := detect_type_from_name(NEW.name);
  NEW.detected_region := detect_region_from_name(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_detect_service
  BEFORE INSERT OR UPDATE ON provider_services_cache
  FOR EACH ROW EXECUTE FUNCTION auto_detect_service_metadata();

