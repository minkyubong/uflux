-- test1@gmail.com을 관리자로 설정
UPDATE profiles
SET is_admin = TRUE
WHERE email = 'test1@gmail.com';

-- 테스트용 잔액 충전 (100,000원)
UPDATE profiles
SET balance = 100000
WHERE email = 'test1@gmail.com';

