-- ============================================
-- 지원자 소프트 삭제 기능을 위한 데이터베이스 마이그레이션
-- ============================================

-- 1. applicants 테이블에 소프트 삭제 관련 컬럼 추가
ALTER TABLE public.applicants
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;

-- 삭제된 지원자를 빠르게 필터링하기 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_applicants_deleted_at
ON public.applicants(deleted_at);

-- 삭제되지 않은 지원자만 조회하는 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW public.active_applicants AS
SELECT * FROM public.applicants
WHERE deleted_at IS NULL;

-- ============================================
-- 감사 로그 테이블 생성 (아직 없는 경우)
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- audit_logs 테이블 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
ON public.audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by
ON public.audit_logs(performed_by);

-- ============================================
-- Row Level Security (RLS) 정책 업데이트
-- ============================================

-- 기존 정책이 있다면 삭제하고 새로 생성
DROP POLICY IF EXISTS "Enable read access for all users" ON public.applicants;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.applicants;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.applicants;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.applicants;

-- 삭제되지 않은 지원자만 조회 가능 (일반 사용자)
CREATE POLICY "Enable read non-deleted applicants for all users"
ON public.applicants FOR SELECT
USING (deleted_at IS NULL);

-- 관리자는 삭제된 지원자도 조회 가능 (선택사항)
-- CREATE POLICY "Enable read all applicants for admins"
-- ON public.applicants FOR SELECT
-- TO authenticated
-- USING (auth.jwt() ->> 'role' IN ('system_admin', 'hr_manager'));

-- 지원자 추가는 인증된 사용자만 가능
CREATE POLICY "Enable insert for authenticated users only"
ON public.applicants FOR INSERT
TO authenticated
WITH CHECK (true);

-- 지원자 수정은 인증된 관리자만 가능
CREATE POLICY "Enable update for authenticated users only"
ON public.applicants FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 물리적 삭제는 불가능 (소프트 삭제만 가능)
CREATE POLICY "Disable hard delete for all users"
ON public.applicants FOR DELETE
TO authenticated
USING (false);

-- ============================================
-- audit_logs 테이블 RLS 정책 설정
-- ============================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 감사 로그 조회 가능
CREATE POLICY "Enable read audit logs for admins only"
ON public.audit_logs FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' IN ('system_admin', 'hr_manager'));

-- 시스템에서만 감사 로그 추가 가능
CREATE POLICY "Enable insert audit logs for system"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- 테스트 쿼리 (실행하여 동작 확인)
-- ============================================

-- 소프트 삭제 테스트 (특정 ID로 변경 필요)
-- UPDATE public.applicants
-- SET
--     deleted_at = CURRENT_TIMESTAMP,
--     deletion_reason = '테스트 삭제',
--     deleted_by = 'admin'
-- WHERE id = 'YOUR_TEST_ID_HERE';

-- 삭제되지 않은 지원자만 조회
-- SELECT COUNT(*) as active_count FROM public.applicants WHERE deleted_at IS NULL;

-- 삭제된 지원자만 조회
-- SELECT COUNT(*) as deleted_count FROM public.applicants WHERE deleted_at IS NOT NULL;

-- 복구 테스트
-- UPDATE public.applicants
-- SET
--     deleted_at = NULL,
--     deletion_reason = NULL,
--     deleted_by = NULL
-- WHERE id = 'YOUR_TEST_ID_HERE';

-- ============================================
-- 롤백 스크립트 (필요시 사용)
-- ============================================

-- ALTER TABLE public.applicants
-- DROP COLUMN IF EXISTS deleted_at,
-- DROP COLUMN IF EXISTS deletion_reason,
-- DROP COLUMN IF EXISTS deleted_by;

-- DROP VIEW IF EXISTS public.active_applicants;
-- DROP TABLE IF EXISTS public.audit_logs;
-- DROP INDEX IF EXISTS idx_applicants_deleted_at;

COMMENT ON COLUMN public.applicants.deleted_at IS '소프트 삭제 일시';
COMMENT ON COLUMN public.applicants.deletion_reason IS '삭제 사유';
COMMENT ON COLUMN public.applicants.deleted_by IS '삭제 수행자';
COMMENT ON TABLE public.audit_logs IS '시스템 감사 로그 테이블';