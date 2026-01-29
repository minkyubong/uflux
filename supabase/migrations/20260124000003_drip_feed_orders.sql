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

