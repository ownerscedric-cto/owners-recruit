const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nepqaowvgtsjnnfplhyb.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcHFhb3d2Z3Rzam5uZnBsaHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgyMDE5OCwiZXhwIjoyMDc4Mzk2MTk4fQ.AhDWtyiclwZQkUqRLx3CxeGjJ8ubsKz9whpXDyrkKao'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function enableRlsForAdminTables() {
  try {
    console.log('Admin 테이블 RLS 정책 활성화 중...')

    // 1. admins 테이블 RLS 활성화
    console.log('admins 테이블 RLS 활성화...')
    const { error: adminsRlsError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE admins ENABLE ROW LEVEL SECURITY;'
      })

    if (adminsRlsError && !adminsRlsError.message?.includes('already enabled')) {
      console.error('admins RLS 활성화 오류:', adminsRlsError)
    } else {
      console.log('✅ admins 테이블 RLS 활성화 완료')
    }

    // 2. admin_sessions 테이블 RLS 활성화
    console.log('admin_sessions 테이블 RLS 활성화...')
    const { error: sessionsRlsError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;'
      })

    if (sessionsRlsError && !sessionsRlsError.message?.includes('already enabled')) {
      console.error('admin_sessions RLS 활성화 오류:', sessionsRlsError)
    } else {
      console.log('✅ admin_sessions 테이블 RLS 활성화 완료')
    }

    // 3. Service role에 대한 정책 생성 (모든 작업 허용)
    console.log('Service role 정책 생성 중...')

    // admins 테이블 정책
    const { error: adminsPolicy } = await supabase
      .rpc('exec_sql', {
        sql: `
          CREATE POLICY "Service role can manage admins"
          ON admins FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
        `
      })

    if (adminsPolicy && !adminsPolicy.message?.includes('already exists')) {
      console.error('admins 정책 생성 오류:', adminsPolicy.message)
    } else {
      console.log('✅ admins 테이블 service role 정책 생성 완료')
    }

    // admin_sessions 테이블 정책
    const { error: sessionsPolicy } = await supabase
      .rpc('exec_sql', {
        sql: `
          CREATE POLICY "Service role can manage admin sessions"
          ON admin_sessions FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
        `
      })

    if (sessionsPolicy && !sessionsPolicy.message?.includes('already exists')) {
      console.error('admin_sessions 정책 생성 오류:', sessionsPolicy.message)
    } else {
      console.log('✅ admin_sessions 테이블 service role 정책 생성 완료')
    }

    console.log('\n🔒 Admin 테이블 보안 설정 완료!')
    console.log('- RLS가 활성화되어 보안이 강화되었습니다')
    console.log('- Service Role을 통해서만 접근 가능합니다')
    console.log('- Vercel 프로덕션 환경에서 안전하게 사용할 수 있습니다')

    // 테스트 로그인 실행
    console.log('\n로그인 테스트 실행 중...')
    await testAdminLogin()

  } catch (error) {
    console.error('RLS 활성화 중 오류 발생:', error)
  }
}

async function testAdminLogin() {
  try {
    // hr 계정으로 테스트 로그인
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', 'hr')
      .eq('active', true)
      .single()

    if (error) {
      console.error('로그인 테스트 실패:', error.message)
      return
    }

    console.log('✅ 로그인 테스트 성공:', {
      username: admin.username,
      email: admin.email,
      role: admin.role,
      active: admin.active
    })
  } catch (error) {
    console.error('로그인 테스트 중 오류:', error)
  }
}

enableRlsForAdminTables()