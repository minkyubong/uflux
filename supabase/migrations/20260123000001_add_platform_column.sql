-- services 테이블에 platform 컬럼 추가
ALTER TABLE services ADD COLUMN IF NOT EXISTS platform TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_services_platform ON services(platform);
CREATE INDEX IF NOT EXISTS idx_services_is_featured ON services(is_featured);

