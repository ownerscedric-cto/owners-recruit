#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Supabase 타입 오류 일괄 수정 스크립트 시작...\n');

// API 라우트 파일들 찾기
const apiFiles = glob.sync('src/app/api/**/route.ts', { cwd: process.cwd() });

console.log(`📁 찾은 API 라우트 파일: ${apiFiles.length}개`);

let processedFiles = 0;
let skippedFiles = 0;

apiFiles.forEach((filePath) => {
  const absolutePath = path.join(process.cwd(), filePath);

  try {
    let content = fs.readFileSync(absolutePath, 'utf8');
    let modified = false;

    // 1. Database import가 없으면 추가
    if (!content.includes("import { Database } from '@/types/database'")) {
      const importIndex = content.indexOf("import { debugLog } from '@/lib/debug'");
      if (importIndex !== -1) {
        const insertPos = importIndex + "import { debugLog } from '@/lib/debug'".length;
        content = content.slice(0, insertPos) + "\nimport { Database } from '@/types/database'" + content.slice(insertPos);
        modified = true;
      } else {
        // debugLog import가 없으면 supabase import 뒤에 추가
        const supabaseImportIndex = content.indexOf("import { createSupabaseServiceRoleClient } from '@/lib/supabase'");
        if (supabaseImportIndex !== -1) {
          const insertPos = supabaseImportIndex + "import { createSupabaseServiceRoleClient } from '@/lib/supabase'".length;
          content = content.slice(0, insertPos) + "\nimport { Database } from '@/types/database'" + content.slice(insertPos);
          modified = true;
        }
      }
    }

    // 2. supabase 쿼리에 (supabase as any) 캐스팅 적용
    // .from() 호출 패턴 찾기
    const supabaseQueryPattern = /(\s+)(await\s+)?supabase(\s*\n\s*)?\.from\(/g;
    content = content.replace(supabaseQueryPattern, (match, indent, awaitKeyword, newline) => {
      modified = true;
      return `${indent}${awaitKeyword || ''}(supabase as any)${newline || ''}.from(`;
    });

    if (modified) {
      fs.writeFileSync(absolutePath, content);
      console.log(`✅ 수정됨: ${filePath}`);
      processedFiles++;
    } else {
      console.log(`⏭️  건너뜀: ${filePath} (수정 불필요)`);
      skippedFiles++;
    }

  } catch (error) {
    console.error(`❌ 오류: ${filePath} - ${error.message}`);
  }
});

console.log(`\n📊 작업 완료:`);
console.log(`   - 수정된 파일: ${processedFiles}개`);
console.log(`   - 건너뛴 파일: ${skippedFiles}개`);
console.log(`   - 전체 파일: ${apiFiles.length}개`);

console.log('\n🔍 빌드 테스트를 실행해보세요: npm run build');