-- ============================================
-- 누락된 마이그레이션 (1~4번)
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
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code TEXT;
  v_signup_bonus NUMERIC := 1000;
BEGIN
  v_referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));

  INSERT INTO public.profiles (
    id, email, full_name, balance, total_spent, total_orders, tier,
    referral_code, is_admin, is_active,
    signup_bonus_received, first_deposit_bonus_received, total_points_earned,
    created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    v_signup_bonus, 0, 0, 'basic',
    v_referral_code, FALSE, TRUE,
    TRUE, FALSE, 0,
    NOW(), NOW()
  );

  INSERT INTO public.transactions (
    user_id, type, amount, balance_before, balance_after,
    description, status, metadata
  )
  VALUES (
    NEW.id, 'bonus', v_signup_bonus, 0, v_signup_bonus,
    '회원가입 축하 보너스', 'approved',
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 3. 첫충전 20% 보너스 함수
-- ============================================
CREATE OR REPLACE FUNCTION apply_first_deposit_bonus(p_user_id UUID, p_deposit_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  v_is_first_deposit BOOLEAN;
  v_bonus_rate NUMERIC := 0.20;
  v_bonus_amount NUMERIC;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  SELECT NOT first_deposit_bonus_received INTO v_is_first_deposit
  FROM profiles WHERE id = p_user_id;

  IF NOT v_is_first_deposit THEN RETURN 0; END IF;

  v_bonus_amount := FLOOR(p_deposit_amount * v_bonus_rate);

  SELECT balance INTO v_current_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
  v_new_balance := v_current_balance + v_bonus_amount;

  UPDATE profiles
  SET balance = v_new_balance,
      first_deposit_bonus_received = TRUE,
      total_points_earned = total_points_earned + v_bonus_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description, status, metadata)
  VALUES (p_user_id, 'bonus', v_bonus_amount, v_current_balance, v_new_balance, '첫충전 20% 보너스', 'approved',
    jsonb_build_object('bonus_type', 'first_deposit', 'deposit_amount', p_deposit_amount, 'bonus_rate', v_bonus_rate));

  RETURN v_bonus_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. 주문 적립금 함수 (5만원 이상 5% 적립)
-- ============================================
CREATE OR REPLACE FUNCTION apply_order_points(p_user_id UUID, p_order_amount NUMERIC, p_order_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_min_amount NUMERIC := 50000;
  v_points_rate NUMERIC := 0.05;
  v_points_amount NUMERIC;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  IF p_order_amount < v_min_amount THEN RETURN 0; END IF;

  v_points_amount := FLOOR(p_order_amount * v_points_rate);

  SELECT balance INTO v_current_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
  v_new_balance := v_current_balance + v_points_amount;

  UPDATE profiles
  SET balance = v_new_balance,
      total_points_earned = total_points_earned + v_points_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description, reference_id, reference_type, status, metadata)
  VALUES (p_user_id, 'bonus', v_points_amount, v_current_balance, v_new_balance, '주문 적립금(5%)', p_order_id, 'order', 'approved',
    jsonb_build_object('bonus_type', 'order_points', 'order_amount', p_order_amount, 'points_rate', v_points_rate));

  RETURN v_points_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. VIP 등급별 추가 적립
-- ============================================
CREATE OR REPLACE FUNCTION get_tier_bonus_rate(p_tier user_tier)
RETURNS NUMERIC AS $$
BEGIN
  CASE p_tier
    WHEN 'basic' THEN RETURN 0;
    WHEN 'vip' THEN RETURN 0.01;
    WHEN 'premium' THEN RETURN 0.02;
    WHEN 'enterprise' THEN RETURN 0.03;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

GRANT EXECUTE ON FUNCTION apply_first_deposit_bonus(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_order_points(UUID, NUMERIC, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tier_bonus_rate(user_tier) TO authenticated;

-- ============================================
-- 리뷰/평점 시스템
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    helpful_count INTEGER DEFAULT 0,
    reply TEXT,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_order_review UNIQUE (order_id),
    CONSTRAINT unique_user_service_review UNIQUE (user_id, service_id, order_id)
);

CREATE TABLE IF NOT EXISTS review_helpful (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_helpful UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_visible ON reviews(is_visible) WHERE is_visible = TRUE;

CREATE OR REPLACE VIEW service_ratings AS
SELECT
    s.id AS service_id, s.name AS service_name,
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

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view visible reviews" ON reviews;
CREATE POLICY "Anyone can view visible reviews" ON reviews FOR SELECT USING (is_visible = TRUE);

DROP POLICY IF EXISTS "Users can create own reviews" ON reviews;
CREATE POLICY "Users can create own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to reviews" ON reviews;
CREATE POLICY "Admins have full access to reviews" ON reviews FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Anyone can view helpful counts" ON review_helpful;
CREATE POLICY "Anyone can view helpful counts" ON review_helpful FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can mark helpful" ON review_helpful;
CREATE POLICY "Users can mark helpful" ON review_helpful FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove helpful" ON review_helpful;
CREATE POLICY "Users can remove helpful" ON review_helpful FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION create_review(p_order_id UUID, p_rating INTEGER, p_content TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID; v_service_id UUID; v_order_status order_status; v_review_id UUID;
BEGIN
    SELECT user_id, service_id, status INTO v_user_id, v_service_id, v_order_status FROM orders WHERE id = p_order_id;
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
    IF v_user_id != auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
    IF v_order_status NOT IN ('completed', 'partial') THEN RAISE EXCEPTION 'Can only review completed orders'; END IF;
    IF EXISTS (SELECT 1 FROM reviews WHERE order_id = p_order_id) THEN RAISE EXCEPTION 'Review already exists'; END IF;

    INSERT INTO reviews (user_id, service_id, order_id, rating, content, is_verified)
    VALUES (v_user_id, v_service_id, p_order_id, p_rating, p_content, TRUE)
    RETURNING id INTO v_review_id;

    RETURN v_review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION toggle_review_helpful(p_review_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_user_id UUID := auth.uid(); v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM review_helpful WHERE review_id = p_review_id AND user_id = v_user_id) INTO v_exists;

    IF v_exists THEN
        DELETE FROM review_helpful WHERE review_id = p_review_id AND user_id = v_user_id;
        UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = p_review_id;
        RETURN FALSE;
    ELSE
        INSERT INTO review_helpful (review_id, user_id) VALUES (p_review_id, v_user_id);
        UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = p_review_id;
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

GRANT EXECUTE ON FUNCTION create_review(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_review_helpful(UUID) TO authenticated;

-- ============================================
-- Drip-feed 주문 시스템
-- ============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_drip_feed BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS drip_feed_runs INTEGER DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS drip_feed_interval INTEGER DEFAULT 60;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS drip_feed_quantity INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS drip_feed_completed_runs INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS next_drip_feed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS drip_feed_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    run_number INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    provider_order_id TEXT,
    status order_status DEFAULT 'pending',
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_drip_feed_logs_order ON drip_feed_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_drip_feed_logs_status ON drip_feed_logs(status);
CREATE INDEX IF NOT EXISTS idx_orders_drip_feed ON orders(is_drip_feed) WHERE is_drip_feed = TRUE;

ALTER TABLE drip_feed_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own drip feed logs" ON drip_feed_logs;
CREATE POLICY "Users can view own drip feed logs" ON drip_feed_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = drip_feed_logs.order_id AND orders.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins have full access to drip feed logs" ON drip_feed_logs;
CREATE POLICY "Admins have full access to drip feed logs" ON drip_feed_logs FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================
-- 타겟팅 옵션
-- ============================================

CREATE TABLE IF NOT EXISTS targeting_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    supports_gender_targeting BOOLEAN DEFAULT FALSE,
    gender_options TEXT[] DEFAULT ARRAY['all', 'male', 'female'],
    gender_price_multiplier NUMERIC(4, 2) DEFAULT 1.2,
    supports_age_targeting BOOLEAN DEFAULT FALSE,
    age_ranges TEXT[] DEFAULT ARRAY['all', '18-24', '25-34', '35-44', '45-54', '55+'],
    age_price_multiplier NUMERIC(4, 2) DEFAULT 1.3,
    supports_country_targeting BOOLEAN DEFAULT FALSE,
    countries TEXT[] DEFAULT ARRAY['KR', 'US', 'JP', 'CN', 'VN', 'TH'],
    country_price_multiplier NUMERIC(4, 2) DEFAULT 1.5,
    supports_language_targeting BOOLEAN DEFAULT FALSE,
    languages TEXT[] DEFAULT ARRAY['ko', 'en', 'ja', 'zh', 'vi'],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_service_targeting UNIQUE (service_id)
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS targeting JSONB DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS targeting_multiplier NUMERIC(4, 2) DEFAULT 1.0;

ALTER TABLE targeting_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view targeting options" ON targeting_options;
CREATE POLICY "Anyone can view targeting options" ON targeting_options FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage targeting options" ON targeting_options;
CREATE POLICY "Admins can manage targeting options" ON targeting_options FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP TRIGGER IF EXISTS update_targeting_options_updated_at ON targeting_options;
CREATE TRIGGER update_targeting_options_updated_at BEFORE UPDATE ON targeting_options FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 완료!
-- ============================================
SELECT '누락된 마이그레이션 완료!' AS result;

