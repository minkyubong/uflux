-- ============================================
-- 회원가입 보너스 + 첫충전 보너스 + 적립금 시스템
-- ============================================

-- ============================================
-- 1. profiles 테이블에 보너스 관련 컬럼 추가
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_bonus_received BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_deposit_bonus_received BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points_earned NUMERIC(12, 2) DEFAULT 0;

-- ============================================
-- 2. 회원가입 시 1,000P 자동 지급하도록 트리거 수정
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code TEXT;
  v_signup_bonus NUMERIC := 1000; -- 회원가입 보너스 1,000원
BEGIN
  -- 고유 추천인 코드 생성
  v_referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));

  -- 프로필 생성 (회원가입 보너스 포함)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    balance,
    total_spent,
    total_orders,
    tier,
    referral_code,
    is_admin,
    is_active,
    signup_bonus_received,
    first_deposit_bonus_received,
    total_points_earned,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    v_signup_bonus, -- 1,000원 보너스 지급
    0,
    0,
    'basic',
    v_referral_code,
    FALSE,
    TRUE,
    TRUE, -- 가입 보너스 받음
    FALSE, -- 첫충전 보너스 아직 안받음
    0,
    NOW(),
    NOW()
  );

  -- 보너스 지급 거래 내역 기록
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    status,
    metadata
  )
  VALUES (
    NEW.id,
    'bonus',
    v_signup_bonus,
    0,
    v_signup_bonus,
    '회원가입 축하 보너스',
    'approved',
    jsonb_build_object('bonus_type', 'signup', 'amount', v_signup_bonus)
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 재생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 3. 첫충전 20% 보너스 함수
-- ============================================
CREATE OR REPLACE FUNCTION apply_first_deposit_bonus(
  p_user_id UUID,
  p_deposit_amount NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  v_is_first_deposit BOOLEAN;
  v_bonus_rate NUMERIC := 0.20; -- 20% 보너스
  v_bonus_amount NUMERIC;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- 첫충전 여부 확인
  SELECT NOT first_deposit_bonus_received INTO v_is_first_deposit
  FROM profiles
  WHERE id = p_user_id;

  IF NOT v_is_first_deposit THEN
    RETURN 0; -- 이미 첫충전 보너스를 받음
  END IF;

  -- 보너스 계산
  v_bonus_amount := FLOOR(p_deposit_amount * v_bonus_rate);

  -- 현재 잔액 조회
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  v_new_balance := v_current_balance + v_bonus_amount;

  -- 잔액 및 보너스 상태 업데이트
  UPDATE profiles
  SET balance = v_new_balance,
      first_deposit_bonus_received = TRUE,
      total_points_earned = total_points_earned + v_bonus_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- 거래 내역 기록
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    status,
    metadata
  )
  VALUES (
    p_user_id,
    'bonus',
    v_bonus_amount,
    v_current_balance,
    v_new_balance,
    '첫충전 20% 보너스',
    'approved',
    jsonb_build_object('bonus_type', 'first_deposit', 'deposit_amount', p_deposit_amount, 'bonus_rate', v_bonus_rate)
  );

  RETURN v_bonus_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. 주문 적립금 함수 (5만원 이상 5% 적립)
-- ============================================
CREATE OR REPLACE FUNCTION apply_order_points(
  p_user_id UUID,
  p_order_amount NUMERIC,
  p_order_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_min_amount NUMERIC := 50000; -- 최소 5만원 이상
  v_points_rate NUMERIC := 0.05; -- 5% 적립
  v_points_amount NUMERIC;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- 5만원 이상만 적립
  IF p_order_amount < v_min_amount THEN
    RETURN 0;
  END IF;

  -- 적립금 계산
  v_points_amount := FLOOR(p_order_amount * v_points_rate);

  -- 현재 잔액 조회
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  v_new_balance := v_current_balance + v_points_amount;

  -- 잔액 및 적립금 업데이트
  UPDATE profiles
  SET balance = v_new_balance,
      total_points_earned = total_points_earned + v_points_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- 거래 내역 기록
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    reference_id,
    reference_type,
    status,
    metadata
  )
  VALUES (
    p_user_id,
    'bonus',
    v_points_amount,
    v_current_balance,
    v_new_balance,
    '주문 적립금 (5%)',
    p_order_id,
    'order',
    'approved',
    jsonb_build_object('bonus_type', 'order_points', 'order_amount', p_order_amount, 'points_rate', v_points_rate)
  );

  RETURN v_points_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. VIP 등급별 추가 적립 (선택적)
-- ============================================
CREATE OR REPLACE FUNCTION get_tier_bonus_rate(p_tier user_tier)
RETURNS NUMERIC AS $$
BEGIN
  CASE p_tier
    WHEN 'basic' THEN RETURN 0;
    WHEN 'vip' THEN RETURN 0.01; -- +1%
    WHEN 'premium' THEN RETURN 0.02; -- +2%
    WHEN 'enterprise' THEN RETURN 0.03; -- +3%
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 권한 부여
-- ============================================
GRANT EXECUTE ON FUNCTION apply_first_deposit_bonus(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_order_points(UUID, NUMERIC, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tier_bonus_rate(user_tier) TO authenticated;
-- ============================================
-- 서비스별 리뷰/별점 시스템
-- ============================================

-- ============================================
-- 1. REVIEWS 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    is_verified BOOLEAN DEFAULT FALSE, -- 실제 구매자 인증
    is_featured BOOLEAN DEFAULT FALSE, -- 추천 리뷰
    is_visible BOOLEAN DEFAULT TRUE,
    helpful_count INTEGER DEFAULT 0,
    reply TEXT, -- 관리자 답변
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- 한 주문당 하나의 리뷰만 작성 가능
    CONSTRAINT unique_order_review UNIQUE (order_id),
    -- 한 서비스에 대해 사용자당 여러 리뷰 가능 (주문 기준)
    CONSTRAINT unique_user_service_review UNIQUE (user_id, service_id, order_id)
);

-- 인덱스
CREATE INDEX idx_reviews_service ON reviews(service_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_is_visible ON reviews(is_visible) WHERE is_visible = TRUE;
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- ============================================
-- 2. REVIEW_HELPFUL 테이블 (도움이 됐어요)
-- ============================================
CREATE TABLE IF NOT EXISTS review_helpful (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT unique_helpful UNIQUE (review_id, user_id)
);

-- ============================================
-- 3. 서비스 평점 통계 뷰
-- ============================================
CREATE OR REPLACE VIEW service_ratings AS
SELECT
    s.id AS service_id,
    s.name AS service_name,
    COUNT(r.id) AS review_count,
    COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
    COUNT(CASE WHEN r.rating = 5 THEN 1 END) AS five_star,
    COUNT(CASE WHEN r.rating = 4 THEN 1 END) AS four_star,
    COUNT(CASE WHEN r.rating = 3 THEN 1 END) AS three_star,
    COUNT(CASE WHEN r.rating = 2 THEN 1 END) AS two_star,
    COUNT(CASE WHEN r.rating = 1 THEN 1 END) AS one_star
FROM services s
LEFT JOIN reviews r ON s.id = r.service_id AND r.is_visible = TRUE
GROUP BY s.id, s.name;

-- ============================================
-- 4. RLS 정책
-- ============================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 공개 리뷰 조회 가능
CREATE POLICY "Anyone can view visible reviews"
    ON reviews FOR SELECT
    USING (is_visible = TRUE);

-- 본인 리뷰 생성 가능
CREATE POLICY "Users can create own reviews"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 본인 리뷰 수정 가능
CREATE POLICY "Users can update own reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admin 전체 접근
CREATE POLICY "Admins have full access to reviews"
    ON reviews FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- 도움이 됐어요 정책
CREATE POLICY "Anyone can view helpful counts"
    ON review_helpful FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can mark helpful"
    ON review_helpful FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove helpful"
    ON review_helpful FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 5. 리뷰 작성 함수 (주문 완료 후에만)
-- ============================================
CREATE OR REPLACE FUNCTION create_review(
    p_order_id UUID,
    p_rating INTEGER,
    p_content TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_service_id UUID;
    v_order_status order_status;
    v_review_id UUID;
BEGIN
    -- 주문 정보 확인
    SELECT user_id, service_id, status INTO v_user_id, v_service_id, v_order_status
    FROM orders
    WHERE id = p_order_id;

    -- 주문 존재 여부 확인
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- 본인 주문인지 확인
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- 주문 완료 상태인지 확인
    IF v_order_status NOT IN ('completed', 'partial') THEN
        RAISE EXCEPTION 'Can only review completed orders';
    END IF;

    -- 이미 리뷰가 있는지 확인
    IF EXISTS (SELECT 1 FROM reviews WHERE order_id = p_order_id) THEN
        RAISE EXCEPTION 'Review already exists for this order';
    END IF;

    -- 리뷰 생성
    INSERT INTO reviews (user_id, service_id, order_id, rating, content, is_verified)
    VALUES (v_user_id, v_service_id, p_order_id, p_rating, p_content, TRUE)
    RETURNING id INTO v_review_id;

    RETURN v_review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 도움이 됐어요 토글 함수
-- ============================================
CREATE OR REPLACE FUNCTION toggle_review_helpful(p_review_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_exists BOOLEAN;
BEGIN
    -- 이미 누른 상태인지 확인
    SELECT EXISTS (
        SELECT 1 FROM review_helpful
        WHERE review_id = p_review_id AND user_id = v_user_id
    ) INTO v_exists;

    IF v_exists THEN
        -- 취소
        DELETE FROM review_helpful
        WHERE review_id = p_review_id AND user_id = v_user_id;

        UPDATE reviews SET helpful_count = helpful_count - 1
        WHERE id = p_review_id;

        RETURN FALSE;
    ELSE
        -- 추가
        INSERT INTO review_helpful (review_id, user_id)
        VALUES (p_review_id, v_user_id);

        UPDATE reviews SET helpful_count = helpful_count + 1
        WHERE id = p_review_id;

        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Triggers
-- ============================================
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 권한 부여
-- ============================================
GRANT EXECUTE ON FUNCTION create_review(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_review_helpful(UUID) TO authenticated;
-- ============================================
-- Drip-feed 주문 처리 시스템
-- 점진적 배송 기능
-- ============================================

-- ============================================
-- 1. orders 테이블에 drip-feed 관련 컬럼 추가
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_drip_feed BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS drip_feed_runs INTEGER DEFAULT 1; -- 배송 횟수
ALTER TABLE orders ADD COLUMN IF NOT EXISTS drip_feed_interval INTEGER DEFAULT 60; -- 배송 간격 (분)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS drip_feed_quantity INTEGER; -- 회당 배송 수량
ALTER TABLE orders ADD COLUMN IF NOT EXISTS drip_feed_completed_runs INTEGER DEFAULT 0; -- 완료된 배송 횟수
ALTER TABLE orders ADD COLUMN IF NOT EXISTS next_drip_feed_at TIMESTAMPTZ; -- 다음 배송 예정 시간

-- ============================================
-- 2. DRIP_FEED_LOGS 테이블 (배송 로그)
-- ============================================
CREATE TABLE IF NOT EXISTS drip_feed_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    run_number INTEGER NOT NULL, -- 몇 번째 배송인지
    quantity INTEGER NOT NULL, -- 이번 배송 수량
    provider_order_id TEXT, -- 공급자 주문 ID
    status order_status DEFAULT 'pending',
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX idx_drip_feed_logs_order ON drip_feed_logs(order_id);
CREATE INDEX idx_drip_feed_logs_status ON drip_feed_logs(status);
CREATE INDEX idx_orders_drip_feed ON orders(is_drip_feed) WHERE is_drip_feed = TRUE;
CREATE INDEX idx_orders_next_drip ON orders(next_drip_feed_at) WHERE next_drip_feed_at IS NOT NULL;

-- ============================================
-- 3. Drip-feed 주문 생성 함수
-- ============================================
CREATE OR REPLACE FUNCTION process_drip_feed_order(
    p_user_id UUID,
    p_service_id UUID,
    p_link TEXT,
    p_quantity INTEGER,
    p_drip_runs INTEGER DEFAULT 1,
    p_drip_interval INTEGER DEFAULT 60
)
RETURNS UUID AS $$
DECLARE
    v_service RECORD;
    v_charge NUMERIC;
    v_order_id UUID;
    v_order_number TEXT;
    v_drip_quantity INTEGER;
    v_current_balance NUMERIC;
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

    -- 가격 계산
    v_charge := CEIL((v_service.price / 1000) * p_quantity);

    -- 잔액 확인
    SELECT balance INTO v_current_balance FROM profiles WHERE id = p_user_id FOR UPDATE;

    IF v_current_balance < v_charge THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- 회당 배송 수량 계산
    v_drip_quantity := CEIL(p_quantity::NUMERIC / p_drip_runs);

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
        is_drip_feed,
        drip_feed_runs,
        drip_feed_interval,
        drip_feed_quantity,
        drip_feed_completed_runs,
        next_drip_feed_at
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
        p_drip_runs > 1,
        p_drip_runs,
        p_drip_interval,
        v_drip_quantity,
        0,
        CASE WHEN p_drip_runs > 1 THEN NOW() + (p_drip_interval || ' minutes')::INTERVAL ELSE NULL END
    )
    RETURNING id INTO v_order_id;

    -- 잔액 차감
    PERFORM deduct_balance(
        p_user_id,
        v_charge,
        'Drip-feed 주문: ' || v_service.name,
        v_order_id,
        'order'
    );

    -- 첫 번째 배송 로그 생성
    INSERT INTO drip_feed_logs (order_id, run_number, quantity, status)
    VALUES (v_order_id, 1, v_drip_quantity, 'pending');

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Drip-feed 다음 배송 처리 함수
-- ============================================
CREATE OR REPLACE FUNCTION process_next_drip_feed(p_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_order RECORD;
    v_next_run INTEGER;
    v_remaining_quantity INTEGER;
    v_this_quantity INTEGER;
BEGIN
    -- 주문 정보 조회
    SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;

    IF NOT FOUND OR NOT v_order.is_drip_feed THEN
        RETURN FALSE;
    END IF;

    -- 이미 모든 배송이 완료됐는지 확인
    IF v_order.drip_feed_completed_runs >= v_order.drip_feed_runs THEN
        RETURN FALSE;
    END IF;

    -- 다음 배송 번호
    v_next_run := v_order.drip_feed_completed_runs + 1;

    -- 남은 수량 계산
    v_remaining_quantity := v_order.quantity - (v_order.drip_feed_completed_runs * v_order.drip_feed_quantity);

    -- 이번 배송 수량 (마지막 배송이면 남은 전부)
    IF v_next_run = v_order.drip_feed_runs THEN
        v_this_quantity := v_remaining_quantity;
    ELSE
        v_this_quantity := LEAST(v_order.drip_feed_quantity, v_remaining_quantity);
    END IF;

    -- 배송 로그 생성
    INSERT INTO drip_feed_logs (order_id, run_number, quantity, status)
    VALUES (p_order_id, v_next_run, v_this_quantity, 'pending');

    -- 주문 업데이트
    UPDATE orders
    SET
        drip_feed_completed_runs = v_next_run,
        next_drip_feed_at = CASE
            WHEN v_next_run < drip_feed_runs
            THEN NOW() + (drip_feed_interval || ' minutes')::INTERVAL
            ELSE NULL
        END,
        updated_at = NOW()
    WHERE id = p_order_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. 대기 중인 Drip-feed 배송 조회 뷰
-- ============================================
CREATE OR REPLACE VIEW pending_drip_feeds AS
SELECT
    o.id AS order_id,
    o.order_number,
    o.user_id,
    o.service_id,
    o.link,
    o.drip_feed_runs,
    o.drip_feed_interval,
    o.drip_feed_quantity,
    o.drip_feed_completed_runs,
    o.next_drip_feed_at,
    o.quantity - (o.drip_feed_completed_runs * o.drip_feed_quantity) AS remaining_quantity
FROM orders o
WHERE o.is_drip_feed = TRUE
    AND o.status NOT IN ('completed', 'canceled', 'refunded', 'failed')
    AND o.drip_feed_completed_runs < o.drip_feed_runs
    AND (o.next_drip_feed_at IS NULL OR o.next_drip_feed_at <= NOW());

-- ============================================
-- 6. RLS 정책
-- ============================================
ALTER TABLE drip_feed_logs ENABLE ROW LEVEL SECURITY;

-- 본인 로그 조회
CREATE POLICY "Users can view own drip feed logs"
    ON drip_feed_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = drip_feed_logs.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Admin 전체 접근
CREATE POLICY "Admins have full access to drip feed logs"
    ON drip_feed_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================
-- 권한 부여
-- ============================================
GRANT EXECUTE ON FUNCTION process_drip_feed_order(UUID, UUID, TEXT, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION process_next_drip_feed(UUID) TO service_role;
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
-- ============================================
-- 무료 체험 신청 시스템
-- ============================================

-- ============================================
-- 1. FREE_TRIAL_SERVICES 테이블 (무료 체험 가능 서비스)
-- ============================================
CREATE TABLE IF NOT EXISTS free_trial_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    trial_quantity INTEGER NOT NULL DEFAULT 50, -- 체험 수량
    daily_limit INTEGER DEFAULT 100, -- 일일 제공 한도
    today_used INTEGER DEFAULT 0, -- 오늘 사용량
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT unique_trial_service UNIQUE (service_id)
);

-- ============================================
-- 2. FREE_TRIALS 테이블 (체험 신청 내역)
-- ============================================
CREATE TABLE IF NOT EXISTS free_trials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    trial_service_id UUID NOT NULL REFERENCES free_trial_services(id) ON DELETE CASCADE,
    link TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    status order_status DEFAULT 'pending',
    provider_order_id TEXT,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,

    -- 사용자당 서비스별 하루 1회 제한
    CONSTRAINT unique_daily_trial UNIQUE (user_id, service_id, (created_at::DATE))
);

-- 인덱스
CREATE INDEX idx_free_trials_user ON free_trials(user_id);
CREATE INDEX idx_free_trials_service ON free_trials(service_id);
CREATE INDEX idx_free_trials_status ON free_trials(status);
CREATE INDEX idx_free_trials_created_at ON free_trials(created_at DESC);
CREATE INDEX idx_free_trial_services_active ON free_trial_services(is_active) WHERE is_active = TRUE;

-- ============================================
-- 3. 일일 사용량 리셋 함수
-- ============================================
CREATE OR REPLACE FUNCTION reset_daily_trial_limits()
RETURNS void AS $$
BEGIN
    UPDATE free_trial_services SET today_used = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. 무료 체험 신청 함수
-- ============================================
CREATE OR REPLACE FUNCTION request_free_trial(
    p_user_id UUID,
    p_service_id UUID,
    p_link TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_trial_service RECORD;
    v_user RECORD;
    v_trial_id UUID;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- 사용자 확인
    SELECT * INTO v_user FROM profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- 무료 체험 서비스 정보 조회
    SELECT * INTO v_trial_service
    FROM free_trial_services
    WHERE service_id = p_service_id AND is_active = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Free trial not available for this service';
    END IF;

    -- 일일 제공 한도 확인
    IF v_trial_service.today_used >= v_trial_service.daily_limit THEN
        RAISE EXCEPTION 'Daily trial limit reached. Please try again tomorrow.';
    END IF;

    -- 사용자가 오늘 이미 이 서비스 체험을 신청했는지 확인
    IF EXISTS (
        SELECT 1 FROM free_trials
        WHERE user_id = p_user_id
        AND service_id = p_service_id
        AND created_at::DATE = v_today
    ) THEN
        RAISE EXCEPTION 'You already requested a free trial for this service today';
    END IF;

    -- 체험 신청 생성
    INSERT INTO free_trials (
        user_id,
        service_id,
        trial_service_id,
        link,
        quantity,
        status,
        ip_address,
        user_agent
    )
    VALUES (
        p_user_id,
        p_service_id,
        v_trial_service.id,
        p_link,
        v_trial_service.trial_quantity,
        'pending',
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_trial_id;

    -- 일일 사용량 증가
    UPDATE free_trial_services
    SET today_used = today_used + 1
    WHERE id = v_trial_service.id;

    RETURN v_trial_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. 체험 가능 여부 확인 함수
-- ============================================
CREATE OR REPLACE FUNCTION check_trial_availability(
    p_user_id UUID,
    p_service_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_trial_service RECORD;
    v_already_used BOOLEAN;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- 무료 체험 서비스 정보 조회
    SELECT * INTO v_trial_service
    FROM free_trial_services
    WHERE service_id = p_service_id AND is_active = TRUE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'available', FALSE,
            'reason', 'no_trial_service',
            'message', '이 서비스는 무료 체험을 제공하지 않습니다.'
        );
    END IF;

    -- 일일 한도 확인
    IF v_trial_service.today_used >= v_trial_service.daily_limit THEN
        RETURN jsonb_build_object(
            'available', FALSE,
            'reason', 'daily_limit_reached',
            'message', '오늘의 무료 체험 한도가 소진되었습니다. 내일 다시 시도해주세요.',
            'remaining', 0
        );
    END IF;

    -- 사용자가 오늘 이미 신청했는지 확인
    SELECT EXISTS (
        SELECT 1 FROM free_trials
        WHERE user_id = p_user_id
        AND service_id = p_service_id
        AND created_at::DATE = v_today
    ) INTO v_already_used;

    IF v_already_used THEN
        RETURN jsonb_build_object(
            'available', FALSE,
            'reason', 'already_used',
            'message', '오늘 이미 이 서비스의 무료 체험을 신청하셨습니다.'
        );
    END IF;

    RETURN jsonb_build_object(
        'available', TRUE,
        'quantity', v_trial_service.trial_quantity,
        'remaining', v_trial_service.daily_limit - v_trial_service.today_used,
        'message', '무료 체험이 가능합니다!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 무료 체험 서비스 목록 뷰
-- ============================================
CREATE OR REPLACE VIEW available_free_trials AS
SELECT
    fts.id AS trial_service_id,
    fts.service_id,
    s.name AS service_name,
    s.price,
    fts.trial_quantity,
    fts.daily_limit,
    fts.today_used,
    fts.daily_limit - fts.today_used AS remaining_today,
    fts.is_active,
    c.name AS category_name,
    c.slug AS category_slug
FROM free_trial_services fts
JOIN services s ON fts.service_id = s.id
LEFT JOIN categories c ON s.category_id = c.id
WHERE fts.is_active = TRUE AND s.is_active = TRUE
ORDER BY fts.today_used ASC;

-- ============================================
-- 7. RLS 정책
-- ============================================
ALTER TABLE free_trial_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_trials ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 무료 체험 서비스 목록 조회 가능
CREATE POLICY "Anyone can view free trial services"
    ON free_trial_services FOR SELECT
    USING (is_active = TRUE);

-- Admin 관리
CREATE POLICY "Admins can manage free trial services"
    ON free_trial_services FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- 본인 체험 내역 조회
CREATE POLICY "Users can view own free trials"
    ON free_trials FOR SELECT
    USING (auth.uid() = user_id);

-- 본인 체험 신청
CREATE POLICY "Users can create own free trials"
    ON free_trials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin 전체 접근
CREATE POLICY "Admins have full access to free trials"
    ON free_trials FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================
-- 8. 기본 무료 체험 서비스 등록 (샘플)
-- ============================================
-- 실제 서비스 ID로 교체 필요
-- INSERT INTO free_trial_services (service_id, trial_quantity, daily_limit)
-- VALUES
--     ('instagram-likes-service-id', 50, 100),
--     ('youtube-views-service-id', 100, 50),
--     ('tiktok-likes-service-id', 50, 100);

-- ============================================
-- 권한 부여
-- ============================================
GRANT EXECUTE ON FUNCTION request_free_trial(UUID, UUID, TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_trial_availability(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_daily_trial_limits() TO service_role;
-- ============================================
-- 카카오페이 결제 연동 준비
-- ============================================

-- ============================================
-- 1. PAYMENT_METHODS 테이블 (결제 수단 설정)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- 'bank_transfer', 'kakaopay', 'crypto', 'tosspay', 'naverpay'
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    min_amount NUMERIC(12, 2) DEFAULT 1000,
    max_amount NUMERIC(12, 2) DEFAULT 10000000,
    fee_percent NUMERIC(4, 2) DEFAULT 0, -- 수수료율
    fee_fixed NUMERIC(12, 2) DEFAULT 0, -- 고정 수수료
    config JSONB DEFAULT '{}', -- API 키 등 설정 (암호화 권장)
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 2. KAKAOPAY_PAYMENTS 테이블 (카카오페이 결제 내역)
-- ============================================
CREATE TABLE IF NOT EXISTS kakaopay_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    deposit_id UUID REFERENCES deposits(id) ON DELETE SET NULL,

    -- 카카오페이 결제 정보
    tid TEXT UNIQUE, -- 카카오페이 거래 ID
    partner_order_id TEXT NOT NULL, -- 가맹점 주문번호
    partner_user_id TEXT NOT NULL, -- 가맹점 회원 ID

    -- 금액 정보
    total_amount INTEGER NOT NULL, -- 결제 총액
    tax_free_amount INTEGER DEFAULT 0, -- 비과세 금액
    vat_amount INTEGER DEFAULT 0, -- 부가세

    -- 결제 상태
    status TEXT DEFAULT 'ready', -- ready, approved, canceled, failed
    approved_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,

    -- 결제 수단 정보
    payment_method_type TEXT, -- CARD, MONEY (카카오머니)
    card_info JSONB, -- 카드 결제 시 정보

    -- URL 정보
    next_redirect_pc_url TEXT,
    next_redirect_mobile_url TEXT,
    next_redirect_app_url TEXT,

    -- 에러 정보
    error_code TEXT,
    error_message TEXT,

    -- 메타데이터
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX idx_kakaopay_payments_user ON kakaopay_payments(user_id);
CREATE INDEX idx_kakaopay_payments_tid ON kakaopay_payments(tid);
CREATE INDEX idx_kakaopay_payments_status ON kakaopay_payments(status);
CREATE INDEX idx_kakaopay_payments_partner_order ON kakaopay_payments(partner_order_id);

-- ============================================
-- 3. 카카오페이 결제 준비 함수
-- ============================================
CREATE OR REPLACE FUNCTION prepare_kakaopay_payment(
    p_user_id UUID,
    p_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_payment_id UUID;
    v_partner_order_id TEXT;
BEGIN
    -- 최소 금액 체크
    IF p_amount < 1000 THEN
        RAISE EXCEPTION 'Minimum payment amount is 1000 KRW';
    END IF;

    -- 주문번호 생성
    v_partner_order_id := 'UFLUX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

    -- 결제 레코드 생성
    INSERT INTO kakaopay_payments (
        user_id,
        partner_order_id,
        partner_user_id,
        total_amount,
        status
    )
    VALUES (
        p_user_id,
        v_partner_order_id,
        p_user_id::TEXT,
        p_amount,
        'ready'
    )
    RETURNING id INTO v_payment_id;

    RETURN jsonb_build_object(
        'payment_id', v_payment_id,
        'partner_order_id', v_partner_order_id,
        'amount', p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. 카카오페이 결제 승인 처리 함수
-- ============================================
CREATE OR REPLACE FUNCTION approve_kakaopay_payment(
    p_payment_id UUID,
    p_tid TEXT,
    p_payment_method_type TEXT DEFAULT NULL,
    p_card_info JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_payment RECORD;
    v_deposit_id UUID;
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
    v_bonus_amount NUMERIC;
BEGIN
    -- 결제 정보 조회
    SELECT * INTO v_payment
    FROM kakaopay_payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;

    IF v_payment.status != 'ready' THEN
        RAISE EXCEPTION 'Payment already processed';
    END IF;

    -- 결제 상태 업데이트
    UPDATE kakaopay_payments
    SET
        tid = p_tid,
        status = 'approved',
        approved_at = NOW(),
        payment_method_type = p_payment_method_type,
        card_info = p_card_info,
        updated_at = NOW()
    WHERE id = p_payment_id;

    -- 입금 내역 생성
    INSERT INTO deposits (
        user_id,
        amount,
        depositor_name,
        payment_method,
        status
    )
    VALUES (
        v_payment.user_id,
        v_payment.total_amount,
        '카카오페이 결제',
        'kakaopay',
        'approved'
    )
    RETURNING id INTO v_deposit_id;

    -- 결제 레코드에 입금 ID 연결
    UPDATE kakaopay_payments
    SET deposit_id = v_deposit_id
    WHERE id = p_payment_id;

    -- 현재 잔액 조회
    SELECT balance INTO v_current_balance
    FROM profiles
    WHERE id = v_payment.user_id
    FOR UPDATE;

    v_new_balance := v_current_balance + v_payment.total_amount;

    -- 잔액 충전
    UPDATE profiles
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE id = v_payment.user_id;

    -- 충전 거래 내역 기록
    INSERT INTO transactions (
        user_id,
        type,
        amount,
        balance_before,
        balance_after,
        description,
        reference_id,
        reference_type,
        status,
        metadata
    )
    VALUES (
        v_payment.user_id,
        'deposit',
        v_payment.total_amount,
        v_current_balance,
        v_new_balance,
        '카카오페이 충전',
        v_deposit_id,
        'deposit',
        'approved',
        jsonb_build_object('payment_method', 'kakaopay', 'tid', p_tid)
    );

    -- 첫충전 보너스 적용
    SELECT apply_first_deposit_bonus(v_payment.user_id, v_payment.total_amount) INTO v_bonus_amount;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. 카카오페이 결제 취소 함수
-- ============================================
CREATE OR REPLACE FUNCTION cancel_kakaopay_payment(
    p_payment_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_payment RECORD;
BEGIN
    SELECT * INTO v_payment
    FROM kakaopay_payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;

    IF v_payment.status NOT IN ('ready', 'approved') THEN
        RAISE EXCEPTION 'Cannot cancel this payment';
    END IF;

    UPDATE kakaopay_payments
    SET
        status = 'canceled',
        canceled_at = NOW(),
        error_message = p_reason,
        updated_at = NOW()
    WHERE id = p_payment_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 기본 결제 수단 등록
-- ============================================
INSERT INTO payment_methods (code, name, description, icon, is_active, sort_order)
VALUES
    ('bank_transfer', '무통장 입금', '계좌이체로 입금 후 충전', 'building', TRUE, 1),
    ('kakaopay', '카카오페이', '카카오페이로 간편 결제', 'wallet', TRUE, 2),
    ('crypto', 'USDT', 'TRC-20 USDT로 충전', 'bitcoin', TRUE, 3)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================
-- 7. RLS 정책
-- ============================================
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE kakaopay_payments ENABLE ROW LEVEL SECURITY;

-- 활성 결제 수단 조회
CREATE POLICY "Anyone can view active payment methods"
    ON payment_methods FOR SELECT
    USING (is_active = TRUE);

-- Admin 관리
CREATE POLICY "Admins can manage payment methods"
    ON payment_methods FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- 본인 결제 내역 조회
CREATE POLICY "Users can view own kakaopay payments"
    ON kakaopay_payments FOR SELECT
    USING (auth.uid() = user_id);

-- Admin 전체 접근
CREATE POLICY "Admins have full access to kakaopay payments"
    ON kakaopay_payments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================
-- 8. Triggers
-- ============================================
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kakaopay_payments_updated_at
    BEFORE UPDATE ON kakaopay_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 권한 부여
-- ============================================
GRANT EXECUTE ON FUNCTION prepare_kakaopay_payment(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_kakaopay_payment(UUID, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION cancel_kakaopay_payment(UUID, TEXT) TO service_role;
-- ============================================
-- A/B 테스트 시스템
-- ============================================

-- ============================================
-- 1. AB_TESTS 테이블 (테스트 정의)
-- ============================================
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    test_key TEXT UNIQUE NOT NULL, -- 'landing_hero', 'pricing_display', 'checkout_flow'

    -- 테스트 설정
    variants JSONB NOT NULL DEFAULT '["control", "variant_a"]',
    -- 예: ["control", "variant_a", "variant_b"]

    traffic_allocation JSONB DEFAULT '{"control": 50, "variant_a": 50}',
    -- 트래픽 배분 (%)

    -- 상태
    status TEXT DEFAULT 'draft', -- draft, running, paused, completed
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    -- 타겟팅 (선택적)
    target_audience JSONB DEFAULT '{}',
    -- 예: {"user_tier": ["basic", "vip"], "country": ["KR"]}

    -- 우승 변형
    winner_variant TEXT,

    -- 메타데이터
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 2. AB_TEST_ASSIGNMENTS 테이블 (사용자 할당)
-- ============================================
CREATE TABLE IF NOT EXISTS ab_test_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    anonymous_id TEXT, -- 비로그인 사용자용
    variant TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- 사용자별 테스트당 하나의 할당만 가능
    CONSTRAINT unique_user_test UNIQUE (test_id, user_id),
    CONSTRAINT unique_anon_test UNIQUE (test_id, anonymous_id),
    -- user_id 또는 anonymous_id 중 하나는 필수
    CONSTRAINT check_user_or_anon CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);

-- ============================================
-- 3. AB_TEST_EVENTS 테이블 (이벤트 추적)
-- ============================================
CREATE TABLE IF NOT EXISTS ab_test_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES ab_test_assignments(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    anonymous_id TEXT,
    variant TEXT NOT NULL,

    -- 이벤트 정보
    event_type TEXT NOT NULL, -- 'view', 'click', 'conversion', 'revenue'
    event_value NUMERIC DEFAULT 1, -- 클릭 수, 매출액 등
    event_data JSONB DEFAULT '{}',

    -- 메타데이터
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX idx_ab_tests_status ON ab_tests(status);
CREATE INDEX idx_ab_tests_key ON ab_tests(test_key);
CREATE INDEX idx_ab_test_assignments_test ON ab_test_assignments(test_id);
CREATE INDEX idx_ab_test_assignments_user ON ab_test_assignments(user_id);
CREATE INDEX idx_ab_test_events_test ON ab_test_events(test_id);
CREATE INDEX idx_ab_test_events_type ON ab_test_events(event_type);
CREATE INDEX idx_ab_test_events_created ON ab_test_events(created_at DESC);

-- ============================================
-- 4. 사용자 변형 할당 함수
-- ============================================
CREATE OR REPLACE FUNCTION get_ab_test_variant(
    p_test_key TEXT,
    p_user_id UUID DEFAULT NULL,
    p_anonymous_id TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_test RECORD;
    v_assignment RECORD;
    v_variant TEXT;
    v_random NUMERIC;
    v_cumulative NUMERIC := 0;
    v_variant_key TEXT;
    v_variant_percent NUMERIC;
BEGIN
    -- 테스트 조회
    SELECT * INTO v_test
    FROM ab_tests
    WHERE test_key = p_test_key AND status = 'running';

    IF NOT FOUND THEN
        RETURN 'control'; -- 기본값
    END IF;

    -- 기존 할당 확인
    IF p_user_id IS NOT NULL THEN
        SELECT * INTO v_assignment
        FROM ab_test_assignments
        WHERE test_id = v_test.id AND user_id = p_user_id;
    ELSIF p_anonymous_id IS NOT NULL THEN
        SELECT * INTO v_assignment
        FROM ab_test_assignments
        WHERE test_id = v_test.id AND anonymous_id = p_anonymous_id;
    END IF;

    IF FOUND THEN
        RETURN v_assignment.variant;
    END IF;

    -- 새로운 할당 생성
    v_random := RANDOM() * 100;

    FOR v_variant_key, v_variant_percent IN
        SELECT key, value::NUMERIC
        FROM jsonb_each_text(v_test.traffic_allocation)
    LOOP
        v_cumulative := v_cumulative + v_variant_percent;
        IF v_random <= v_cumulative THEN
            v_variant := v_variant_key;
            EXIT;
        END IF;
    END LOOP;

    -- 기본값 (모든 % 합이 100이 아닐 경우)
    IF v_variant IS NULL THEN
        v_variant := 'control';
    END IF;

    -- 할당 저장
    INSERT INTO ab_test_assignments (test_id, user_id, anonymous_id, variant)
    VALUES (v_test.id, p_user_id, p_anonymous_id, v_variant);

    RETURN v_variant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. 이벤트 추적 함수
-- ============================================
CREATE OR REPLACE FUNCTION track_ab_test_event(
    p_test_key TEXT,
    p_event_type TEXT,
    p_user_id UUID DEFAULT NULL,
    p_anonymous_id TEXT DEFAULT NULL,
    p_event_value NUMERIC DEFAULT 1,
    p_event_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_test RECORD;
    v_assignment RECORD;
    v_variant TEXT;
BEGIN
    -- 테스트 조회
    SELECT * INTO v_test
    FROM ab_tests
    WHERE test_key = p_test_key AND status = 'running';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- 할당 조회
    IF p_user_id IS NOT NULL THEN
        SELECT * INTO v_assignment
        FROM ab_test_assignments
        WHERE test_id = v_test.id AND user_id = p_user_id;
    ELSIF p_anonymous_id IS NOT NULL THEN
        SELECT * INTO v_assignment
        FROM ab_test_assignments
        WHERE test_id = v_test.id AND anonymous_id = p_anonymous_id;
    END IF;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- 이벤트 기록
    INSERT INTO ab_test_events (
        test_id,
        assignment_id,
        user_id,
        anonymous_id,
        variant,
        event_type,
        event_value,
        event_data
    )
    VALUES (
        v_test.id,
        v_assignment.id,
        p_user_id,
        p_anonymous_id,
        v_assignment.variant,
        p_event_type,
        p_event_value,
        p_event_data
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 테스트 결과 통계 뷰
-- ============================================
CREATE OR REPLACE VIEW ab_test_results AS
SELECT
    t.id AS test_id,
    t.name AS test_name,
    t.test_key,
    t.status,
    a.variant,
    COUNT(DISTINCT a.id) AS total_users,
    COUNT(DISTINCT CASE WHEN e.event_type = 'view' THEN a.id END) AS views,
    COUNT(DISTINCT CASE WHEN e.event_type = 'click' THEN a.id END) AS clicks,
    COUNT(DISTINCT CASE WHEN e.event_type = 'conversion' THEN a.id END) AS conversions,
    COALESCE(SUM(CASE WHEN e.event_type = 'revenue' THEN e.event_value ELSE 0 END), 0) AS total_revenue,
    CASE
        WHEN COUNT(DISTINCT CASE WHEN e.event_type = 'view' THEN a.id END) > 0
        THEN ROUND(
            COUNT(DISTINCT CASE WHEN e.event_type = 'conversion' THEN a.id END)::NUMERIC /
            COUNT(DISTINCT CASE WHEN e.event_type = 'view' THEN a.id END) * 100, 2
        )
        ELSE 0
    END AS conversion_rate,
    CASE
        WHEN COUNT(DISTINCT CASE WHEN e.event_type = 'view' THEN a.id END) > 0
        THEN ROUND(
            COUNT(DISTINCT CASE WHEN e.event_type = 'click' THEN a.id END)::NUMERIC /
            COUNT(DISTINCT CASE WHEN e.event_type = 'view' THEN a.id END) * 100, 2
        )
        ELSE 0
    END AS click_rate
FROM ab_tests t
JOIN ab_test_assignments a ON t.id = a.test_id
LEFT JOIN ab_test_events e ON a.id = e.assignment_id
GROUP BY t.id, t.name, t.test_key, t.status, a.variant
ORDER BY t.name, a.variant;

-- ============================================
-- 7. RLS 정책
-- ============================================
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_events ENABLE ROW LEVEL SECURITY;

-- Admin만 테스트 관리 가능
CREATE POLICY "Admins can manage ab tests"
    ON ab_tests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- 할당 조회 (본인 또는 anonymous)
CREATE POLICY "Users can view own assignments"
    ON ab_test_assignments FOR SELECT
    USING (user_id = auth.uid() OR anonymous_id IS NOT NULL);

-- 할당 생성 (함수 통해서만)
CREATE POLICY "System can create assignments"
    ON ab_test_assignments FOR INSERT
    WITH CHECK (TRUE);

-- Admin 전체 접근
CREATE POLICY "Admins have full access to assignments"
    ON ab_test_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- 이벤트 생성 (함수 통해서만)
CREATE POLICY "System can create events"
    ON ab_test_events FOR INSERT
    WITH CHECK (TRUE);

-- Admin 전체 접근
CREATE POLICY "Admins have full access to events"
    ON ab_test_events FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================
-- 8. Triggers
-- ============================================
CREATE TRIGGER update_ab_tests_updated_at
    BEFORE UPDATE ON ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. 샘플 A/B 테스트 생성
-- ============================================
INSERT INTO ab_tests (name, description, test_key, variants, traffic_allocation, status)
VALUES
    (
        '랜딩 페이지 히어로 테스트',
        '히어로 섹션 헤드라인 A/B 테스트',
        'landing_hero',
        '["control", "variant_a"]',
        '{"control": 50, "variant_a": 50}',
        'draft'
    ),
    (
        '가격 표시 방식 테스트',
        '1K당 가격 vs 100개당 가격 표시',
        'pricing_display',
        '["per_1k", "per_100"]',
        '{"per_1k": 50, "per_100": 50}',
        'draft'
    ),
    (
        '결제 플로우 테스트',
        '원스텝 vs 투스텝 결제',
        'checkout_flow',
        '["one_step", "two_step"]',
        '{"one_step": 50, "two_step": 50}',
        'draft'
    )
ON CONFLICT (test_key) DO NOTHING;

-- ============================================
-- 권한 부여
-- ============================================
GRANT EXECUTE ON FUNCTION get_ab_test_variant(TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ab_test_variant(TEXT, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION track_ab_test_event(TEXT, TEXT, UUID, TEXT, NUMERIC, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION track_ab_test_event(TEXT, TEXT, UUID, TEXT, NUMERIC, JSONB) TO anon;

