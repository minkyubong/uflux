-- =============================================
-- 슈퍼어드민 기능을 위한 테이블 생성
-- 2026-01-27
-- =============================================

-- 1. 기존 상품 전체 비활성화
UPDATE services SET is_active = false;

-- 2. API Providers 테이블 (외부 API 공급자 관리)
CREATE TABLE IF NOT EXISTS api_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 공급자 이름 (예: YTResellers, PRM4U)
  slug TEXT NOT NULL UNIQUE,             -- 슬러그 (예: ytresellers, prm4u)
  api_url TEXT NOT NULL,                 -- API URL
  api_key TEXT NOT NULL,                 -- API Key (암호화 권장)
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,            -- 우선순위 (높을수록 먼저 사용)
  balance DECIMAL(12, 2) DEFAULT 0,      -- 해당 공급자 잔액
  last_balance_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 사이드바 메뉴 테이블
CREATE TABLE IF NOT EXISTS admin_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 메뉴 이름
  href TEXT NOT NULL,                    -- 링크 경로
  icon TEXT,                             -- 아이콘 이름 (lucide-react)
  badge TEXT,                            -- 배지 텍스트 (예: NEW, HOT)
  badge_color TEXT,                      -- 배지 색상
  parent_id UUID REFERENCES admin_menus(id), -- 부모 메뉴 (서브메뉴용)
  sort_order INTEGER DEFAULT 0,          -- 정렬 순서
  is_active BOOLEAN DEFAULT true,
  is_admin_only BOOLEAN DEFAULT false,   -- 관리자 전용 메뉴
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 커스텀 카테고리 테이블
CREATE TABLE IF NOT EXISTS admin_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,                -- 플랫폼 (Instagram, YouTube, etc.)
  name TEXT NOT NULL,                    -- 카테고리 이름 (한글)
  name_en TEXT,                          -- 영문 이름
  slug TEXT NOT NULL,                    -- 슬러그
  icon TEXT,                             -- 아이콘
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, slug)
);

-- 5. 커스텀 상품 테이블
CREATE TABLE IF NOT EXISTS admin_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES admin_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- 상품명 (고객에게 보이는)
  description TEXT,                      -- 상품 설명

  -- 가격 설정
  price_per_1000 DECIMAL(10, 4) NOT NULL, -- 1000개당 가격 (판매가)
  min_quantity INTEGER DEFAULT 10,
  max_quantity INTEGER DEFAULT 100000,

  -- API 연결 (Fallback 포함)
  primary_provider_id UUID REFERENCES api_providers(id),
  primary_service_id TEXT,               -- 해당 provider의 서비스 ID

  fallback1_provider_id UUID REFERENCES api_providers(id),
  fallback1_service_id TEXT,

  fallback2_provider_id UUID REFERENCES api_providers(id),
  fallback2_service_id TEXT,

  -- 메타 정보
  input_type TEXT DEFAULT 'link',        -- link, link_comments, link_usernames, etc.
  refill_days INTEGER DEFAULT 0,         -- 리필 보장 일수 (0 = 없음)
  avg_speed TEXT,                        -- 평균 속도 (예: "1K/시간")

  -- 상태
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_recommended BOOLEAN DEFAULT false,  -- 추천 상품

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 상품별 주문 로그 (API Fallback 추적)
CREATE TABLE IF NOT EXISTS order_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,                -- orders 테이블 참조
  product_id UUID REFERENCES admin_products(id),
  provider_id UUID REFERENCES api_providers(id),
  provider_service_id TEXT,
  provider_order_id TEXT,                -- 해당 provider에서 받은 주문 ID
  attempt_number INTEGER DEFAULT 1,      -- 시도 횟수 (1차, 2차, 3차)
  status TEXT DEFAULT 'pending',         -- pending, success, failed
  error_message TEXT,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_products_category ON admin_products(category_id);
CREATE INDEX IF NOT EXISTS idx_admin_products_active ON admin_products(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_categories_platform ON admin_categories(platform);
CREATE INDEX IF NOT EXISTS idx_order_api_logs_order ON order_api_logs(order_id);

-- RLS 정책 (관리자만 접근 가능)
ALTER TABLE api_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_api_logs ENABLE ROW LEVEL SECURITY;

-- 관리자 정책
CREATE POLICY "Admins can manage api_providers" ON api_providers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can manage admin_menus" ON admin_menus
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can manage admin_categories" ON admin_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can manage admin_products" ON admin_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can view order_api_logs" ON order_api_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 일반 사용자는 활성화된 카테고리와 상품만 조회 가능
CREATE POLICY "Users can view active categories" ON admin_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view active products" ON admin_products
  FOR SELECT USING (is_active = true);

-- 기본 API Provider 추가 (YTResellers)
INSERT INTO api_providers (name, slug, api_url, api_key, is_active, priority)
VALUES (
  'YTResellers',
  'ytresellers',
  'https://ytresellers.com/api/v2',
  'f98ad53368979b9381fea5773fbf1806',
  true,
  100
) ON CONFLICT (slug) DO NOTHING;

-- Updated_at 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_providers_updated_at
  BEFORE UPDATE ON api_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_menus_updated_at
  BEFORE UPDATE ON admin_menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_categories_updated_at
  BEFORE UPDATE ON admin_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_products_updated_at
  BEFORE UPDATE ON admin_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

