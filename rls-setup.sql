-- Admin 테이블 RLS 활성화 및 정책 설정

-- 1. admins 테이블 RLS 활성화
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 2. admin_sessions 테이블 RLS 활성화
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Service role이 모든 작업을 수행할 수 있도록 정책 생성

-- admins 테이블 정책
DROP POLICY IF EXISTS "Service role can manage admins" ON admins;
CREATE POLICY "Service role can manage admins"
ON admins FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- admin_sessions 테이블 정책
DROP POLICY IF EXISTS "Service role can manage admin sessions" ON admin_sessions;
CREATE POLICY "Service role can manage admin sessions"
ON admin_sessions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. 추가로 authenticated 사용자가 자신의 정보만 볼 수 있는 정책 (필요시)
-- CREATE POLICY "Admins can view own data"
-- ON admins FOR SELECT
-- TO authenticated
-- USING (auth.jwt() ->> 'sub' = id::text);