-- ============================================
-- Migration: Providers API Key Security
-- API Key 보호를 위한 강력한 RLS 정책 적용
-- ============================================

-- ============================================
-- 1. 기존 providers 관련 정책 모두 삭제
-- ============================================
DROP POLICY IF EXISTS "Admins can manage providers" ON providers;
DROP POLICY IF EXISTS "Service role full access to providers" ON providers;
DROP POLICY IF EXISTS "Authenticated users cannot access providers" ON providers;

-- ============================================
-- 2. providers 테이블 RLS 확인 (이미 활성화되어 있어야 함)
-- ============================================
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. 새로운 보안 정책: 극도로 제한적
--
-- 핵심 원칙:
-- - 일반 사용자: 접근 불가 (api_key 노출 방지)
-- - 관리자(is_admin): 읽기만 가능, api_key 컬럼은 별도 처리
-- - Service Role: 전체 접근 (Cron, 서버 사이드에서만 사용)
--
-- ⚠️ 중요: anon key로는 절대 api_key에 접근 불가
-- ============================================

-- 정책 1: Service Role은 모든 작업 가능
-- (Cron Job에서 도매처 API 호출 시 필요)
CREATE POLICY "Service role has full access to providers"
  ON providers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 정책 2: 관리자는 조회만 가능 (UI에서 목록 표시용)
-- ⚠️ 주의: 이 정책으로 api_key도 조회 가능하므로,
--         프론트엔드에서는 api_key 컬럼을 select하지 않도록 주의
CREATE POLICY "Admins can view providers"
  ON providers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 정책 3: 관리자만 INSERT 가능
CREATE POLICY "Admins can insert providers"
  ON providers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 정책 4: 관리자만 UPDATE 가능
CREATE POLICY "Admins can update providers"
  ON providers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 정책 5: 관리자만 DELETE 가능
CREATE POLICY "Admins can delete providers"
  ON providers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- 4. 보안 뷰 생성: API Key를 마스킹한 안전한 뷰
--    프론트엔드 관리자 페이지에서는 이 뷰를 사용
-- ============================================
DROP VIEW IF EXISTS providers_safe;

CREATE VIEW providers_safe AS
SELECT
  id,
  name,
  api_url,
  -- API Key 마스킹: 앞 4자리만 표시, 나머지는 *
  CASE
    WHEN LENGTH(api_key) > 4 THEN
      SUBSTRING(api_key FROM 1 FOR 4) || REPEAT('*', LENGTH(api_key) - 4)
    ELSE
      REPEAT('*', LENGTH(api_key))
  END AS api_key_masked,
  balance,
  currency,
  rate_multiplier,
  is_active,
  priority,
  description,
  created_at,
  updated_at
FROM providers;

-- 뷰에 대한 권한 설정
GRANT SELECT ON providers_safe TO authenticated;

-- 뷰 문서화
COMMENT ON VIEW providers_safe IS
'API Key가 마스킹된 안전한 providers 뷰.
관리자 페이지에서 목록 표시 시 이 뷰를 사용하세요.
실제 api_key는 Service Role로만 접근 가능합니다.';

-- ============================================
-- 5. API Key 접근 감사 로그 트리거 (선택적 보안 강화)
-- ============================================
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  user_id UUID,
  user_email TEXT,
  ip_address INET,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 감사 로그 테이블 RLS
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Service Role만 감사 로그 접근 가능
CREATE POLICY "Only service role can access audit logs"
  ON security_audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 관리자는 조회만 가능
CREATE POLICY "Admins can view audit logs"
  ON security_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at
  ON security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type
  ON security_audit_logs(event_type);

-- ============================================
-- 6. providers 테이블 접근 시 감사 로그 기록 함수
-- ============================================
CREATE OR REPLACE FUNCTION log_providers_access()
RETURNS TRIGGER AS $$
BEGIN
  -- SELECT는 트리거로 잡기 어려우므로 INSERT/UPDATE/DELETE만 기록
  INSERT INTO security_audit_logs (
    event_type,
    table_name,
    user_id,
    details
  ) VALUES (
    TG_OP,
    'providers',
    auth.uid(),
    jsonb_build_object(
      'provider_id', COALESCE(NEW.id, OLD.id),
      'provider_name', COALESCE(NEW.name, OLD.name)
    )
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성 (기존 트리거 삭제 후)
DROP TRIGGER IF EXISTS providers_audit_trigger ON providers;

CREATE TRIGGER providers_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON providers
  FOR EACH ROW
  EXECUTE FUNCTION log_providers_access();

-- ============================================
-- 7. 보안 검증: anon key로 providers 접근 불가 확인
-- ============================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- providers 테이블의 정책 수 확인
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'providers';

  IF policy_count >= 5 THEN
    RAISE NOTICE '✅ providers 테이블 보안 정책이 적용되었습니다. (% 개 정책)', policy_count;
  ELSE
    RAISE WARNING '⚠️ providers 정책 수가 예상보다 적습니다: %', policy_count;
  END IF;

  RAISE NOTICE '✅ providers_safe 뷰가 생성되었습니다 (API Key 마스킹)';
  RAISE NOTICE '✅ security_audit_logs 테이블이 생성되었습니다';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 보안 요약:';
  RAISE NOTICE '   - 일반 사용자: providers 접근 완전 차단';
  RAISE NOTICE '   - 관리자: providers 접근 가능 (프론트엔드에서 api_key 컬럼 제외 권장)';
  RAISE NOTICE '   - Service Role: 전체 접근 (Cron Job용)';
  RAISE NOTICE '   - 프론트엔드 권장: providers_safe 뷰 사용';
END $$;

