-- ============================================
-- 성별/연령 타겟팅 옵션
-- ============================================

-- ============================================
-- 1. TARGETING_OPTIONS 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS targeting_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,

    -- 성별 타겟팅
    supports_gender_targeting BOOLEAN DEFAULT FALSE,
    gender_options TEXT[] DEFAULT ARRAY['all', 'male', 'female'],
    gender_price_multiplier NUMERIC(4, 2) DEFAULT 1.2, -- 20% 추가 비용

    -- 연령 타겟팅
    supports_age_targeting BOOLEAN DEFAULT FALSE,
    age_ranges TEXT[] DEFAULT ARRAY['all', '18-24', '25-34', '35-44', '45-54', '55+'],
    age_price_multiplier NUMERIC(4, 2) DEFAULT 1.3, -- 30% 추가 비용

    -- 국가 타겟팅
    supports_country_targeting BOOLEAN DEFAULT FALSE,
    countries TEXT[] DEFAULT ARRAY['KR', 'US', 'JP', 'CN', 'VN', 'TH'],
    country_price_multiplier NUMERIC(4, 2) DEFAULT 1.5, -- 50% 추가 비용

    -- 언어 타겟팅
    supports_language_targeting BOOLEAN DEFAULT FALSE,
    languages TEXT[] DEFAULT ARRAY['ko', 'en', 'ja', 'zh', 'vi'],

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT unique_service_targeting UNIQUE (service_id)
);

-- ============================================
-- 2. orders 테이블에 타겟팅 컬럼 추가
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS targeting JSONB DEFAULT NULL;
-- targeting 예시:
-- {
--   "gender": "female",
--   "age_range": "25-34",
--   "country": "KR",
--   "language": "ko"
-- }

ALTER TABLE orders ADD COLUMN IF NOT EXISTS targeting_multiplier NUMERIC(4, 2) DEFAULT 1.0;

-- ============================================
-- 3. 타겟팅 가격 계산 함수
-- ============================================
CREATE OR REPLACE FUNCTION calculate_targeting_price(
    p_service_id UUID,
    p_base_price NUMERIC,
    p_quantity INTEGER,
    p_targeting JSONB
)
RETURNS NUMERIC AS $$
DECLARE
    v_options RECORD;
    v_multiplier NUMERIC := 1.0;
BEGIN
    -- 타겟팅 옵션이 없으면 기본 가격
    IF p_targeting IS NULL OR p_targeting = '{}'::JSONB THEN
        RETURN CEIL((p_base_price / 1000) * p_quantity);
    END IF;

    -- 서비스의 타겟팅 옵션 조회
    SELECT * INTO v_options FROM targeting_options WHERE service_id = p_service_id;

    IF NOT FOUND THEN
        RETURN CEIL((p_base_price / 1000) * p_quantity);
    END IF;

    -- 성별 타겟팅 적용
    IF v_options.supports_gender_targeting
       AND p_targeting->>'gender' IS NOT NULL
       AND p_targeting->>'gender' != 'all' THEN
        v_multiplier := v_multiplier * v_options.gender_price_multiplier;
    END IF;

    -- 연령 타겟팅 적용
    IF v_options.supports_age_targeting
       AND p_targeting->>'age_range' IS NOT NULL
       AND p_targeting->>'age_range' != 'all' THEN
        v_multiplier := v_multiplier * v_options.age_price_multiplier;
    END IF;

    -- 국가 타겟팅 적용
    IF v_options.supports_country_targeting
       AND p_targeting->>'country' IS NOT NULL THEN
        v_multiplier := v_multiplier * v_options.country_price_multiplier;
    END IF;

    RETURN CEIL((p_base_price / 1000) * p_quantity * v_multiplier);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 4. 타겟팅 주문 처리 함수
-- ============================================
CREATE OR REPLACE FUNCTION process_targeted_order(
    p_user_id UUID,
    p_service_id UUID,
    p_link TEXT,
    p_quantity INTEGER,
    p_targeting JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_service RECORD;
    v_charge NUMERIC;
    v_multiplier NUMERIC := 1.0;
    v_order_id UUID;
    v_order_number TEXT;
    v_current_balance NUMERIC;
    v_options RECORD;
BEGIN
    -- 서비스 정보 조회
    SELECT * INTO v_service FROM services WHERE id = p_service_id AND is_active = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service not found or inactive';
    END IF;

    -- 수량 검증
    IF p_quantity < v_service.min_quantity OR p_quantity > v_service.max_quantity THEN
        RAISE EXCEPTION 'Quantity out of range';
    END IF;

    -- 타겟팅 옵션 조회 및 검증
    IF p_targeting IS NOT NULL AND p_targeting != '{}'::JSONB THEN
        SELECT * INTO v_options FROM targeting_options WHERE service_id = p_service_id;

        IF FOUND THEN
            -- 성별 타겟팅 검증 및 적용
            IF p_targeting->>'gender' IS NOT NULL AND p_targeting->>'gender' != 'all' THEN
                IF NOT v_options.supports_gender_targeting THEN
                    RAISE EXCEPTION 'Gender targeting not supported for this service';
                END IF;
                v_multiplier := v_multiplier * v_options.gender_price_multiplier;
            END IF;

            -- 연령 타겟팅 검증 및 적용
            IF p_targeting->>'age_range' IS NOT NULL AND p_targeting->>'age_range' != 'all' THEN
                IF NOT v_options.supports_age_targeting THEN
                    RAISE EXCEPTION 'Age targeting not supported for this service';
                END IF;
                v_multiplier := v_multiplier * v_options.age_price_multiplier;
            END IF;

            -- 국가 타겟팅 검증 및 적용
            IF p_targeting->>'country' IS NOT NULL THEN
                IF NOT v_options.supports_country_targeting THEN
                    RAISE EXCEPTION 'Country targeting not supported for this service';
                END IF;
                v_multiplier := v_multiplier * v_options.country_price_multiplier;
            END IF;
        END IF;
    END IF;

    -- 가격 계산
    v_charge := CEIL((v_service.price / 1000) * p_quantity * v_multiplier);

    -- 잔액 확인
    SELECT balance INTO v_current_balance FROM profiles WHERE id = p_user_id FOR UPDATE;

    IF v_current_balance < v_charge THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- 주문번호 생성
    v_order_number := 'INF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    -- 주문 생성
    INSERT INTO orders (
        order_number,
        user_id,
        service_id,
        link,
        quantity,
        charge,
        unit_price,
        status,
        targeting,
        targeting_multiplier
    )
    VALUES (
        v_order_number,
        p_user_id,
        p_service_id,
        p_link,
        p_quantity,
        v_charge,
        v_service.price,
        'pending',
        p_targeting,
        v_multiplier
    )
    RETURNING id INTO v_order_id;

    -- 잔액 차감
    PERFORM deduct_balance(
        p_user_id,
        v_charge,
        '타겟팅 주문: ' || v_service.name,
        v_order_id,
        'order'
    );

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. RLS 정책
-- ============================================
ALTER TABLE targeting_options ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 타겟팅 옵션 조회 가능
CREATE POLICY "Anyone can view targeting options"
    ON targeting_options FOR SELECT
    USING (TRUE);

-- Admin만 관리 가능
CREATE POLICY "Admins can manage targeting options"
    ON targeting_options FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================
-- 6. Trigger
-- ============================================
CREATE TRIGGER update_targeting_options_updated_at
    BEFORE UPDATE ON targeting_options
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 권한 부여
-- ============================================
GRANT EXECUTE ON FUNCTION calculate_targeting_price(UUID, NUMERIC, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION process_targeted_order(UUID, UUID, TEXT, INTEGER, JSONB) TO authenticated;

