const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nepqaowvgtsjnnfplhyb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcHFhb3d2Z3Rzam5uZnBsaHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgyMDE5OCwiZXhwIjoyMDc4Mzk2MTk4fQ.AhDWtyiclwZQkUqRLx3CxeGjJ8ubsKz9whpXDyrkKao'
);

async function checkTable() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Table columns:', Object.keys(data[0]));
    console.log('Sample data:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('No data in table');
  }
}

checkTable();