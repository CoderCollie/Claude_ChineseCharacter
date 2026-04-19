'use strict';
const HANJA_DATA = [
  ...HANJA_L8,
  ...HANJA_L7,
  ...HANJA_L6,
  ...HANJA_L5,
  ...HANJA_L4,
  ...HANJA_L3,
  ...HANJA_L2,
  ...HANJA_L1,
];

const LEVEL_LABELS = {8:"8급",7:"7급",6:"6급",5:"5급",4:"4급",3:"3급",2:"2급",1:"1급"};

function getByLevels(levels) {
  return HANJA_DATA.filter(h => levels.includes(h.level));
}
