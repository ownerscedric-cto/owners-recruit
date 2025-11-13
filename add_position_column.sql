-- ============================================
-- 모집인 직급(position) 컬럼 추가 마이그레이션
-- ============================================

-- recruiters 테이블에 position 컬럼 추가
ALTER TABLE public.recruiters
ADD COLUMN IF NOT EXISTS position VARCHAR(50) DEFAULT '팀장';

-- 기존 데이터에 기본값 설정 (팀장으로)
UPDATE public.recruiters
SET position = '팀장'
WHERE position IS NULL;

-- position 컬럼에 NOT NULL 제약 조건 추가
ALTER TABLE public.recruiters
ALTER COLUMN position SET NOT NULL;

-- position에 대한 체크 제약 조건 추가 (허용되는 값만)
ALTER TABLE public.recruiters
ADD CONSTRAINT recruiters_position_check
CHECK (position IN ('지점장', '부지점장', '팀장'));

-- position 컬럼에 인덱스 추가 (정렬 성능 향상)
CREATE INDEX IF NOT EXISTS idx_recruiters_position_created_at
ON public.recruiters(position, created_at);

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.recruiters.position IS '직급: 지점장, 부지점장, 팀장';

-- 확인 쿼리 (실행해서 동작 확인)
-- SELECT id, name, position, created_at FROM public.recruiters ORDER BY
--   CASE position
--     WHEN '지점장' THEN 1
--     WHEN '부지점장' THEN 2
--     WHEN '팀장' THEN 3
--     ELSE 4
--   END,
--   created_at ASC;