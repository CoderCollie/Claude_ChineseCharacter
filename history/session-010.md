# 세션 010 — 약한 카드 우선 출제 + 같은 날 SM-2 중복 진행 방지 (v5.2)

**날짜**: 2026-04-25  
**작업자**: CoderCollie + Claude Sonnet 4.6  
**버전**: v5.1 → v5.2 / hanja-v24 → hanja-v25

---

## 무엇을 왜 했는가

### 문제 1: 신규 카드가 계속 쌓이는 눈덩이 현상

세션이 항상 10장을 채우려고 복습 카드가 부족하면 무조건 신규 카드를 투입했다.
모르는 카드가 많아질수록 복습이 늘어나야 하는데 동시에 신규도 계속 들어와서 미학습 카드가 계속 쌓였다.

### 문제 2: 같은 날 두 번 맞히면 interval=6 점프

`review()`를 하루에 두 번 호출하면 `repetition 0→1→2`, `interval 1→6`으로 진행됐다.
SM-2의 간격 반복은 **다른 날** 연속 정답일 때만 의미가 있다.

---

## 수정 내용

### js/sm2.js

**1. `lastReviewed` 필드 추가**

```javascript
// getCard() 기본값
{ interval: 0, repetition: 0, efactor: 2.5, dueDate: null, lastReviewed: null }

// introduce() 초기값
{ interval: 1, repetition: 0, efactor: 2.5, dueDate: today(), lastReviewed: null }
```

**2. `review()` — 같은 날 중복 진행 방지**

```javascript
const alreadyToday = card.lastReviewed === today();

if (quality >= 3) {
  if (!alreadyToday) {
    // 다른 날 정답: 정상 SM-2 진행 (interval/repetition 전진)
  }
  // 같은 날 재등장 + 정답: interval/repetition/dueDate 그대로 유지
} else {
  // 오답: 날짜 무관하게 항상 리셋
}
state[id] = { ..., lastReviewed: today() };
```

기존 데이터(`lastReviewed` 없는 카드)는 `null !== today()` → 정상 진행. 마이그레이션 불필요.

### js/app.js — `startSession()` 세션 구성 우선순위 변경

```
① 복습 대상(dueDate ≤ 오늘) 중 정답률 < 50%
② 미복습(dueDate > 오늘)이지만 정답률 < 50% → 앞당겨 출제
③ 복습 대상 중 정답률 ≥ 50%
④ 신규 카드 → ①+②가 0장일 때만 투입
```

약한 카드가 단 한 장이라도 있으면 신규 카드는 들어오지 않는다.

---

## 핵심 개념

**lastReviewed guard**: SM-2는 에빙하우스 망각 곡선을 기반으로 "일정 시간이 지난 후 복습"을 전제한다. 같은 날 여러 번 맞혀도 간격이 늘어나면 안 된다. `lastReviewed` 필드로 오늘 이미 review된 카드는 정답이어도 interval을 고정한다.

**약한 카드 우선**: 정답률 50% 미만 카드는 아직 복습일이 안 됐어도 앞당겨서 꺼낸다. 모르는 카드를 먼저 잡고 난 뒤 신규 카드를 받는 구조라 학습 부담이 자기 조절된다.
