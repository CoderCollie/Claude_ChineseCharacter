# 세션 001 — 한자 플래시카드 PWA 최초 구축

**날짜**: 2026-04-18  
**작업자**: CoderCollie + Claude Sonnet 4.6  
**레포**: https://github.com/CoderCollie/Claude_ChineseCharacter  
**배포 URL**: https://codercollie.github.io/Claude_ChineseCharacter/

---

## 1. 목적 및 배경

한국어문회 한자능력검정시험 **6급 ~ 1급** 대비 학습 도구 필요.  
일본어·중국어 학습 시 한자 지식이 도움이 되므로 병행 학습 목적.

### 요구사항 정리
- 별도 앱 설치 없이 **폰에서 바로 사용** 가능한 형태
- **GitHub Pages** 배포로 URL 하나로 접속
- **SM-2 간격반복 알고리즘** 적용 (Anki 방식)
- 플래시카드 형태: 한자 앞면 → 음훈 뒷면
- 급수별 필터링 (8급 ~ 1급)
- 카드 데이터: 한자 + 음훈만 (예문 없음)

---

## 2. 기술 스택 결정

| 항목 | 선택 | 이유 |
|------|------|------|
| 앱 형태 | **PWA** (Progressive Web App) | 설치 불필요, 오프라인 동작, 홈 화면 추가 가능 |
| 빌드 도구 | **없음** (순수 HTML/CSS/JS) | 빠른 개발, 복잡성 최소화 |
| 배포 | **GitHub Pages** | 무료, 즉시 사용 가능 |
| 복습 알고리즘 | **SM-2** | 과학적 간격반복, Anki와 동일 방식 |
| 데이터 저장 | **localStorage** | 서버 불필요, 기기 내 저장 |
| 아이콘/프레임워크 | **없음** | 의존성 최소화 |

---

## 3. 파일 구조

```
Claude_ChineseCharacter/
├── index.html          # PWA 진입점, 메타태그/매니페스트 링크
├── manifest.json       # PWA 설치 정보 (이름, 아이콘, 테마색)
├── sw.js               # Service Worker — 오프라인 캐시
├── css/
│   └── style.css       # 전체 스타일 (모바일 우선, 다크모드 포함)
├── js/
│   ├── data.js         # 한자 데이터 (8급~1급, 1126자)
│   ├── sm2.js          # SM-2 알고리즘 + localStorage 관리
│   └── app.js          # 앱 전체 로직 (상태관리, 렌더링, 이벤트)
├── icons/
│   ├── icon-192.png    # PWA 아이콘 (192×192)
│   └── icon-512.png    # PWA 아이콘 (512×512)
└── history/
    └── session-001.md  # 이 문서
```

---

## 4. 각 파일 상세 설명

### 4-1. `index.html`
- PWA 필수 메타태그 포함
  - `viewport-fit=cover`: 아이폰 노치 대응
  - `apple-mobile-web-app-capable`: iOS Safari 앱 모드
  - `theme-color`: 주소창 색상 (파란색 `#2563eb`)
- `<div id="app">` 하나만 존재, 나머지는 JS가 동적 렌더링
- 스크립트 로드 순서: `data.js` → `sm2.js` → `app.js` (의존성 순)

### 4-2. `manifest.json`
```json
{
  "name": "漢字 플래시카드",
  "short_name": "漢字카드",
  "display": "standalone",      // 브라우저 UI 없이 앱처럼 실행
  "theme_color": "#2563eb",
  "orientation": "portrait"
}
```

### 4-3. `sw.js` — Service Worker
- **Cache-first 전략**: 앱 셸(HTML/CSS/JS)을 설치 시 캐시
- 오프라인에서도 앱 완전 동작
- 버전 관리: `CACHE = 'hanja-v1'` — 업데이트 시 버전 올리면 구 캐시 자동 삭제

### 4-4. `css/style.css`
**설계 원칙**
- CSS 변수(`--bg`, `--primary` 등)로 다크모드 지원
- `prefers-color-scheme: dark` 미디어쿼리로 자동 전환
- 터치 영역 최소 48px 준수
- 모바일 우선 (max-width: 480px 제약)

**주요 컴포넌트**
| 컴포넌트 | 설명 |
|----------|------|
| `.lv-btn` | 급수 선택 버튼 (선택 시 파란색) |
| `.card` | CSS 3D transform으로 뒤집기 애니메이션 |
| `.card.flipped` | `rotateY(180deg)` 적용 |
| `.action-row` | 몰랐다/알았다 버튼, 카드 뒤집기 전 비활성 |
| `.btn-wrong` / `.btn-right` | 빨간/초록 반투명 버튼 |

### 4-5. `js/data.js` — 한자 데이터

**데이터 구조**
```js
{ id: "h001", level: 8, char: "一", eumhun: "한 일" }
```

**급수별 수록 현황**
| 급수 | 수록 수 | 비고 |
|------|---------|------|
| 8급 | 50자 | 숫자, 기본 자연/방위/신체 |
| 7급 | 100자 | 학교, 계절, 일상 생활 |
| 6급 | 150자 | 기초 추상 개념, 동사성 한자 |
| 5급 | 166자 | 감정, 제도, 학문 관련 |
| 4급 | 215자 | 사회, 법률, 행정 관련 |
| 3급 | 217자 | 고급 어휘, 문학·역사 한자 |
| 2급 | 102자 | 전문 어휘 |
| 1급 | 126자 | 고급·희귀 한자 |
| **합계** | **1,126자** | |

한국어문회 급수별 대표 한자 기준으로 구성. 음훈은 전통 훈음 표기 방식 준수.

### 4-6. `js/sm2.js` — SM-2 알고리즘

**SM-2 핵심 로직**
```
알았다 (quality=4):
  repetition=0 → interval=1
  repetition=1 → interval=6
  repetition≥2 → interval = round(interval × efactor)
  efactor = max(1.3, efactor + 0.1 - (5-4)×(0.08+(5-4)×0.02))

몰랐다 (quality=1):
  interval=1, repetition=0 (처음부터 재시작)
  efactor = max(1.3, efactor + 0.1 - (5-1)×(0.08+(5-1)×0.02))
```

**카드 상태 localStorage 저장 형식**
```json
{
  "h001": { "interval": 6, "repetition": 2, "efactor": 2.5, "dueDate": "2026-04-24" },
  "h002": { "interval": 1, "repetition": 0, "efactor": 1.7, "dueDate": "2026-04-19" }
}
```

**제공 함수**
| 함수 | 설명 |
|------|------|
| `review(id, quality)` | 카드 복습 처리, 다음 복습일 계산 |
| `isDue(id)` | 오늘 복습 대상 여부 |
| `isNew(id)` | 한 번도 학습 안 한 카드 여부 |
| `getDueCards(list)` | 복습 대상 카드 목록 반환 |
| `getNewCards(list)` | 신규 카드 목록 반환 |
| `getStats()` | 오늘 학습 수, 복습 수, 전체 학습 수 |
| `resetAll()` | 전체 초기화 (localStorage 삭제) |

### 4-7. `js/app.js` — 앱 로직

**상태 구조**
```js
state = {
  screen: 'home' | 'study' | 'done',
  selectedLevels: [8,7,6,5,4,3],  // 기본 선택
  queue: [],           // 현재 세션 카드 목록
  queueIndex: 0,       // 현재 카드 위치
  flipped: false,      // 카드 뒤집기 상태
  sessionCorrect: 0,   // 이번 세션 정답 수
  sessionTotal: 0,     // 이번 세션 전체 수
}
```

**화면 구성 (3개 스크린)**

1. **홈 화면** (`home`)
   - 급수 버튼 (8개, 다중 선택, 최소 1개 유지)
   - 통계 박스: 복습할 카드 수 / 신규 카드 수 / 전체 학습 수
   - 학습 시작 버튼 (세션 크기 표시, 0개면 비활성화)

2. **학습 화면** (`study`)
   - 상단: 닫기 버튼 + 진행도 바 + 카드 번호
   - 카드: 탭하면 CSS 3D 뒤집기 → 음훈 표시
   - 하단: 몰랐다 / 알았다 버튼 (뒤집기 전 숨김)
   - 신규 카드는 `NEW` 뱃지 표시

3. **완료 화면** (`done`)
   - 정답률 70% 이상이면 🎉, 이하면 📚
   - 학습 수 / 정답 수 / 정답률 통계
   - 다시 학습 / 홈으로 버튼

**세션 구성 로직**
```
세션 = 복습 대상 카드 (전부) + 신규 카드 (최대 20장)
→ 무작위 셔플 후 순서대로 제시
```

---

## 5. GitHub 배포 과정

```bash
# 1. git 초기화 및 커밋
git init
git add index.html manifest.json sw.js css/ js/ icons/
git commit -m "init: 한자 플래시카드 PWA (SM-2 간격반복, 8급~1급 1126자)"

# 2. GitHub 레포 생성 및 push (gh CLI 사용)
gh repo create Claude_ChineseCharacter --public --source=. --remote=origin --push

# 3. GitHub Pages 활성화 (gh API 사용)
gh api repos/CoderCollie/Claude_ChineseCharacter/pages \
  --method POST \
  --field 'source[branch]=main' \
  --field 'source[path]=/'
```

**결과**
- 레포: https://github.com/CoderCollie/Claude_ChineseCharacter
- 앱 URL: https://codercollie.github.io/Claude_ChineseCharacter/

---

## 6. 사용 방법

### 폰에서 앱 설치 (iOS Safari)
1. `https://codercollie.github.io/Claude_ChineseCharacter/` 접속
2. 하단 공유 버튼 → **홈 화면에 추가**
3. 이후 앱처럼 실행 가능, 오프라인도 동작

### 학습 방법
1. 홈에서 학습할 급수 선택 (기본: 8~3급)
2. **학습 시작** 버튼
3. 한자 카드 탭 → 음훈 확인
4. **알았다** / **몰랐다** 선택
   - 알았다: 다음 복습일 자동 계산 (처음엔 1일 후, 이후 점점 늘어남)
   - 몰랐다: 내일 다시 복습
5. 매일 앱 열면 복습할 카드 + 신규 카드 20장이 자동 세팅

---

## 7. 향후 개선 가능 사항 (미구현)

- [ ] 예문/단어 추가 (현재 음훈만)
- [ ] 획순 이미지 표시
- [ ] 통계 그래프 (일별 학습 현황)
- [ ] 카드 직접 추가/편집 기능
- [ ] 오답 노트 모아보기
- [ ] 세션당 신규 카드 수 설정
- [ ] 1급 데이터 추가 확충 (현재 126자, 목표 1000자)
