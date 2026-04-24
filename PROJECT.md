# 漢字 카드 프로젝트 명세 (PROJECT.md)

> **이 파일은 Claude와 Gemini가 공동으로 유지하는 단일 진실 공급원(Single Source of Truth)입니다.**  
> 기능 추가·변경·삭제 시 반드시 이 파일의 해당 섹션을 업데이트하세요.

---

## 1. 현재 버전

| 항목 | 값 |
|------|-----|
| `APP_VERSION` (js/app.js) | `v5.1` |
| SW 캐시 버전 (sw.js) | `hanja-v24` |
| 최종 업데이트 | 2026-04-24 |

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
  session-NNN.md             ← 세션별 작업 로그 (session-001 ~ session-007)
logs/                        ← gitignore 대상 (Claude Code 대화 로그 자동 저장)
scripts/
  cleanup_enrich.js          ← 데이터 정제 스크립트
  fix_busu.js                ← 부수 필드 수정 스크립트
  refresh_data.js            ← 데이터 갱신 스크립트
  ultimate_enrich.js         ← 데이터 보강 스크립트
CLAUDE.md                    ← Claude 작업 규칙
GEMINI.md                    ← Gemini 작업 규칙 (내용은 PROJECT.md로 이관됨)
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
  char: "漢",           // 한자 (반드시 CJK 한자, 한글/호환 영역 문자 금지)
  eumhun: "한수 한",   // 훈음 (반드시 한국어. 한자 포함 금지)
  words: ["한자(漢字)", "한문(漢文)"],  // 예시 단어 ("훈독(漢字)" 형식)
  busu: "水(물수)",     // 부수 (모를 경우 "확인중")
  similar: []           // 유의자 배열
}
```

**데이터 품질 규칙**:
- `char` 필드: 한자만. 한글이나 기호 금지.
- `eumhun` 필드: 한국어만. 한자 포함 시 오류. 반드시 "뜻 음" 형식.

### 급수별 카드 수

| 급수 | 카드 수 |
|------|--------|
| 8급  | 52장   |
| 7급  | 107장  |
| 6급  | 169장  |
| 5급  | 252장  |
| 4급  | 546장  |
| 3급  | 776장  |
| 2급  | 587장  |
| 1급  | 503장  |
| **합계** | **2,992장** |

---

## 6. localStorage 키 목록

| 키 | 타입 | 내용 |
|----|------|------|
| `hanja_sm2_state` | JSON object | SM-2 카드별 상태 `{ [id]: { interval, repetition, efactor, dueDate } }` |
| `hanja_streak` | JSON object | 연속 학습 스트릭 `{ lastDate, count, best }` |
| `hanja_accuracy` | JSON object | 카드별 정답률 `{ [id]: { c: 정답수, t: 총시도수 } }` |
| `hanja_dark_mode` | string | `"true"` / `"false"` |

**주의사항**:
- `SM2.resetAll()`은 `hanja_sm2_state`와 `hanja_accuracy`만 삭제 (streak은 유지)
- `exportData()`는 `hanja_sm2_state`와 `hanja_streak`만 내보냄 (accuracy 미포함)

---

## 7. SM-2 상태 스키마

```javascript
// hanja_sm2_state[id]
{
  interval: 6,        // 다음 복습까지 일수
  repetition: 1,      // 연속 정답 횟수 (0이면 실패/초기화)
  efactor: 2.5,       // 난이도 계수 (1.3~2.5+)
  dueDate: "2026-04-30"  // 다음 복습 날짜 (YYYY-MM-DD)
}
```

**`SM2.review(id, quality)`**: quality=4(정답), quality=1(오답)

**`SM2.introduce(id)`**: 신규 카드 최초 등록. `repetition:0, interval:1, dueDate: 내일`로 초기화. 이미 존재하면 no-op.

---

## 8. 핵심 로직

### 학습 세션 플로우

1. **"학습 시작"** 버튼 하나만 존재 (복습/신규 분리 없음)
2. 세션 구성: `복습 대상(dueDate ≤ 오늘, 최대 10장)` → 부족분은 `신규 카드`로 채워 **항상 최대 10장**
3. 신규 카드 투입 순서: 8급 → 7급 → ... → 1급 (해당 급수 소진 후 다음 급수)
4. 복습 카드가 먼저, 그 다음 신규 카드 (순서 섞지 않음)

### 신규 카드 인트로 화면

- `isNew(card.id) === true`인 카드가 큐에 등장하면 퀴즈 없이 **인트로 화면** 표시
- 인트로 화면: NEW 배지, 한자, 훈음, 급수, 부수·단어·유의자 메타 정보
- "확인했어요 →" 클릭 → `SM2.introduce(id)` 호출 후 다음 카드로 이동
- 인트로를 거친 카드는 SM2에 등록되어 다음 날 복습 대상이 됨
- `sessionCorrect` / `sessionTotal` 카운트에 포함되지 않음

### 퀴즈 방식 (4지선다 MCQ — 한자 퀴즈)

- 카드마다 **50% 확률로 방향 결정**:
  - `char2eumhun`: 한자 표시 → 4개 훈음 중 선택
  - `eumhun2char`: 훈음 표시 → 4개 한자 중 선택
- 오답 3개: **같은 급수 우선**, 부족 시 다른 급수로 보충 (reservoir sampling)
- 피드백: 정답 300ms, 오답 600ms 후 자동 진행
- 정답 → 초록색 / 오답 → 빨간색 + 정답 초록색 표시

### 단어 퀴즈 (Word Quiz)

- 홈 화면 "📝 단어 퀴즈" 버튼 (학습 카드 10장 이상 필요)
- **문제 구성**: 학습한 한자들 중 2글자 단어(`words` 필드)를 추출, ?로 한 글자를 숨김
  - 형식: `한자(漢字)` → "한자" + `漢?` 또는 `?字` 표시
  - 두 글자 모두 학습한 경우에만 출제
- 세션당 최대 10문항, shuffle
- 오답 3개: 같은 급수 우선, 부족 시 다른 급수 보충
- 오답 재도전 기능 (`btn-wq-retry`)
- SM2 review 호출 없음 (단어 퀴즈는 SM2에 영향 없음)

### 정답률 기록

- 카드별 `{ c: 정답수, t: 총시도 }` 누적 저장
- 학습 화면: 카드 우상단에 정답률 배지 표시 (첫 시도 카드는 표시 안 함)
  - 🔴 50% 미만 / 🟡 50~80% / 🟢 80% 이상
- 히스토리 화면: 각 섹션을 정답률 낮은 순 정렬

### 스트릭 시스템

- 매일 학습 완료(세션 종료) 시 `recordStreak()` 호출
- `hanja_streak.best`에 최고 기록 보존
- 홈 화면 상단 배지 및 인사말에 스트릭 표시

---

## 9. 앱 상태(state) 구조

```javascript
let state = {
  screen: 'home',        // 'home' | 'study' | 'history' | 'done' | 'word-quiz' | 'word-done'
  // 한자 퀴즈
  queue: [],             // 현재 세션 카드 배열
  queueIndex: 0,         // 현재 카드 인덱스
  choices: null,         // 4지선다 보기 배열 (card 객체 4개)
  answered: null,        // 선택한 card.id (null = 미답)
  quizDir: null,         // 'char2eumhun' | 'eumhun2char'
  introduced: false,     // 신규 카드 인트로 진행 중 여부 (현재 미사용, 상시 false)
  sessionCorrect: 0,
  sessionTotal: 0,
  sessionWrong: [],
  // 단어 퀴즈
  wqQueue: [],           // 단어 퀴즈 문항 배열
  wqIndex: 0,
  wqAnswered: null,      // 선택한 문자 (null = 미답)
  wqCorrect: 0,
  wqTotal: 0,
  wqWrong: [],           // 틀린 문항 배열 (재도전용)
  // 공통
  newVersionAvailable: false,
  swRegistration: null,
  isDarkMode: Boolean    // localStorage 'hanja_dark_mode' 초기값
};
```

---

## 10. UI/UX 결정사항

| 항목 | 결정 내용 |
|------|-----------|
| 학습 버튼 | "학습 시작" 하나. 취약/복습/신규 분리 버튼 없음 |
| 카드 뒤집기 | 없음 (MCQ 방식으로 대체) |
| 신규 카드 | 처음 만나면 인트로 화면 표시 후 다음 턴부터 퀴즈에 등장 |
| 피드백 딜레이 | 정답 300ms, 오답 600ms |
| 선택지 버튼 | `border-radius: 24px` |
| 히스토리 뒤로가기 | 오른쪽 스와이프 (dx > 60px, dy < 80px) |
| 다크 테마 | 수동 토글 (`hanja_dark_mode`) |
| 단어 퀴즈 진입 조건 | 학습 카드 10장 이상 (statsTotal ≥ 10) |

---

## 11. Service Worker 업데이트 전략

- `sw.js` 캐시 버전을 올리면 새 SW가 설치됨
- 새 버전 감지 시 앱 내 업데이트 배너 표시
- 버전 배지 탭 → `forceUpdate()`: SW 해제 + 캐시 삭제 + `?v=타임스탬프`로 리로드

---

## 12. AI 협업 규칙

### 공통
- **이 파일(PROJECT.md)** 을 항상 먼저 읽고 현재 상태 파악
- 기능 추가·변경 시 PROJECT.md의 해당 섹션 **반드시 업데이트**
- `APP_VERSION`, SW 캐시 버전, localStorage 키, 데이터 스키마 변경 시 즉시 반영
- 세션 종료 후 `history/session-NNN.md` 작성 + git commit & push

### 버전 관리
- `js/app.js`의 `APP_VERSION` 상수 업데이트
- `sw.js`의 `CACHE` 상수 버전 업 (hanja-vN)
- PROJECT.md 1번 섹션(현재 버전) 동기화

### 데이터 수정 시
- `char` 필드에 한글/호환 한자 금지
- `eumhun` 필드에 한자 포함 금지
- 수정 후 해당 level 파일 git add 포함
