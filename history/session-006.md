# 세션 006 — 기능 4종 추가 (진행률·스와이프·스트릭·오답재복습)

**날짜**: 2026-04-19  
**작업자**: CoderCollie + Claude Sonnet 4.6  
**버전**: v1.4 → v1.5  
**커밋**: `feat: 급수별 진행률·스와이프·스트릭·오답재복습 추가 (v1.5)`

---

## 1. 추가된 기능 요약

| 기능 | 위치 | 효과 |
|------|------|------|
| 급수별 진행률 바 | 홈 화면, 급수 버튼 아래 | 시험 대비 진도 파악 |
| 스와이프 제스처 | 학습 화면, 카드 뒤집힌 후 | 모바일 자연스러운 UX |
| 연속 학습 스트릭 | 홈 화면 타이틀 옆 | 매일 학습 습관 동기부여 |
| 오답 재복습 | 완료 화면 | 단기 기억 강화 |

---

## 2. 기능별 구현 상세

### 2-1. 급수별 진행률 바

**표시**: 선택된 급수마다 한 줄씩, 8급→1급 순으로
```
8급  ████████░░  27/50
7급  ░░░░░░░░░░   0/100
```

**계산 로직**:
```js
const total   = HANJA_DATA.filter(h => h.level === lv).length;
const learned = HANJA_DATA.filter(h => h.level === lv && smState[h.id]).length;
const pct     = Math.round(learned / total * 100);
```
`smState[h.id]`가 존재하면 한 번이라도 학습한 카드로 간주.

**신규 CSS 클래스**:
```
.progress-list   — 진행률 바 컨테이너
.lv-prog-row     — 한 급수 한 줄 (label + track + num)
.lv-prog-track   — 회색 배경 트랙
.lv-prog-fill    — 파란색 채워진 바 (width를 인라인 스타일로)
```

### 2-2. 스와이프 제스처

카드가 **뒤집힌 상태에서만** 작동 (`state.flipped` 체크).

```js
let touchStartX = 0;
card.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });  // 스크롤 성능 저하 방지

card.addEventListener('touchend', e => {
  if (!state.flipped) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 60) answer(dx > 0);  // 60px 임계값
  // dx > 0 = 오른쪽 스와이프 = 알았다
  // dx < 0 = 왼쪽 스와이프 = 몰랐다
});
```

**`{ passive: true }` 를 쓰는 이유**  
`touchstart`에 `passive: true`를 주면 브라우저가 "이 핸들러가 `preventDefault()`를 부르지 않는다"는 걸 미리 알아 스크롤을 더 부드럽게 처리함. 여기서는 스크롤을 막을 필요가 없으므로 passive 사용.

**임계값 60px**: 너무 작으면 의도치 않은 스와이프 발생, 너무 크면 불편. 60px는 엄지손가락 스와이프 기준 자연스러운 값.

### 2-3. 연속 학습 스트릭

**localStorage 키**: `hanja_streak`
```json
{ "lastDate": "2026-04-19", "count": 3 }
```

**`sm2.js`에 두 함수 추가**:

```js
// 세션 완료 시 호출
function recordStreak() {
  const t = today();
  // 오늘 이미 기록됐으면 무시 (하루에 여러 세션 해도 1번만 카운트)
  if (s.lastDate === t) return;
  // 어제 기록이 있으면 +1, 아니면 리셋
  s.count = s.lastDate === yStr ? s.count + 1 : 1;
  s.lastDate = t;
}

// 홈 화면 렌더링 시 호출
function getStreak() {
  // 오늘 또는 어제 기록이 있어야 유효 (오늘 학습 안 했으면 어제까지 유지)
  return (s.lastDate === today() || s.lastDate === yStr) ? s.count : 0;
}
```

**`answer()` 함수에서 호출 위치**:
```js
if (state.queueIndex >= state.queue.length) {
  state.screen = 'done';
  SM2.recordStreak();  // 세션 완료 시점에 스트릭 기록
}
```

### 2-4. 오답 재복습

**state에 `sessionWrong: []` 추가**. `answer(false)` 시 카드 push:
```js
} else {
  state.sessionWrong.push(card);
}
```

**완료 화면**:
```js
${wrongCount > 0
  ? `<button class="btn-retry" id="btn-retry">틀린 카드만 다시 (${wrongCount}장)</button>`
  : ''}
```

**`retryWrong()` 함수**:
```js
function retryWrong() {
  state.queue = shuffle([...state.sessionWrong]);
  state.queueIndex = 0;
  state.sessionWrong = [];  // 재복습 세션에서 또 틀리면 다시 쌓임
  // SM-2 재계산 없음 — 이미 answer(false) 때 처리됨
  // 순수하게 한 번 더 눈에 익히는 용도
}
```

---

## 3. 현재 버전 히스토리

| 버전 | 내용 |
|------|------|
| v1.0 | 최초 배포 |
| v1.1 | manifest/sw.js 경로 버그 수정 |
| v1.2 | 버전 표시 + 가이드 모달 추가 |
| v1.3 | isDue 버그 수정 |
| v1.4 | 학습 기록 화면 + 통계 설명 텍스트 |
| v1.5 | 급수별 진행률·스와이프·스트릭·오답재복습 |
