-- ============================================
-- UFLUX SMM Panel - Database Schema
-- Supabase SQL Editor에 붙여넣기
--
-- 실행 순서: 전체 선택 후 한 번에 실행
-- ============================================

-- ============================================
-- 0. 확장 기능 활성화
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ENUM 타입 정의
-- ============================================

-- 사용자 등급
CREATE TYPE user_tier AS ENUM ('basic', 'vip', 'premium', 'enterprise');

-- 서비스 타입
CREATE TYPE service_type AS ENUM ('default', 'package', 'subscription');

-- 주문 상태
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'in_progress', 'completed', 'partial', 'canceled', 'refunded', 'failed');

-- 거래 유형
CREATE TYPE transaction_type AS ENUM ('deposit', 'refund', 'order', 'bonus', 'adjustment');

-- 거래/입금 상태
CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected', 'canceled');

-- ============================================
-- 2. PROFILES 테이블 (사용자 프로필)
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    balance NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    total_spent NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    total_orders INTEGER DEFAULT 0 NOT NULL,
    tier user_tier DEFAULT 'basic' NOT NULL,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES profiles(id),
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- balance는 음수가 될 수 없음
    CONSTRAINT balance_non_negative CHECK (balance >= 0)
);

-- 인덱스
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX idx_profiles_tier ON profiles(tier);
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;

-- ============================================
-- 3. PROVIDERS 테이블 (API 공급자)
-- ============================================
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    balance NUMERIC(12, 2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    rate_multiplier NUMERIC(6, 4) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    priority INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX idx_providers_is_active ON providers(is_active);
CREATE INDEX idx_providers_priority ON providers(priority DESC);

-- ============================================
-- 4. CATEGORIES 테이블 (서비스 카테고리)
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- ============================================
-- 5. SERVICES 테이블 (판매 서비스)
-- ============================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    provider_service_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    type service_type DEFAULT 'default' NOT NULL,
    rate NUMERIC(12, 4) NOT NULL,           -- 원가 (공급자 가격)
    price NUMERIC(12, 4) NOT NULL,          -- 판매가
    margin NUMERIC(5, 2) DEFAULT 30.00,     -- 마진율 (%)
    min_quantity INTEGER DEFAULT 100 NOT NULL,
    max_quantity INTEGER DEFAULT 10000 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    average_time TEXT,                      -- 예상 소요시간 (예: "1-2시간")
    refill_days INTEGER DEFAULT 0,          -- 리필 보장일
    quality TEXT DEFAULT 'high_quality',    -- 품질 등급
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT min_less_than_max CHECK (min_quantity <= max_quantity),
    CONSTRAINT positive_rate CHECK (rate > 0),
    CONSTRAINT positive_price CHECK (price > 0)
);

-- 인덱스
CREATE INDEX idx_services_provider ON services(provider_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_is_featured ON services(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_services_type ON services(type);

-- ============================================
-- 6. ORDERS 테이블 (주문)
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,      -- 주문번호 (INF-20260117-XXXX)
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    link TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    charge NUMERIC(12, 2) NOT NULL,         -- 결제금액 (판매가 * 수량 / 1000)
    unit_price NUMERIC(12, 4) NOT NULL,     -- 단가
    start_count INTEGER DEFAULT 0,
    remains INTEGER DEFAULT 0,
    status order_status DEFAULT 'pending' NOT NULL,
    provider_order_id TEXT,                 -- 공급자 주문 ID
    error_message TEXT,
    refund_amount NUMERIC(12, 2) DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,

    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT positive_charge CHECK (charge > 0)
);

-- 인덱스
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_service ON orders(service_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_provider_order_id ON orders(provider_order_id);

-- ============================================
-- 7. TRANSACTIONS 테이블 (거래 내역)
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    description TEXT,
    reference_id UUID,                      -- 관련 주문/입금 ID
    reference_type TEXT,                    -- 'order', 'deposit' 등
    status payment_status DEFAULT 'approved' NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference ON transactions(reference_id, reference_type);

-- ============================================
-- 8. DEPOSITS 테이블 (입금 요청)
-- ============================================
CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    depositor_name TEXT NOT NULL,
    bank_name TEXT,
    account_number TEXT,
    receipt_url TEXT,
    status payment_status DEFAULT 'pending' NOT NULL,
    admin_note TEXT,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT positive_deposit_amount CHECK (amount > 0)
);

-- 인덱스
CREATE INDEX idx_deposits_user ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_created_at ON deposits(created_at DESC);

-- ============================================
-- 9. COUPONS 테이블 (쿠폰)
-- ============================================
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'fixed' NOT NULL,     -- 'fixed', 'percent'
    value NUMERIC(12, 2) NOT NULL,
    min_amount NUMERIC(12, 2) DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_is_active ON coupons(is_active);

-- ============================================
-- 10. ANNOUNCEMENTS 테이블 (공지사항)
-- ============================================
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info',               -- 'info', 'warning', 'important'
    is_pinned BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX idx_announcements_is_active ON announcements(is_active);
CREATE INDEX idx_announcements_is_pinned ON announcements(is_pinned) WHERE is_pinned = TRUE;

-- ============================================
-- 11. API_LOGS 테이블 (API 로그)
-- ============================================
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES providers(id),
    order_id UUID REFERENCES orders(id),
    endpoint TEXT NOT NULL,
    method TEXT DEFAULT 'POST',
    request_body JSONB,
    response_body JSONB,
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX idx_api_logs_provider ON api_logs(provider_id);
CREATE INDEX idx_api_logs_order ON api_logs(order_id);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at DESC);

-- 파티션 또는 자동 삭제를 위한 정책 (30일 이후 삭제 권장)

-- ============================================
-- 12. FUNCTIONS (함수)
-- ============================================

-- 주문번호 생성 함수
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    date_part TEXT;
    random_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    RETURN 'INF-' || date_part || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- 추천인 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
BEGIN
    RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 회원가입 시 자동 프로필 생성 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, referral_code)
    VALUES (
        NEW.id,
        NEW.email,
        generate_referral_code()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 잔액 차감 함수 (주문 시)
CREATE OR REPLACE FUNCTION deduct_balance(
    p_user_id UUID,
    p_amount NUMERIC,
    p_description TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    -- 현재 잔액 조회 (FOR UPDATE로 락)
    SELECT balance INTO v_current_balance
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

    -- 잔액 부족 체크
    IF v_current_balance < p_amount THEN
        RETURN FALSE;
    END IF;

    v_new_balance := v_current_balance - p_amount;

    -- 잔액 차감
    UPDATE profiles
    SET balance = v_new_balance,
        total_spent = total_spent + p_amount,
        total_orders = total_orders + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 거래 내역 기록
    INSERT INTO transactions (
        user_id, type, amount, balance_before, balance_after,
        description, reference_id, reference_type
    )
    VALUES (
        p_user_id, 'order', -p_amount, v_current_balance, v_new_balance,
        p_description, p_reference_id, p_reference_type
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 잔액 충전 함수 (입금 승인 시)
CREATE OR REPLACE FUNCTION add_balance(
    p_user_id UUID,
    p_amount NUMERIC,
    p_type transaction_type,
    p_description TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    -- 현재 잔액 조회 (FOR UPDATE로 락)
    SELECT balance INTO v_current_balance
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

    v_new_balance := v_current_balance + p_amount;

    -- 잔액 추가
    UPDATE profiles
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 거래 내역 기록
    INSERT INTO transactions (
        user_id, type, amount, balance_before, balance_after,
        description, reference_id, reference_type
    )
    VALUES (
        p_user_id, p_type, p_amount, v_current_balance, v_new_balance,
        p_description, p_reference_id, p_reference_type
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- VIP 등급 자동 업그레이드 함수
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER AS $$
BEGIN
    -- 총 소비 금액에 따른 등급 조정
    IF NEW.total_spent >= 10000000 THEN
        NEW.tier := 'enterprise';
    ELSIF NEW.total_spent >= 1000000 THEN
        NEW.tier := 'premium';
    ELSIF NEW.total_spent >= 100000 THEN
        NEW.tier := 'vip';
    ELSE
        NEW.tier := 'basic';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. TRIGGERS (트리거)
-- ============================================

-- 회원가입 시 프로필 자동 생성
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- profiles updated_at 자동 갱신
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- providers updated_at 자동 갱신
CREATE TRIGGER update_providers_updated_at
    BEFORE UPDATE ON providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- services updated_at 자동 갱신
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- orders updated_at 자동 갱신
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- deposits updated_at 자동 갱신
CREATE TRIGGER update_deposits_updated_at
    BEFORE UPDATE ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- announcements updated_at 자동 갱신
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 사용자 등급 자동 업그레이드
CREATE TRIGGER update_user_tier_trigger
    BEFORE UPDATE OF total_spent ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_tier();

-- ============================================
-- 14. ROW LEVEL SECURITY (RLS)
-- ============================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- ========== PROFILES 정책 ==========
-- 본인 프로필 조회
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- 본인 프로필 수정 (balance, tier, is_admin 제외)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        balance = (SELECT balance FROM profiles WHERE id = auth.uid()) AND
        tier = (SELECT tier FROM profiles WHERE id = auth.uid()) AND
        is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())
    );

-- Admin 전체 접근
CREATE POLICY "Admins have full access to profiles"
    ON profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ========== PROVIDERS 정책 (Admin Only) ==========
CREATE POLICY "Admins can manage providers"
    ON providers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ========== CATEGORIES 정책 ==========
-- 모든 사용자 조회 가능
CREATE POLICY "Anyone can view active categories"
    ON categories FOR SELECT
    USING (is_active = TRUE);

-- Admin 관리
CREATE POLICY "Admins can manage categories"
    ON categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ========== SERVICES 정책 ==========
-- 모든 사용자 활성 서비스 조회 가능
CREATE POLICY "Anyone can view active services"
    ON services FOR SELECT
    USING (is_active = TRUE);

-- Admin 관리
CREATE POLICY "Admins can manage services"
    ON services FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ========== ORDERS 정책 ==========
-- 본인 주문 조회
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

-- 본인 주문 생성
CREATE POLICY "Users can create own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin 전체 접근
CREATE POLICY "Admins have full access to orders"
    ON orders FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ========== TRANSACTIONS 정책 ==========
-- 본인 거래내역 조회
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Admin 전체 접근
CREATE POLICY "Admins have full access to transactions"
    ON transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ========== DEPOSITS 정책 ==========
-- 본인 입금요청 조회
CREATE POLICY "Users can view own deposits"
    ON deposits FOR SELECT
    USING (auth.uid() = user_id);

-- 본인 입금요청 생성
CREATE POLICY "Users can create own deposits"
    ON deposits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin 전체 접근
CREATE POLICY "Admins have full access to deposits"
    ON deposits FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ========== COUPONS 정책 ==========
-- 활성 쿠폰 조회
CREATE POLICY "Anyone can view active coupons"
    ON coupons FOR SELECT
    USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- Admin 관리
CREATE POLICY "Admins can manage coupons"
    ON coupons FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ========== ANNOUNCEMENTS 정책 ==========
-- 활성 공지 조회
CREATE POLICY "Anyone can view active announcements"
    ON announcements FOR SELECT
    USING (is_active = TRUE);

-- Admin 관리
CREATE POLICY "Admins can manage announcements"
    ON announcements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ========== API_LOGS 정책 (Admin Only) ==========
CREATE POLICY "Admins can view api logs"
    ON api_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "System can insert api logs"
    ON api_logs FOR INSERT
    WITH CHECK (TRUE);

-- ============================================
-- 15. 초기 데이터 삽입
-- ============================================

-- 기본 카테고리
INSERT INTO categories (name, slug, icon, sort_order) VALUES
    ('Instagram', 'instagram', 'instagram', 1),
    ('YouTube', 'youtube', 'youtube', 2),
    ('TikTok', 'tiktok', 'tiktok', 3),
    ('Twitter/X', 'twitter', 'twitter', 4),
    ('Facebook', 'facebook', 'facebook', 5),
    ('Telegram', 'telegram', 'telegram', 6),
    ('Spotify', 'spotify', 'spotify', 7),
    ('기타 서비스', 'others', 'globe', 99);

-- 샘플 공지사항
INSERT INTO announcements (title, content, type, is_pinned) VALUES
    ('UFLUX에 오신 것을 환영합니다!',
     '글로벌 1위 SNS 마케팅 플랫폼 UFLUX입니다. 24시간 자동화 시스템으로 빠르고 안전하게 서비스를 이용하실 수 있습니다.',
     'info',
     TRUE);

-- ============================================
-- 16. VIEWS (조회용 뷰)
-- ============================================

-- 대시보드 통계 뷰
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM profiles WHERE is_active = TRUE) AS total_users,
    (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE) AS today_orders,
    (SELECT COALESCE(SUM(charge), 0) FROM orders WHERE created_at >= CURRENT_DATE AND status != 'canceled') AS today_revenue,
    (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending_orders,
    (SELECT COUNT(*) FROM deposits WHERE status = 'pending') AS pending_deposits;

-- 서비스 목록 뷰 (카테고리 포함)
CREATE OR REPLACE VIEW services_with_category AS
SELECT
    s.*,
    c.name AS category_name,
    c.slug AS category_slug,
    c.icon AS category_icon
FROM services s
LEFT JOIN categories c ON s.category_id = c.id
WHERE s.is_active = TRUE
ORDER BY c.sort_order, s.sort_order;

-- ============================================
-- 완료!
-- ============================================
-- 실행 후 Supabase Dashboard에서 확인:
-- 1. Authentication > Users 에서 테스트 회원가입
-- 2. Table Editor에서 profiles 테이블 확인
-- 3. SQL Editor에서 아래 쿼리로 Admin 설정:
--    UPDATE profiles SET is_admin = TRUE WHERE email = 'your-admin@email.com';
-- ============================================

