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

