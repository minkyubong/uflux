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

