-- 시험 일정 테이블 업데이트 SQL
-- 복합 파싱 API (이미지 + 텍스트) 결과를 지원하기 위한 스키마 개선

-- 1. 기존 테이블에 새로운 필드 추가
ALTER TABLE exam_schedules
ADD COLUMN IF NOT EXISTS session_range VARCHAR(20), -- "1~4차", "5~6차" 형태
ADD COLUMN IF NOT EXISTS internal_deadline_date DATE, -- 내부 신청 마감일
ADD COLUMN IF NOT EXISTS internal_deadline_time TIME, -- 내부 신청 마감시간
ADD COLUMN IF NOT EXISTS notice_date DATE, -- 수험표 공지일
ADD COLUMN IF NOT EXISTS notice_time TIME, -- 수험표 공지시간
ADD COLUMN IF NOT EXISTS has_internal_deadline BOOLEAN DEFAULT FALSE, -- 내부 마감일정 여부
ADD COLUMN IF NOT EXISTS data_source VARCHAR(20) DEFAULT 'manual', -- 데이터 출처: 'combined', 'official_only', 'internal_only', 'manual'
ADD COLUMN IF NOT EXISTS combined_notes TEXT; -- 통합된 노트 정보

-- 2. registration_start_date와 registration_end_date NULL 허용으로 변경
-- (공식 일정에서 접수기간이 명시되지 않는 경우 대비)
ALTER TABLE exam_schedules
ALTER COLUMN registration_start_date DROP NOT NULL,
ALTER COLUMN registration_end_date DROP NOT NULL;

-- 3. exam_date NULL 허용으로 변경
-- (내부 마감일정만 있고 공식 시험일이 아직 발표되지 않은 경우 대비)
ALTER TABLE exam_schedules
ALTER COLUMN exam_date DROP NOT NULL,
ALTER COLUMN exam_time_start DROP NOT NULL,
ALTER COLUMN exam_time_end DROP NOT NULL;

-- 4. 새로운 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_exam_schedules_internal_deadline ON exam_schedules(internal_deadline_date) WHERE internal_deadline_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exam_schedules_data_source ON exam_schedules(data_source);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_has_internal_deadline ON exam_schedules(has_internal_deadline) WHERE has_internal_deadline = true;

-- 5. 기존 UNIQUE 제약조건 업데이트 (session_range 고려)
-- 기존 제약조건 삭제
ALTER TABLE exam_schedules DROP CONSTRAINT IF EXISTS exam_schedules_year_exam_type_session_number_key;

-- 새로운 제약조건 추가 (session_range 또는 session_number 기반)
CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_schedules_unique_session
ON exam_schedules(year, exam_type, session_number, COALESCE(session_range, ''));

-- 6. 데이터 마이그레이션: 기존 데이터에 기본값 설정
UPDATE exam_schedules
SET
    data_source = 'manual',
    has_internal_deadline = FALSE,
    combined_notes = notes
WHERE data_source IS NULL;

-- 7. CHECK 제약조건 추가 (데이터 무결성 보장)
ALTER TABLE exam_schedules
ADD CONSTRAINT chk_data_source CHECK (data_source IN ('combined', 'official_only', 'internal_only', 'manual'));

ALTER TABLE exam_schedules
ADD CONSTRAINT chk_exam_type CHECK (exam_type IN ('생보', '손보', '제3보험'));

-- 내부 마감일정이 있으면 마감일도 있어야 함
ALTER TABLE exam_schedules
ADD CONSTRAINT chk_internal_deadline_consistency
CHECK (
    (has_internal_deadline = TRUE AND internal_deadline_date IS NOT NULL) OR
    (has_internal_deadline = FALSE)
);

-- 8. 복합 파싱 결과 처리를 위한 함수 생성
CREATE OR REPLACE FUNCTION insert_combined_schedule(
    p_year INTEGER,
    p_exam_type VARCHAR(50),
    p_session_number INTEGER,
    p_session_range VARCHAR(20) DEFAULT NULL,
    p_registration_start_date DATE DEFAULT NULL,
    p_registration_end_date DATE DEFAULT NULL,
    p_exam_date DATE DEFAULT NULL,
    p_exam_time_start TIME DEFAULT NULL,
    p_exam_time_end TIME DEFAULT NULL,
    p_locations TEXT[] DEFAULT ARRAY[]::TEXT[],
    p_internal_deadline_date DATE DEFAULT NULL,
    p_internal_deadline_time TIME DEFAULT NULL,
    p_notice_date DATE DEFAULT NULL,
    p_notice_time TIME DEFAULT NULL,
    p_has_internal_deadline BOOLEAN DEFAULT FALSE,
    p_data_source VARCHAR(20) DEFAULT 'combined',
    p_notes TEXT DEFAULT NULL,
    p_combined_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    schedule_id UUID;
BEGIN
    INSERT INTO exam_schedules (
        year, exam_type, session_number, session_range,
        registration_start_date, registration_end_date,
        exam_date, exam_time_start, exam_time_end,
        locations, internal_deadline_date, internal_deadline_time,
        notice_date, notice_time, has_internal_deadline,
        data_source, notes, combined_notes
    ) VALUES (
        p_year, p_exam_type, p_session_number, p_session_range,
        p_registration_start_date, p_registration_end_date,
        p_exam_date, p_exam_time_start, p_exam_time_end,
        p_locations, p_internal_deadline_date, p_internal_deadline_time,
        p_notice_date, p_notice_time, p_has_internal_deadline,
        p_data_source, p_notes, p_combined_notes
    )
    ON CONFLICT (year, exam_type, session_number, COALESCE(session_range, ''))
    DO UPDATE SET
        session_range = EXCLUDED.session_range,
        registration_start_date = COALESCE(EXCLUDED.registration_start_date, exam_schedules.registration_start_date),
        registration_end_date = COALESCE(EXCLUDED.registration_end_date, exam_schedules.registration_end_date),
        exam_date = COALESCE(EXCLUDED.exam_date, exam_schedules.exam_date),
        exam_time_start = COALESCE(EXCLUDED.exam_time_start, exam_schedules.exam_time_start),
        exam_time_end = COALESCE(EXCLUDED.exam_time_end, exam_schedules.exam_time_end),
        locations = CASE
            WHEN array_length(EXCLUDED.locations, 1) > 0 THEN EXCLUDED.locations
            ELSE exam_schedules.locations
        END,
        internal_deadline_date = EXCLUDED.internal_deadline_date,
        internal_deadline_time = EXCLUDED.internal_deadline_time,
        notice_date = EXCLUDED.notice_date,
        notice_time = EXCLUDED.notice_time,
        has_internal_deadline = EXCLUDED.has_internal_deadline,
        data_source = EXCLUDED.data_source,
        notes = COALESCE(EXCLUDED.notes, exam_schedules.notes),
        combined_notes = EXCLUDED.combined_notes,
        updated_at = TIMEZONE('utc', NOW())
    RETURNING id INTO schedule_id;

    RETURN schedule_id;
END;
$$ LANGUAGE plpgsql;

-- 9. 복합 스케줄 조회를 위한 뷰 생성
CREATE OR REPLACE VIEW v_exam_schedules_complete AS
SELECT
    id,
    year,
    exam_type,
    session_number,
    session_range,
    registration_start_date,
    registration_end_date,
    exam_date,
    exam_time_start,
    exam_time_end,
    locations,
    internal_deadline_date,
    internal_deadline_time,
    notice_date,
    notice_time,
    has_internal_deadline,
    data_source,
    notes,
    combined_notes,
    -- 편의성을 위한 계산 필드들
    CASE
        WHEN internal_deadline_date IS NOT NULL AND exam_date IS NOT NULL
        THEN exam_date - internal_deadline_date
        ELSE NULL
    END AS days_between_deadline_and_exam,

    CASE
        WHEN internal_deadline_date IS NOT NULL AND internal_deadline_date < CURRENT_DATE
        THEN TRUE
        ELSE FALSE
    END AS is_internal_deadline_passed,

    CASE
        WHEN exam_date IS NOT NULL AND exam_date < CURRENT_DATE
        THEN TRUE
        ELSE FALSE
    END AS is_exam_completed,

    created_at,
    updated_at
FROM exam_schedules
ORDER BY year DESC, exam_type, session_number;

-- 10. 권한 설정
GRANT SELECT ON v_exam_schedules_complete TO authenticated;
GRANT EXECUTE ON FUNCTION insert_combined_schedule TO service_role;

-- 실행 완료 확인
SELECT 'exam_schedules 테이블이 복합 파싱 API를 지원하도록 성공적으로 업데이트되었습니다.' as message;