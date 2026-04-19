# 세션 005 — 학습 기록 화면 추가 + 통계 설명 텍스트

**날짜**: 2026-04-18  
**작업자**: CoderCollie + Claude Sonnet 4.6  
**버전**: v1.3 → v1.4  
**커밋**: `feat: 학습 기록 화면 추가 + 통계 설명 텍스트 (v1.4)`

---

## 1. 추가된 기능

### 1-1. 통계 항목 설명 텍스트
홈 화면의 복습/신규/전체학습 숫자 아래에 설명 추가:

| 항목 | 설명 |
|------|------|
| 복습 | 오늘 다시 볼 카드 |
| 신규 | 오늘 새로 배울 카드 |
| 전체학습 | 누적 학습 카드 → (탭 가능) |

전체학습 박스를 탭하면 학습 기록 화면으로 이동.

### 1-2. 학습 기록 화면 (`history` 스크린)
지금까지 학습한 카드를 세 그룹으로 분류해서 표시:

| 그룹 | 기준 | 색상 |
|------|------|------|
| 💪 잘 아는 한자 | `repetition >= 2` (알았다 2회 이상 연속) | 초록 |
| 📖 학습 중 | `repetition === 1`, `efactor >= 2.0` | 흰색 |
| 🔄 헷갈리는 한자 | `repetition === 0` 또는 `efactor < 2.0` | 빨간 |

---

## 2. 코드 변경 상세

### `js/app.js`

**버전**: `v1.3` → `v1.4`

**render() 분기 추가**
```js
else if (state.screen === 'history') app.innerHTML = renderHistory();
```

**renderHistory() 함수 신규 작성**

SM2 localStorage 상태를 읽어서 카드를 세 그룹으로 분류:
```js
const smState = SM2.loadState();
const studied = HANJA_DATA.filter(h => smState[h.id]);  // 학습한 카드만

const strong   = studied.filter(h => smState[h.id].repetition >= 2);
const weak     = studied.filter(h => smState[h.id].repetition === 0 || smState[h.id].efactor < 2.0);
const learning = studied.filter(h => {
  const s = smState[h.id];
  return s.repetition === 1 && s.efactor >= 2.0;
});
```

각 카드는 `.hist-chip`으로 표시:
- 한자 글자 (1.6rem)
- 음훈 (작게)
- `title` 속성에 다음 복습일 포함 (PC에서 hover 시 확인 가능)

**bindEvents() 추가**
```js
// 전체학습 박스 → 기록 화면
el('btn-history').addEventListener('click', () => {
  state.screen = 'history'; render();
});

// 기록 화면 ← 버튼 → 홈
if (state.screen === 'history') {
  el('btn-back').addEventListener('click', () => {
    state.screen = 'home'; render();
  });
}
```

### `css/style.css`

**`.stat-box` 수정**: `clickable` 클래스 추가 시 커서/탭 피드백

**`.stat-desc`**: 통계 설명 텍스트 (0.6rem, 연한색)

**History 화면 스타일 신규 추가**:
```
.history-screen     — 전체 화면 래퍼
.hist-body          — 스크롤 가능한 콘텐츠 영역
.hist-section       — 그룹별 섹션
.hist-title         — 섹션 제목 (이모지 + 이름 + 카운트 뱃지)
.hist-grid          — auto-fill 그리드 (최소 80px)
.hist-chip          — 카드 칩 (한자 + 음훈)
.hist-chip.hist-strong   — 초록 배경
.hist-chip.hist-learning — 테두리만
.hist-chip.hist-weak     — 빨간 배경
```

다크모드도 각각 대응:
```css
@media (prefers-color-scheme: dark) {
  .hist-chip.hist-strong { background: #052e16; }
  .hist-chip.hist-weak   { background: #450a0a; }
}
```

---

## 3. SM-2 상태값으로 카드 분류하는 방법

```
repetition: 연속으로 알았다를 누른 횟수
  0 = 마지막 답이 몰랐다 (또는 방금 초기화됨)
  1 = 알았다 1번
  2+ = 알았다 2번 이상 연속

efactor: 난이도 가중치 (기본 2.5, 몰랐다 누를수록 감소, 최소 1.3)
  2.5 = 쉬움
  2.0 미만 = 여러 번 틀린 카드
  1.3 = 매우 어려운 카드 (최소값)

interval: 다음 복습까지 남은 일수
  1 = 내일
  6 = 6일 후
  15+ = 장기 기억으로 전환 중
```

---

## 4. 현재 버전 히스토리

| 버전 | 내용 |
|------|------|
| v1.0 | 최초 배포 |
| v1.1 | manifest/sw.js 경로 버그 수정 |
| v1.2 | 버전 표시 + 가이드 모달 추가 |
| v1.3 | isDue 버그 수정 (신규 카드 복습 중복 집계) |
| v1.4 | 학습 기록 화면 + 통계 설명 텍스트 추가 |
