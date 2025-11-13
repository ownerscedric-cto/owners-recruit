// 관리자 계정 생성 스크립트
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  try {
    // 기존 관리자 계정 확인
    console.log('기존 관리자 계정 확인 중...');
    const { data: existingAdmins, error: fetchError } = await supabase
      .from('admins')
      .select('id, username, email, role, active');

    if (fetchError) {
      console.error('관리자 계정 조회 오류:', fetchError);
      return;
    }

    console.log('기존 관리자 계정들:', existingAdmins);

    // system_admin 계정이 없다면 생성
    const systemAdmin = existingAdmins?.find(admin => admin.role === 'system_admin' && admin.active);

    if (!systemAdmin) {
      console.log('system_admin 계정이 없습니다. 새로 생성합니다...');

      const username = 'admin';
      const email = 'admin@owners.co.kr';
      const password = 'admin123!'; // 임시 비밀번호
      const hashedPassword = await bcrypt.hash(password, 10);

      const { data: newAdmin, error: createError } = await supabase
        .from('admins')
        .insert({
          username,
          email,
          password_hash: hashedPassword,
          role: 'system_admin',
          active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('관리자 계정 생성 오류:', createError);
        return;
      }

      console.log('✅ system_admin 계정이 생성되었습니다:');
      console.log('사용자명:', username);
      console.log('이메일:', email);
      console.log('비밀번호:', password);
      console.log('⚠️  로그인 후 비밀번호를 반드시 변경하세요!');
    } else {
      console.log('✅ system_admin 계정이 이미 존재합니다:', systemAdmin);
    }

    // hr_manager 계정 확인
    const hrManager = existingAdmins?.find(admin => admin.role === 'hr_manager' && admin.active);

    if (!hrManager) {
      console.log('hr_manager 계정이 없습니다. 새로 생성합니다...');

      const username = 'hr_manager';
      const email = 'hr@owners.co.kr';
      const password = 'hr123!'; // 임시 비밀번호
      const hashedPassword = await bcrypt.hash(password, 10);

      const { data: newHR, error: createError } = await supabase
        .from('admins')
        .insert({
          username,
          email,
          password_hash: hashedPassword,
          role: 'hr_manager',
          active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('HR 관리자 계정 생성 오류:', createError);
        return;
      }

      console.log('✅ hr_manager 계정이 생성되었습니다:');
      console.log('사용자명:', username);
      console.log('이메일:', email);
      console.log('비밀번호:', password);
      console.log('⚠️  로그인 후 비밀번호를 반드시 변경하세요!');
    } else {
      console.log('✅ hr_manager 계정이 이미 존재합니다:', hrManager);
    }

  } catch (error) {
    console.error('스크립트 실행 오류:', error);
  }
}

createAdmin();