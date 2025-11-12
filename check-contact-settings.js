const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkContactSettings() {
  console.log('Checking current system_settings...')

  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('key')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Current settings:')
  data.forEach(setting => {
    console.log(`- ${setting.key}: ${setting.value}`)
  })

  // 연락처 관련 설정이 있는지 확인
  const contactSettings = data.filter(s => s.key.includes('contact') || s.key.includes('email') || s.key.includes('phone'))

  if (contactSettings.length === 0) {
    console.log('\nNo contact settings found. Adding default contact settings...')

    // 기본 연락처 설정 추가
    const defaultSettings = [
      { key: 'contact_email', value: 'contact@owners.co.kr', description: '대표 문의 이메일' },
      { key: 'contact_phone', value: '02-1234-5678', description: '대표 문의 전화번호' },
      { key: 'contact_description', value: '궁금한 사항이 있으시면 언제든지 연락해 주세요.', description: '문의 안내 메시지' }
    ]

    for (const setting of defaultSettings) {
      const { error: insertError } = await supabase
        .from('system_settings')
        .insert([setting])

      if (insertError) {
        console.error(`Error inserting ${setting.key}:`, insertError)
      } else {
        console.log(`✅ Added ${setting.key}: ${setting.value}`)
      }
    }
  } else {
    console.log('\nFound existing contact settings:')
    contactSettings.forEach(setting => {
      console.log(`- ${setting.key}: ${setting.value}`)
    })
  }
}

checkContactSettings().catch(console.error)