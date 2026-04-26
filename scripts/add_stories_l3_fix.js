'use strict';
const fs = require('fs'), path = require('path');
const S = {
  "率":"새끼와 어미가 함께 가는 모양이에요. 이끌고 거느리는 비율이에요.",
  "塞":"흙(土)으로 막아 채우는 것이에요. 구멍을 막아 통하지 못하게 하는 것이에요."
};
const fp = path.join(__dirname, '../js/data/level3.js');
let c = fs.readFileSync(fp, 'utf8');
let n = 0;
for (const [ch, st] of Object.entries(S)) {
  const e = st.replace(/"/g, '\\"');
  c = c.replace(new RegExp(`(char:"${ch}",eumhun:"[^"]+",words:\\[[^\\]]+\\],busu:"[^"]+",similar:\\[[^\\]]*\\])(})`, 'g'),
    (m,p1,p2) => m.includes('story:') ? m : (n++, `${p1},story:"${e}"${p2}`));
}
fs.writeFileSync(fp, c);
console.log('Added:', n);
