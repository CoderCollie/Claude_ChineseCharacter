# 세션 004 — isDue 버그 수정 (복습/신규 중복 집계)

**날짜**: 2026-04-18  
**작업자**: CoderCollie + Claude Sonnet 4.6  
**버전**: v1.2 → v1.3  
**커밋**: `fix: isDue 버그 수정 — 신규 카드가 복습으로 잘못 집계되던 문제`

---

## 1. 문제 현상

홈 화면의 통계 숫자가 이상하게 표시됨:
- 복습: 23, 신규: 20, 전체학습: 27

전체학습이 27인데 복습이 23이라는 게 논리적으로 이상함.  
27장을 학습했으면 복습 대상도 최대 27장이어야 하는데, 23장은 아직 학습 안 한 신규 카드였음.

---

## 2. 원인 분석

`js/sm2.js`의 `isDue()` 함수 버그:

```js
// 버그 있는 코드
function isDue(id) {
  const card = getCard(state, id);  // 없으면 기본값 반환
  if (!card.dueDate) return true;   // ← 신규 카드(dueDate 없음)도 true!
  return card.dueDate <= today();
}
```

`getCard()`는 카드가 없을 때 `{ interval:0, repetition:0, efactor:2.5, dueDate:null }` 기본값을 반환함.  
그래서 한 번도 학습 안 한 신규 카드도 `dueDate === null → isDue = true`가 되어버림.

**결과적으로**:
- `getDueCards()` = 신규 카드 전부 + 실제 복습 대상 카드 → **복습** 수치에 반영
- `getNewCards()` = 신규 카드 전부 → **신규** 수치에 반영
- 신규 카드가 복습과 신규에 **이중으로 집계**

8급(50장) 기준 예시:
```
전체학습: 27장 (state에 저장됨)
신규:     23장 (50 - 27)

getDueCards → 23장(신규) + 실제복습 = 23 (복습으로 표시)
getNewCards → 23장, cap 20 → 20 (신규로 표시)
```

---

## 3. 수정 내용

### `js/sm2.js` — isDue 수정

```js
// 수정 후
function isDue(id) {
  const state = loadState();
  const card = state[id];       // state에 직접 접근 (없으면 undefined)
  if (!card) return false;      // 신규 카드는 복습 대상 아님
  return card.dueDate <= today();
}
```

`getCard()` 대신 `state[id]`로 직접 접근해서,  
state에 없는 카드(신규)는 명확히 `false`를 반환하도록 수정.

---

## 4. 수정 후 통계 의미

| 항목 | 의미 | 예시 |
|------|------|------|
| **복습** | 이전에 학습했고 오늘 복습일이 된 카드 수 | 0 |
| **신규** | 한 번도 학습 안 한 카드 (최대 20 표시) | 20 |
| **전체학습** | 지금까지 한 번이라도 학습한 카드 누적 수 | 27 |

복습 0 + 신규 20 = 오늘 세션 20장.

---

## 5. 핵심 교훈

**방어적 기본값이 버그를 만들 수 있음**  
`getCard()`가 없는 카드에 기본값(`dueDate: null`)을 반환하도록 설계한 게 의도치 않게 `isDue`의 동작을 바꿔버림.  
→ 존재 여부와 값 여부를 명확히 구분하는 것이 중요.

```js
// 위험: 없는 카드에 기본값 반환 후 판단
const card = getCard(state, id);  // 없어도 {dueDate: null} 반환
if (!card.dueDate) return true;   // null이면 true → 신규도 due 처리됨

// 안전: 존재 여부 먼저 확인
const card = state[id];
if (!card) return false;          // 없으면 명확히 false
```
