# 세션 011 — 일별/누적 퀴즈 풀이 수 기록 (v5.3)

**날짜**: 2026-04-25  
**작업자**: CoderCollie + Claude Sonnet 4.6  
**버전**: v5.2 → v5.3 / hanja-v25 → hanja-v26

---

## 무엇을 했는가

홈 화면에 "오늘 N문제 풀었어요 · 누적 N문제"를 표시해 동기부여 요소 추가.
한자 퀴즈와 단어 퀴즈 모두 합산하여 기록.

---

## 변경 내용

### 새 localStorage 키: `hanja_daily_stats`

```javascript
{ date: "2026-04-25", count: 15, total: 342 }
```
- `date`: 오늘 날짜. 날짜가 바뀌면 `count`를 0으로 리셋.
- `count`: 오늘 푼 문제 수.
- `total`: 앱 사용 이래 누적 전체 문제 수 (리셋 안 됨).
- `SM2.resetAll()` 호출 시 함께 삭제됨.

### js/sm2.js

- `recordDailyQuiz()`: 오늘 카운트 +1, 누적 카운트 +1
- `getDailyStats()`: `{ today, total }` 반환
- `resetAll()`: `hanja_daily_stats`도 삭제

### js/app.js

- `answer()`: `SM2.recordAccuracy()` 직후 `SM2.recordDailyQuiz()` 호출
- `answerWordQuiz()`: 동일하게 `SM2.recordDailyQuiz()` 호출
- `renderHome()`: `dailyStats.today > 0`일 때만 카운트 표시 (0이면 숨김)

### css/style.css

- `.quiz-today-count`: 서브 그리팅 아래 작은 텍스트, 숫자는 `var(--primary)` 색상 강조
