-- ============================================
-- UFLUX Reseller API Keys
-- 리셀러 API 키 관리 테이블
-- ============================================

-- API 키 테이블
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    api_key TEXT UNIQUE NOT NULL,
    name TEXT DEFAULT 'Default API Key',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    rate_limit INTEGER DEFAULT 100, -- 분당 요청 제한
    allowed_ips TEXT[], -- 허용된 IP 목록 (null이면 모든 IP 허용)
    total_requests BIGINT DEFAULT 0,
    total_orders BIGINT DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- null이면 만료 없음
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_api_key ON api_keys(api_key);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- API 요청 로그 테이블 (선택적, 디버깅/분석용)
CREATE TABLE IF NOT EXISTS api_request_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    request_data JSONB,
    response_data JSONB,
    status_code INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 (로그 테이블)
CREATE INDEX idx_api_request_logs_api_key_id ON api_request_logs(api_key_id);
CREATE INDEX idx_api_request_logs_user_id ON api_request_logs(user_id);
CREATE INDEX idx_api_request_logs_action ON api_request_logs(action);
CREATE INDEX idx_api_request_logs_created_at ON api_request_logs(created_at DESC);

-- API 키 생성 함수
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
    key TEXT;
BEGIN
    -- 32자리 랜덤 hex 문자열 생성
    key := encode(gen_random_bytes(16), 'hex');
    RETURN key;
END;
$$ LANGUAGE plpgsql;

-- 사용자당 API 키 개수 제한 (최대 5개)
CREATE OR REPLACE FUNCTION check_api_key_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM api_keys WHERE user_id = NEW.user_id) >= 5 THEN
        RAISE EXCEPTION 'Maximum 5 API keys per user';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_api_key_limit
    BEFORE INSERT ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION check_api_key_limit();

-- updated_at 자동 갱신
CREATE TRIGGER trigger_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 API 키만 볼 수 있음
CREATE POLICY "Users can view own api keys"
    ON api_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys"
    ON api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys"
    ON api_keys FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys"
    ON api_keys FOR DELETE
    USING (auth.uid() = user_id);

-- 관리자는 모든 API 키 접근 가능
CREATE POLICY "Admins can view all api keys"
    ON api_keys FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = TRUE
        )
    );

-- API 로그 정책
CREATE POLICY "Users can view own api logs"
    ON api_request_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all api logs"
    ON api_request_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = TRUE
        )
    );

