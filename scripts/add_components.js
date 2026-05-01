'use strict';
const fs = require('fs'), path = require('path');

// IDS 파일 로드
const idsMap = {};
fs.readFileSync('/tmp/ids.txt', 'utf8').split('\n').forEach(line => {
  const parts = line.split('\t');
  if (parts.length >= 3) {
    idsMap[parts[1]] = parts[2].replace(/\[[^\]]+\]/g, '').trim();
  }
});

// IDS 문자열에서 구성 한자 추출 (IDS 연산자 제외)
function extractComponents(idsStr) {
  if (!idsStr) return [];
  const result = [];
  for (const ch of [...idsStr]) {
    const cp = ch.codePointAt(0);
    // IDS 연산자 (U+2FF0-U+2FFB) 제외
    if (cp >= 0x2FF0 && cp <= 0x2FFB) continue;
    // ASCII 제외
    if (cp < 0x0100) continue;
    // CJK 통합 한자, 확장 영역, 호환 한자 포함
    if ((cp >= 0x2E80 && cp <= 0x2FFF) ||  // 부수
        (cp >= 0x3000 && cp <= 0x303F) ||  // CJK 기호
        (cp >= 0x3400 && cp <= 0x4DBF) ||  // 확장 A
        (cp >= 0x4E00 && cp <= 0x9FFF) ||  // CJK 기본
        (cp >= 0xF900 && cp <= 0xFAFF) ||  // 호환
        (cp >= 0x20000 && cp <= 0x2A6DF) || // 확장 B
        (cp >= 0x2A700 && cp <= 0x2CEAF) || // 확장 C/D/E
        (cp >= 0x2CEB0 && cp <= 0x2EBEF))  { // 확장 F
      result.push(ch);
    }
  }
  return result;
}

let totalUpdated = 0;

for (let lv = 1; lv <= 8; lv++) {
  const fp = path.join(__dirname, '../js/data/level' + lv + '.js');
  const raw = fs.readFileSync(fp, 'utf8');
  const data = JSON.parse(raw.match(/const HANJA_L\d+ = (\[[\s\S]+\]);/)[1]);
  const varName = raw.match(/const (HANJA_L\d+)/)[1];

  let updated = 0;
  data.forEach(card => {
    const idsStr = idsMap[card.char];
    const components = idsStr ? extractComponents(idsStr) : [];
    // 자기 자신만 있는 경우(단순 상형자) 또는 빈 배열 처리
    const filtered = components.filter(c => c !== card.char);
    card.components = filtered.length > 0 ? filtered : [];
    // IDS 원문도 참고용으로 저장
    card.idsRaw = idsStr || '';
    updated++;
  });

  const out = `'use strict';\nconst ${varName} = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(fp, out);
  totalUpdated += updated;
  console.log(`level${lv}: ${updated}자 처리 완료`);
}

console.log('\n총', totalUpdated, '자 components 필드 추가 완료');
console.log('\n샘플 확인:');
const sample = JSON.parse(fs.readFileSync(path.join(__dirname,'../js/data/level8.js'),'utf8').match(/const HANJA_L8 = (\[[\s\S]+\]);/)[1]);
['地','明','木','靑','韓','林','休'].forEach(ch=>{
  const e=sample.find(d=>d.char===ch);
  if(e) console.log(ch+'('+e.eumhun+'): IDS='+e.idsRaw+' → '+JSON.stringify(e.components));
});
