const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nepqaowvgtsjnnfplhyb.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcHFhb3d2Z3Rzam5uZnBsaHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgyMDE5OCwiZXhwIjoyMDc4Mzk2MTk4fQ.AhDWtyiclwZQkUqRLx3CxeGjJ8ubsKz9whpXDyrkKao'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function updateHrPassword() {
  try {
    console.log('hr 계정 비밀번호 업데이트 중...')

    const hashedPassword = await bcrypt.hash('admin123', 10)

    const { data: updatedHr, error: updateError } = await supabase
      .from('admins')
      .update({ password_hash: hashedPassword })
      .eq('username', 'hr')
      .select()

    if (updateError) {
      console.error('hr 비밀번호 업데이트 실패:', updateError)
      return
    }

    console.log('hr 비밀번호 업데이트됨:', updatedHr)

    // 테스트 로그인
    console.log('\nhr 로그인 테스트 중...')
    const { data: testHr } = await supabase
      .from('admins')
      .select('*')
      .eq('username', 'hr')
      .single()

    if (testHr) {
      const isValid = await bcrypt.compare('admin123', testHr.password_hash)
      console.log('hr 비밀번호 검증 결과:', isValid)
      console.log('hr 계정:', {
        id: testHr.id,
        username: testHr.username,
        email: testHr.email,
        role: testHr.role,
        active: testHr.active
      })
    }

  } catch (error) {
    console.error('오류 발생:', error)
  }
}

updateHrPassword()