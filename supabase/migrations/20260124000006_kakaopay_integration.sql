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

