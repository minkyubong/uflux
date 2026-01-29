-- ============================================
-- Fix User Trigger - 회원가입 트리거 수정
-- ============================================

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS handle_new_user();

-- 회원가입 시 자동 프로필 생성 함수 (수정됨)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code TEXT;
BEGIN
  -- 고유 추천인 코드 생성
  v_referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));

  -- 프로필 생성 (필수 컬럼만)
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
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    0,
    0,
    0,
    'basic',
    v_referral_code,
    FALSE,
    TRUE,
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- 에러 로그 (디버깅용)
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 재생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- profiles 테이블에 서비스 역할 권한 부여
GRANT ALL ON public.profiles TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

