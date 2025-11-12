-- 지원자 상태 enum
CREATE TYPE applicant_status AS ENUM ('pending', 'reviewing', 'approved', 'rejected', 'completed');

-- 모집인 테이블
CREATE TABLE recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  team VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 지원자 테이블
CREATE TABLE applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  birth_date DATE NOT NULL,
  status applicant_status DEFAULT 'pending',
  recruiter_id UUID REFERENCES recruiters(id),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 서류 테이블
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 경력 테이블
CREATE TABLE careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  company VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT
);

-- 자격증 테이블
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE
);

-- 인덱스 생성
CREATE INDEX idx_applicants_status ON applicants(status);
CREATE INDEX idx_applicants_recruiter_id ON applicants(recruiter_id);
CREATE INDEX idx_applicants_submitted_at ON applicants(submitted_at);
CREATE INDEX idx_documents_applicant_id ON documents(applicant_id);
CREATE INDEX idx_careers_applicant_id ON careers(applicant_id);
CREATE INDEX idx_certificates_applicant_id ON certificates(applicant_id);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거
CREATE TRIGGER update_applicants_updated_at
    BEFORE UPDATE ON applicants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입
INSERT INTO recruiters (name, email, phone, team) VALUES
('이모집', 'lee.recruit@owners.com', '010-1234-5678', '영업1팀'),
('김모집', 'kim.recruit@owners.com', '010-2345-6789', '영업2팀'),
('박모집', 'park.recruit@owners.com', '010-3456-7890', '영업3팀');

-- 샘플 지원자 데이터
INSERT INTO applicants (name, email, phone, address, birth_date, status, recruiter_id)
VALUES
('김영희', 'younghee@email.com', '010-1111-2222', '서울시 강남구 테헤란로 123', '1985-03-15', 'pending', (SELECT id FROM recruiters WHERE name = '이모집')),
('박철수', 'chulsoo@email.com', '010-3333-4444', '서울시 서초구 서초대로 456', '1980-07-22', 'approved', (SELECT id FROM recruiters WHERE name = '김모집')),
('이민정', 'minjung@email.com', '010-5555-6666', '경기도 성남시 분당구 정자로 789', '1990-11-08', 'reviewing', (SELECT id FROM recruiters WHERE name = '박모집')),
('정현수', 'hyunsoo@email.com', '010-7777-8888', '인천시 남동구 구월로 101', '1988-05-12', 'pending', (SELECT id FROM recruiters WHERE name = '이모집')),
('황미영', 'miyoung@email.com', '010-9999-0000', '부산시 해운대구 해운대로 202', '1992-09-30', 'completed', (SELECT id FROM recruiters WHERE name = '김모집'));

-- RLS(Row Level Security) 활성화 (옵션)
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;