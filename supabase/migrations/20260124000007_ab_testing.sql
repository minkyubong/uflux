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

