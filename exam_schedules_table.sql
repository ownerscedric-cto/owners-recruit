-- 시험 일정 테이블 생성 SQL
-- 본사로부터 받는 시험 일정 정보를 효율적으로 관리하기 위한 테이블

-- 1. 시험 일정 테이블 생성
CREATE TABLE exam_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  exam_type VARCHAR(50) NOT NULL, -- 생보, 손보, 제3보험 등
  session_number INTEGER NOT NULL, -- 1차, 2차, ..., 10차
  registration_start_date DATE NOT NULL,
  registration_end_date DATE NOT NULL,
  exam_date DATE NOT NULL,
  exam_time_start TIME NOT NULL,
  exam_time_end TIME NOT NULL,
  locations TEXT[] NOT NULL, -- 서울, 부산, 대구, 광주, 전주, 대전, 서산, 원주, 강릉, 춘천
  notes TEXT, -- 추가 안내사항
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(year, exam_type, session_number)
);

-- 2. 인덱스 생성 (효율적인 쿼리를 위해)
CREATE INDEX idx_exam_schedules_year_type ON exam_schedules(year, exam_type);
CREATE INDEX idx_exam_schedules_exam_date ON exam_schedules(exam_date);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 모든 인증된 사용자가 시험 일정을 읽을 수 있도록 허용
CREATE POLICY "Allow read access to exam schedules" ON exam_schedules
    FOR SELECT USING (true);

-- 서비스 역할이 시험 일정을 관리할 수 있도록 허용 (관리자 작업용)
CREATE POLICY "Service role can manage exam schedules" ON exam_schedules
    FOR ALL USING (auth.role() = 'service_role');

-- 5. updated_at 자동 업데이트 트리거 함수 생성 (이미 존재하지 않는 경우)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. 트리거 생성
CREATE TRIGGER update_exam_schedules_updated_at
    BEFORE UPDATE ON exam_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 샘플 데이터 (선택사항 - 테스트용)
-- INSERT INTO exam_schedules (
--   year, exam_type, session_number,
--   registration_start_date, registration_end_date, exam_date,
--   exam_time_start, exam_time_end, locations, notes
-- ) VALUES
-- (2025, '생보', 1, '2025-01-15', '2025-02-15', '2025-03-15', '10:00', '12:00', ARRAY['서울', '부산', '대구'], '1차 생명보험 시험'),
-- (2025, '생보', 2, '2025-03-15', '2025-04-15', '2025-05-15', '10:00', '12:00', ARRAY['서울', '부산', '대구'], '2차 생명보험 시험'),
-- (2025, '손보', 1, '2025-02-01', '2025-03-01', '2025-04-01', '14:00', '16:00', ARRAY['서울', '부산'], '1차 손해보험 시험');

-- 실행 완료 확인 쿼리
SELECT 'exam_schedules 테이블이 성공적으로 생성되었습니다.' as message;