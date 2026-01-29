-- ============================================
-- 수정된 마이그레이션 V2 (IMMUTABLE 오류 수정)
-- ============================================

-- ============================================
-- 무료 체험 신청 시스템
-- ============================================

-- 1. FREE_TRIAL_SERVICES 테이블
CREATE TABLE IF NOT EXISTS free_trial_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    trial_quantity INTEGER NOT NULL DEFAULT 50,
    daily_limit INTEGER DEFAULT 100,
    today_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_trial_service UNIQUE (service_id)
);

-- 2. FREE_TRIALS 테이블 (trial_date 컬럼 추가로 해결)
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
    trial_date DATE DEFAULT CURRENT_DATE NOT NULL,  -- 날짜 컬럼 추가
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_daily_trial UNIQUE (user_id, service_id, trial_date)  -- 이제 작동함
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_free_trials_user ON free_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_free_trials_service ON free_trials(service_id);
CREATE INDEX IF NOT EXISTS idx_free_trials_status ON free_trials(status);
CREATE INDEX IF NOT EXISTS idx_free_trials_created_at ON free_trials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_free_trial_services_active ON free_trial_services(is_active) WHERE is_active = TRUE;

-- 3. 일일 사용량 리셋 함수
CREATE OR REPLACE FUNCTION reset_daily_trial_limits()
RETURNS void AS $$
BEGIN
    UPDATE free_trial_services SET today_used = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 무료 체험 신청 함수
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
    SELECT * INTO v_user FROM profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT * INTO v_trial_service
    FROM free_trial_services
    WHERE service_id = p_service_id AND is_active = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Free trial not available for this service';
    END IF;

    IF v_trial_service.today_used >= v_trial_service.daily_limit THEN
        RAISE EXCEPTION 'Daily trial limit reached. Please try again tomorrow.';
    END IF;

    -- trial_date로 중복 체크
    IF EXISTS (
        SELECT 1 FROM free_trials
        WHERE user_id = p_user_id
        AND service_id = p_service_id
        AND trial_date = v_today
    ) THEN
        RAISE EXCEPTION 'You already requested a free trial for this service today';
    END IF;

    INSERT INTO free_trials (
        user_id, service_id, trial_service_id, link, quantity, status, ip_address, user_agent, trial_date
    )
    VALUES (
        p_user_id, p_service_id, v_trial_service.id, p_link, v_trial_service.trial_quantity, 'pending', p_ip_address, p_user_agent, v_today
    )
    RETURNING id INTO v_trial_id;

    UPDATE free_trial_services
    SET today_used = today_used + 1
    WHERE id = v_trial_service.id;

    RETURN v_trial_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 체험 가능 여부 확인 함수
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

    IF v_trial_service.today_used >= v_trial_service.daily_limit THEN
        RETURN jsonb_build_object(
            'available', FALSE,
            'reason', 'daily_limit_reached',
            'message', '오늘의 무료 체험 한도가 소진되었습니다. 내일 다시 시도해주세요.',
            'remaining', 0
        );
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM free_trials
        WHERE user_id = p_user_id
        AND service_id = p_service_id
        AND trial_date = v_today
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

-- 6. 무료 체험 서비스 목록 뷰
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

-- 7. RLS 정책
ALTER TABLE free_trial_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_trials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view free trial services" ON free_trial_services;
CREATE POLICY "Anyone can view free trial services"
    ON free_trial_services FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage free trial services" ON free_trial_services;
CREATE POLICY "Admins can manage free trial services"
    ON free_trial_services FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Users can view own free trials" ON free_trials;
CREATE POLICY "Users can view own free trials"
    ON free_trials FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own free trials" ON free_trials;
CREATE POLICY "Users can create own free trials"
    ON free_trials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to free trials" ON free_trials;
CREATE POLICY "Admins have full access to free trials"
    ON free_trials FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

GRANT EXECUTE ON FUNCTION request_free_trial(UUID, UUID, TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_trial_availability(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_daily_trial_limits() TO service_role;

-- ============================================
-- 카카오페이 결제 연동
-- ============================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    min_amount NUMERIC(12, 2) DEFAULT 1000,
    max_amount NUMERIC(12, 2) DEFAULT 10000000,
    fee_percent NUMERIC(4, 2) DEFAULT 0,
    fee_fixed NUMERIC(12, 2) DEFAULT 0,
    config JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS kakaopay_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    deposit_id UUID REFERENCES deposits(id) ON DELETE SET NULL,
    tid TEXT UNIQUE,
    partner_order_id TEXT NOT NULL,
    partner_user_id TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    tax_free_amount INTEGER DEFAULT 0,
    vat_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ready',
    approved_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    payment_method_type TEXT,
    card_info JSONB,
    next_redirect_pc_url TEXT,
    next_redirect_mobile_url TEXT,
    next_redirect_app_url TEXT,
    error_code TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kakaopay_payments_user ON kakaopay_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_kakaopay_payments_tid ON kakaopay_payments(tid);
CREATE INDEX IF NOT EXISTS idx_kakaopay_payments_status ON kakaopay_payments(status);

CREATE OR REPLACE FUNCTION prepare_kakaopay_payment(p_user_id UUID, p_amount INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_payment_id UUID;
    v_partner_order_id TEXT;
BEGIN
    IF p_amount < 1000 THEN RAISE EXCEPTION 'Minimum payment amount is 1000 KRW'; END IF;
    v_partner_order_id := 'UFLUX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    INSERT INTO kakaopay_payments (user_id, partner_order_id, partner_user_id, total_amount, status)
    VALUES (p_user_id, v_partner_order_id, p_user_id::TEXT, p_amount, 'ready')
    RETURNING id INTO v_payment_id;
    RETURN jsonb_build_object('payment_id', v_payment_id, 'partner_order_id', v_partner_order_id, 'amount', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION approve_kakaopay_payment(p_payment_id UUID, p_tid TEXT, p_payment_method_type TEXT DEFAULT NULL, p_card_info JSONB DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    v_payment RECORD;
    v_deposit_id UUID;
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    SELECT * INTO v_payment FROM kakaopay_payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
    IF v_payment.status != 'ready' THEN RAISE EXCEPTION 'Payment already processed'; END IF;

    UPDATE kakaopay_payments SET tid = p_tid, status = 'approved', approved_at = NOW(), payment_method_type = p_payment_method_type, card_info = p_card_info, updated_at = NOW() WHERE id = p_payment_id;

    INSERT INTO deposits (user_id, amount, depositor_name, payment_method, status)
    VALUES (v_payment.user_id, v_payment.total_amount, '카카오페이', 'kakaopay', 'approved')
    RETURNING id INTO v_deposit_id;

    UPDATE kakaopay_payments SET deposit_id = v_deposit_id WHERE id = p_payment_id;

    SELECT balance INTO v_current_balance FROM profiles WHERE id = v_payment.user_id FOR UPDATE;
    v_new_balance := v_current_balance + v_payment.total_amount;

    UPDATE profiles SET balance = v_new_balance, updated_at = NOW() WHERE id = v_payment.user_id;

    INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description, reference_id, reference_type, status, metadata)
    VALUES (v_payment.user_id, 'deposit', v_payment.total_amount, v_current_balance, v_new_balance, '카카오페이 충전', v_deposit_id, 'deposit', 'approved', jsonb_build_object('payment_method', 'kakaopay', 'tid', p_tid));

    PERFORM apply_first_deposit_bonus(v_payment.user_id, v_payment.total_amount);
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cancel_kakaopay_payment(p_payment_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE v_payment RECORD;
BEGIN
    SELECT * INTO v_payment FROM kakaopay_payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
    IF v_payment.status NOT IN ('ready', 'approved') THEN RAISE EXCEPTION 'Cannot cancel'; END IF;
    UPDATE kakaopay_payments SET status = 'canceled', canceled_at = NOW(), error_message = p_reason, updated_at = NOW() WHERE id = p_payment_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

INSERT INTO payment_methods (code, name, description, icon, is_active, sort_order)
VALUES
    ('bank_transfer', '무통장 입금', '계좌이체로 입금', 'building', TRUE, 1),
    ('kakaopay', '카카오페이', '간편 결제', 'wallet', TRUE, 2),
    ('crypto', 'USDT', 'TRC-20 USDT', 'bitcoin', TRUE, 3)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE kakaopay_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active payment methods" ON payment_methods;
CREATE POLICY "Anyone can view active payment methods" ON payment_methods FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage payment methods" ON payment_methods;
CREATE POLICY "Admins can manage payment methods" ON payment_methods FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Users can view own kakaopay payments" ON kakaopay_payments;
CREATE POLICY "Users can view own kakaopay payments" ON kakaopay_payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to kakaopay payments" ON kakaopay_payments;
CREATE POLICY "Admins have full access to kakaopay payments" ON kakaopay_payments FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kakaopay_payments_updated_at ON kakaopay_payments;
CREATE TRIGGER update_kakaopay_payments_updated_at BEFORE UPDATE ON kakaopay_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

GRANT EXECUTE ON FUNCTION prepare_kakaopay_payment(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_kakaopay_payment(UUID, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION cancel_kakaopay_payment(UUID, TEXT) TO service_role;

-- ============================================
-- A/B 테스트 시스템
-- ============================================

CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    test_key TEXT UNIQUE NOT NULL,
    variants JSONB NOT NULL DEFAULT '["control", "variant_a"]',
    traffic_allocation JSONB DEFAULT '{"control": 50, "variant_a": 50}',
    status TEXT DEFAULT 'draft',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    target_audience JSONB DEFAULT '{}',
    winner_variant TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS ab_test_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    anonymous_id TEXT,
    variant TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_test UNIQUE (test_id, user_id),
    CONSTRAINT unique_anon_test UNIQUE (test_id, anonymous_id),
    CONSTRAINT check_user_or_anon CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS ab_test_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES ab_test_assignments(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    anonymous_id TEXT,
    variant TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_value NUMERIC DEFAULT 1,
    event_data JSONB DEFAULT '{}',
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_key ON ab_tests(test_key);
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_test ON ab_test_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_user ON ab_test_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_test ON ab_test_events(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_type ON ab_test_events(event_type);

CREATE OR REPLACE FUNCTION get_ab_test_variant(p_test_key TEXT, p_user_id UUID DEFAULT NULL, p_anonymous_id TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    v_test RECORD; v_assignment RECORD; v_variant TEXT; v_random NUMERIC; v_cumulative NUMERIC := 0; v_variant_key TEXT; v_variant_percent NUMERIC;
BEGIN
    SELECT * INTO v_test FROM ab_tests WHERE test_key = p_test_key AND status = 'running';
    IF NOT FOUND THEN RETURN 'control'; END IF;

    IF p_user_id IS NOT NULL THEN
        SELECT * INTO v_assignment FROM ab_test_assignments WHERE test_id = v_test.id AND user_id = p_user_id;
    ELSIF p_anonymous_id IS NOT NULL THEN
        SELECT * INTO v_assignment FROM ab_test_assignments WHERE test_id = v_test.id AND anonymous_id = p_anonymous_id;
    END IF;

    IF FOUND THEN RETURN v_assignment.variant; END IF;

    v_random := RANDOM() * 100;
    FOR v_variant_key, v_variant_percent IN SELECT key, value::NUMERIC FROM jsonb_each_text(v_test.traffic_allocation) LOOP
        v_cumulative := v_cumulative + v_variant_percent;
        IF v_random <= v_cumulative THEN v_variant := v_variant_key; EXIT; END IF;
    END LOOP;

    IF v_variant IS NULL THEN v_variant := 'control'; END IF;

    INSERT INTO ab_test_assignments (test_id, user_id, anonymous_id, variant)
    VALUES (v_test.id, p_user_id, p_anonymous_id, v_variant);

    RETURN v_variant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_ab_test_event(p_test_key TEXT, p_event_type TEXT, p_user_id UUID DEFAULT NULL, p_anonymous_id TEXT DEFAULT NULL, p_event_value NUMERIC DEFAULT 1, p_event_data JSONB DEFAULT '{}')
RETURNS BOOLEAN AS $$
DECLARE v_test RECORD; v_assignment RECORD;
BEGIN
    SELECT * INTO v_test FROM ab_tests WHERE test_key = p_test_key AND status = 'running';
    IF NOT FOUND THEN RETURN FALSE; END IF;

    IF p_user_id IS NOT NULL THEN
        SELECT * INTO v_assignment FROM ab_test_assignments WHERE test_id = v_test.id AND user_id = p_user_id;
    ELSIF p_anonymous_id IS NOT NULL THEN
        SELECT * INTO v_assignment FROM ab_test_assignments WHERE test_id = v_test.id AND anonymous_id = p_anonymous_id;
    END IF;

    IF NOT FOUND THEN RETURN FALSE; END IF;

    INSERT INTO ab_test_events (test_id, assignment_id, user_id, anonymous_id, variant, event_type, event_value, event_data)
    VALUES (v_test.id, v_assignment.id, p_user_id, p_anonymous_id, v_assignment.variant, p_event_type, p_event_value, p_event_data);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE VIEW ab_test_results AS
SELECT
    t.id AS test_id, t.name AS test_name, t.test_key, t.status, a.variant,
    COUNT(DISTINCT a.id) AS total_users,
    COUNT(DISTINCT CASE WHEN e.event_type = 'view' THEN a.id END) AS views,
    COUNT(DISTINCT CASE WHEN e.event_type = 'click' THEN a.id END) AS clicks,
    COUNT(DISTINCT CASE WHEN e.event_type = 'conversion' THEN a.id END) AS conversions,
    COALESCE(SUM(CASE WHEN e.event_type = 'revenue' THEN e.event_value ELSE 0 END), 0) AS total_revenue
FROM ab_tests t
JOIN ab_test_assignments a ON t.id = a.test_id
LEFT JOIN ab_test_events e ON a.id = e.assignment_id
GROUP BY t.id, t.name, t.test_key, t.status, a.variant;

ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage ab tests" ON ab_tests;
CREATE POLICY "Admins can manage ab tests" ON ab_tests FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Users can view own assignments" ON ab_test_assignments;
CREATE POLICY "Users can view own assignments" ON ab_test_assignments FOR SELECT USING (user_id = auth.uid() OR anonymous_id IS NOT NULL);

DROP POLICY IF EXISTS "System can create assignments" ON ab_test_assignments;
CREATE POLICY "System can create assignments" ON ab_test_assignments FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins have full access to assignments" ON ab_test_assignments;
CREATE POLICY "Admins have full access to assignments" ON ab_test_assignments FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "System can create events" ON ab_test_events;
CREATE POLICY "System can create events" ON ab_test_events FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins have full access to events" ON ab_test_events;
CREATE POLICY "Admins have full access to events" ON ab_test_events FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP TRIGGER IF EXISTS update_ab_tests_updated_at ON ab_tests;
CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON ab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO ab_tests (name, description, test_key, variants, traffic_allocation, status)
VALUES
    ('랜딩 히어로 테스트', '헤드라인 A/B', 'landing_hero', '["control", "variant_a"]', '{"control": 50, "variant_a": 50}', 'draft'),
    ('가격 표시 테스트', '1K vs 100개', 'pricing_display', '["per_1k", "per_100"]', '{"per_1k": 50, "per_100": 50}', 'draft')
ON CONFLICT (test_key) DO NOTHING;

GRANT EXECUTE ON FUNCTION get_ab_test_variant(TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ab_test_variant(TEXT, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION track_ab_test_event(TEXT, TEXT, UUID, TEXT, NUMERIC, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION track_ab_test_event(TEXT, TEXT, UUID, TEXT, NUMERIC, JSONB) TO anon;

-- ============================================
-- 완료!
-- ============================================
SELECT '마이그레이션 V2 완료!' AS result;

