'use strict';
const fs = require('fs'), path = require('path');
const S = {
  "h2178": "꼬챙이에 꿴 모양이에요. 차례로 꿴 곶처럼 뻗어나온 땅이에요.",
  "h2323": "물(氵)이 필(必)처럼 스미는 것이에요. 체내에서 분비되어 나오는 것이에요."
};
const fp = path.join(__dirname, '../js/data/level2.js');
let c = fs.readFileSync(fp, 'utf8');
let n = 0;
for (const [id, st] of Object.entries(S)) {
  const e = st.replace(/"/g, '\\"');
  c = c.replace(new RegExp(`(id:"${id}",[^}]+similar:\\[[^\\]]*\\])(})`, 'g'),
    (m,p1,p2) => m.includes('story:') ? m : (n++, `${p1},story:"${e}"${p2}`));
}
fs.writeFileSync(fp, c);
const ids=[...c.matchAll(/id:"(h\d+)"/g)].map(m=>m[1]);
const sids=[...c.matchAll(/id:"(h\d+)"[^}]+story:/g)].map(m=>m[1]);
console.log('Added:', n, '/ 2급 최종:', sids.length,'/',ids.length);
