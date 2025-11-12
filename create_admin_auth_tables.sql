-- 관리자 인증 시스템 테이블 생성

-- 관리자 계정 테이블
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'hr_manager', 'system_admin')),
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 관리자 세션 테이블
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- RLS 정책 활성화
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- 관리자만 자신의 정보 조회 가능
CREATE POLICY "Admins can view own data" ON admins
  FOR SELECT USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

-- 관리자 세션은 해당 관리자만 조회 가능
CREATE POLICY "Admins can view own sessions" ON admin_sessions
  FOR SELECT USING (auth.uid()::text = admin_id::text OR auth.role() = 'service_role');

-- service_role은 모든 작업 가능
CREATE POLICY "Service role full access admins" ON admins
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access admin_sessions" ON admin_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- 기본 관리자 계정 생성 (비밀번호: admin123!)
-- bcrypt 해시: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO admins (username, email, password_hash, role) VALUES
  ('admin', 'admin@owners.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'system_admin'),
  ('hr', 'hr@owners.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hr_manager')
ON CONFLICT (username) DO NOTHING;