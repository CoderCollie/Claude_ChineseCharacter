# 漢字 카드 프로젝트 명세 (PROJECT.md)

> **이 파일은 Claude와 Gemini가 공동으로 유지하는 단일 진실 공급원(Single Source of Truth)입니다.**  
> 기능 추가·변경·삭제 시 반드시 이 파일의 해당 섹션을 업데이트하세요.

---

## 1. 현재 버전

| 항목 | 값 |
|------|-----|
| `APP_VERSION` (js/app.js) | `v5.26` |
| SW 캐시 버전 (sw.js) | `hanja-v49` |
| 최종 업데이트 | 2026-04-26 |

---

## 2. 프로젝트 개요

한국어문회 한자능력검정시험(8급~1급) 대비 PWA 플래시카드 앱.

- **배포 URL**: `https://codercollie.github.io/Claude_ChineseCharacter/`
- **레포**: `https://github.com/CoderCollie/Claude_ChineseCharacter`
- **기술 스택**: Vanilla JavaScript (ES6+), Pure CSS3, PWA (Service Worker)
- **프레임워크 없음** — 빌드 도구, 번들러, 외부 라이브러리 없음

---

## 3. 배포 환경 주의사항

GitHub Pages 서브디렉토리 배포이므로 **절대경로는 항상 `/Claude_ChineseCharacter/` 포함**.  
`manifest.json`의 `start_url`, `scope` 및 `sw.js`의 캐시 경로 모두 해당.

---

## 4. 디렉토리 구조

```
index.html
manifest.json
sw.js                        ← Service Worker (캐시 버전 관리)
.gitignore                   ← logs/ 제외
css/
  style.css                  ← 전체 스타일 (다크 테마 포함)
js/
  app.js                     ← 메인 앱 로직 (렌더링, 이벤트, 상태)
  sm2.js                     ← SM-2 알고리즘 및 localStorage 헬퍼
  data.js                    ← ⚠️ 레거시 파일 (index.html이 로드하지 않음, 삭제 가능)
  data/
    index.js                 ← HANJA_DATA = [...HANJA_L8, ..., ...HANJA_L1], LEVEL_LABELS
    level1.js ~ level8.js    ← 급수별 한자 데이터 배열
icons/
  icon-192.png
  icon-512.png
history/
  session-NNN.md             ← 세션별 작업 로그
logs/                        ← gitignore 대상 (Claude Code 대화 로그 자동 저장)
scripts/
  fill_busu_unihan.js        ← Unicode Unihan으로 부수 자동 보완
  add_stories_l2_*.js        ← 2급 연상 스토리 생성 스크립트
  add_stories_l3_*.js        ← 3급 연상 스토리 생성 스크립트
  add_stories_l4_*.js        ← 4급 연상 스토리 생성 스크립트
  (기타 데이터 정제 스크립트들)
CLAUDE.md                    ← Claude 작업 규칙
GEMINI.md                    ← Gemini 작업 규칙
PROJECT.md                   ← 이 파일
```

---

## 5. 한자 카드 데이터

### 스키마

```javascript
// js/data/levelN.js
{
  id: "h1234",          // 고유 ID (문자열)
  level: 3,             // 급수 (1~8, 숫자. 1=1급, 8=8급)
  char: "漢",           // 한자 (반드시 CJK 한자)
  eumhun: "한수 한",   // 훈음 (한국어, "뜻 음" 형식)
  words: ["한자(漢字)", "한문(漢文)"],  // 예시 단어
  busu: "水(물수)",     // 부수 (Unicode Unihan 기반 100% 완료)
  similar: [],          // 유의자 배열
  story: "물(氵)이 흐르는..."  // 연상 스토리 (8~2급 완료, 1급 미완)
}
```

### 급수별 카드 수 및 스토리 완료 현황

| 급수 | 카드 수 | 스토리 |
|------|--------|--------|
| 8급  | 52장   | ✅ 완료 |
| 7급  | 107장  | ✅ 완료 |
| 6급  | 169장  | ✅ 완료 |
| 5급  | 252장  | ✅ 완료 |
| 4급  | 546장  | ✅ 완료 |
| 3급  | 776장  | ✅ 완료 |
| 2급  | 587장  | ✅ 완료 |
| 1급  | 503장  | ⬜ 미완 |
| **합계** | **2,992장** | **2,489장 (83%)** |

---

## 6. localStorage 키 목록

| 키 | 타입 | 내용 |
|----|------|------|
| `hanja_sm2_state` | JSON object | SM-2 카드별 상태 `{ [id]: { interval, repetition, efactor, dueDate, lastReviewed } }` |
| `hanja_streak` | JSON object | 연속 학습 스트릭 `{ lastDate, count, best }` |
| `hanja_accuracy` | JSON object | 카드별 정답률 `{ [id]: { c: 정답수, t: 총시도수 } }` |
| `hanja_dark_mode` | string | `"true"` / `"false"` |
| `hanja_daily_stats` | JSON object | 퀴즈 풀이 수 `{ total, history: { "YYYY-MM-DD": N } }` |
| `hanja_wq_state` | JSON object | 단어 퀴즈 SM-2 `{ "漢字": { interval, repetition, efactor, dueDate, lastReviewed } }` |

**퀴즈 모드별 데이터 관계**:
- 한자 퀴즈 + 스토리 퀴즈: `hanja_sm2_state` 공유 (같은 학습 주기)
- 단어 퀴즈: `hanja_wq_state` 독립 (별도 학습 주기)

---

## 7. SM-2 상태 스키마 및 동작

```javascript
// hanja_sm2_state[id]
{
  interval: 6,
  repetition: 1,            // 연속 정답 횟수
  efactor: 2.5,
  dueDate: "2026-04-30",
  lastReviewed: "2026-04-26"  // 같은 날 중복 진행 방지
}
```

**`SM2.review(id, quality)`**:
- 정답 + 같은 날: interval/repetition 고정 (alreadyToday guard)
- 정답 + 다른 날: 정상 SM-2 진행, `lastReviewed = today()`
- 오답: `repetition=0, dueDate=today(), lastReviewed=null` → 다음 세션 즉시 재등장

**`SM2.introduce(id)`**: 신규 카드 최초 등록. `dueDate=오늘, repetition=0, lastReviewed=null`.

---

## 8. 핵심 로직

### 홈 화면 버튼 구성 (순서)
1. **학습 시작** — 한자 4지선다 퀴즈
2. **📖 스토리 퀴즈** — 스토리 보고 한자 맞추기 (story 필드 있는 카드 10장 이상 필요)
3. **📝 단어 퀴즈** — 2글자 단어 완성 퀴즈 (학습 카드 10장 이상 필요)
4. **학습 기록 보기** — 히스토리 화면

### 학습 세션 플로우

세션 카드 구성 우선순위 (최대 10장):
1. 복습 대상 중 정답률 < 50% (약한 카드 우선)
2. 미복습이지만 정답률 < 50% (앞당겨 출제)
3. 복습 대상 중 정답률 ≥ 50%
4. 신규 카드 (①+②가 0장일 때만, 8급→1급 순)

**신규 카드**: 인트로 화면 → 확인 후 3장 뒤에 퀴즈로 재등장 (기억 고정)

**오답 재시도**: 최대 2회. 재시도 중 SM2 기록 보류, 최종 결과 때 반영. 재시도 카드는 주황 테두리+글로우 표시.

### 피드백 딜레이

- 한자/단어/스토리 퀴즈: **정답 900ms, 오답 900ms** (동일)
- 스토리 퀴즈 오답만: **1500ms** (스토리+정답 확인 시간 확보)

### 단어 퀴즈 (Word Quiz)

- `hanja_wq_state`로 독립 SM-2 관리
- 두 한자 모두 학습한 2글자 단어만 출제
- **힌트 적응**: `repetition < 2` → 한국어 독음 표시 / `repetition ≥ 2` → 숨김
- 답변 후: 항상 훈음 변환 표시 (`선두 → (먼저)선 (머리)두`)

### 스토리 퀴즈 (Story Quiz)

- 스토리 읽고 한자 맞추기 (역방향 학습)
- `hanja_sm2_state` 공유 (한자 퀴즈와 동일 학습 주기)
- **힌트 적응**: `repetition < 2` → 훈음 표시 / `repetition ≥ 2` → 숨김
- story 필드 있는 카드만 출제 (현재 8~2급)

### 정답률 기록

카드별 `{ c: 정답수, t: 총시도 }` 누적 저장.
- 🔴 50% 미만 / 🟡 50~80% / 🟢 80% 이상

---

## 9. 앱 상태(state) 구조

```javascript
let state = {
  screen: 'home', // 'home'|'study'|'history'|'done'|'word-quiz'|'word-done'|'story-quiz'|'story-done'
  // 한자 퀴즈
  queue: [], queueIndex: 0, choices: null, answered: null,
  quizDir: null, introduced: false,
  sessionCorrect: 0, sessionTotal: 0, sessionWrong: [],
  retryMap: {},      // { [card.id]: 재시도 횟수 }
  // 단어 퀴즈
  wqQueue: [], wqIndex: 0, wqAnswered: null,
  wqCorrect: 0, wqTotal: 0, wqWrong: [],
  // 스토리 퀴즈
  sqQueue: [], sqIndex: 0, sqAnswered: null,
  sqCorrect: 0, sqTotal: 0, sqWrong: [],
  // 공통
  newVersionAvailable: false, swRegistration: null,
  isDarkMode: Boolean
};
```

---

## 10. UI/UX 결정사항

| 항목 | 결정 내용 |
|------|-----------|
| 홈 버튼 순서 | 학습 시작 → 스토리 퀴즈 → 단어 퀴즈 → 학습 기록 |
| 스트릭 표시 | 환영 메시지 영역에서만 표시 (상단 배지 제거) |
| 동기부여 요소 | 문제 수 대신 XP 표시 (1문제 = 10 XP) |
| 피드백 딜레이 | 모든 퀴즈 정답/오답 900ms (스토리 오답만 1500ms) |
| 재시도 표시 | 카드 주황 테두리+글로우 (배지 없음) |
| 힌트 적응 기준 | SM-2 repetition < 2: 힌트 표시 / ≥ 2: 숨김 |
| 선택지 버튼 | `border-radius: 24px` |
| 히스토리 뒤로가기 | 오른쪽 스와이프 (dx > 60px, dy < 80px) |
| 다크 테마 | 수동 토글 (`hanja_dark_mode`) |

---

## 11. Service Worker 업데이트 전략

- `sw.js` 캐시 버전을 올리면 새 SW가 설치됨
- 새 버전 감지 시 앱 내 업데이트 배너 표시
- 버전 배지 탭 → `forceUpdate()`: SW 해제 + 캐시 삭제 + 리로드

---

## 12. AI 협업 규칙

### 공통
- **이 파일(PROJECT.md)** 을 항상 먼저 읽고 현재 상태 파악
- 기능 추가·변경 시 PROJECT.md 해당 섹션 **반드시 업데이트**
- 세션 종료 후 `history/session-NNN.md` 작성 + git commit & push

### 버전 관리
- `js/app.js`의 `APP_VERSION` 상수 업데이트
- `sw.js`의 `CACHE` 상수 버전 업 (hanja-vN)
- PROJECT.md 1번 섹션 동기화

### UI/UX 변경 시
- 구현 전에 반드시 이해한 내용을 텍스트로 정리하여 확인받을 것
- 디자인 결정사항은 10번 섹션에 기록

### 데이터 수정 시
- `char` 필드에 한글/호환 한자 금지
- `eumhun` 필드에 한자 포함 금지
- `story` 필드 추가 시 scripts/ 스크립트 방식 사용
