# 세션 009 — 신규 카드 인트로 후 다음 세션에서 즉시 퀴즈 출제 (v5.1)

**날짜**: 2026-04-24  
**작업자**: CoderCollie + Claude Sonnet 4.6  
**버전**: v5.0 → v5.1 / hanja-v23 → hanja-v24

---

## 문제 현상

신규 카드 인트로를 본 뒤 같은 날 새 세션을 시작해도 해당 카드가 나오지 않았다.

## 원인

`SM2.introduce(id)` 함수가 `dueDate = 오늘 + 1일`로 등록했기 때문.

- `smState[id]`가 존재 → 신규 카드 풀에서 제외
- `dueDate > today` → 복습 대상에도 포함 안 됨
- 결과: 카드가 내일까지 사라짐

## 수정

**`js/sm2.js`** — `introduce()` 함수에서 `+1일` 제거

```js
// 변경 전
const due = new Date();
due.setDate(due.getDate() + 1);
state[id] = { ..., dueDate: due.toISOString().split('T')[0] };

// 변경 후
state[id] = { ..., dueDate: today() };
```

이제 인트로 직후 `dueDate = 오늘`이므로, 같은 날 다음 세션에서 복습 카드로 등장해 퀴즈가 출제된다.

## 핵심 개념

SM-2에서 `introduce()`는 "카드를 처음 등록"하는 단계. `repetition=0`이므로 다음 `review()`에서 정답이면 `interval=1`로 내일 복습이 잡힌다. 즉 카드 생애주기는:

1. **인트로** (`introduce`): dueDate = 오늘, repetition=0
2. **첫 퀴즈** (`review, 정답`): repetition=1, interval=1 → dueDate = 내일
3. **두 번째 퀴즈** (`review, 정답`): repetition=2, interval=6 → 6일 후
4. 이후 SM-2 알고리즘대로 간격 증가
