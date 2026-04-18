# 세션 003 — 버전 표시 + SM-2 학습 가이드 모달 추가

**날짜**: 2026-04-18  
**작업자**: CoderCollie + Claude Sonnet 4.6  
**커밋**: `feat: 버전 표시(v1.2) + SM-2 학습 가이드 모달 추가`

---

## 1. 배경 및 목적

### 버전 표시
아이폰 홈 화면 추가 버그(세션 002) 수정 후에도 동일 증상이 계속될 수 있음.  
이게 **구 버전 캐시가 남아 있는 건지**, **수정이 아직 안 된 건지** 구분이 불가능했음.  
→ 홈 화면에 앱 버전을 표시해서 현재 어떤 버전이 실행 중인지 눈으로 확인 가능하게 함.

### 학습 가이드
알았다/몰랐다를 누르면 다음 복습이 언제 오는지, SM-2가 무엇인지 설명이 없었음.  
→ `?` 버튼을 눌러 언제든 학습 방법 확인 가능한 모달 추가.

---

## 2. 수정한 파일

- `js/app.js`
- `css/style.css`

---

## 3. 변경 상세

### 3-1. `js/app.js` — 버전 상수 추가

파일 최상단에 버전 상수 선언:

```js
const APP_VERSION = 'v1.2';
```

이후 버전을 올릴 때 이 값만 바꾸면 됨. 홈 화면에 자동 반영.

### 3-2. `js/app.js` — 홈 화면 레이아웃 수정

기존 `<h1>` 타이틀만 있던 자리를 `title-row`로 감싸고,  
오른쪽에 `?` 버튼과 버전 뱃지를 나란히 배치.

```html
<div class="title-row">
  <h1 class="app-title">漢字 카드</h1>
  <div class="title-actions">
    <button class="btn-guide" id="btn-guide">?</button>
    <span class="version-badge">v1.2</span>
  </div>
</div>
```

### 3-3. `js/app.js` — 가이드 모달 HTML

홈 화면 HTML 안에 모달 마크업 추가.  
초기 상태는 `hidden` 클래스로 숨겨져 있고, `?` 버튼 클릭 시 표시.

모달 내용:
| 섹션 | 내용 |
|------|------|
| 기본 사용법 | 3단계 학습 순서 (선택 → 탭 → 알았다/몰랐다) |
| SM-2 간격반복이란? | 개념 설명 |
| 복습 간격 스케줄 | 회차별 다음 복습 시점 표 |
| 매일 학습 루틴 | 복습+신규 자동 세팅 설명 |

**복습 간격 표**:
| 회차 | 버튼 | 다음 복습 |
|------|------|-----------|
| 1회 | 알았다 | 1일 후 |
| 2회 | 알았다 | 6일 후 |
| 3회 | 알았다 | ~15일 후 |
| 4회 | 알았다 | ~38일 후 |
| 언제든 | 몰랐다 | 내일 (초기화) |

### 3-4. `js/app.js` — 모달 이벤트 바인딩

`bindEvents()` 홈 화면 분기 안에 추가:

```js
// ? 버튼 → 모달 표시
el('btn-guide').addEventListener('click', () => {
  el('guide-overlay').classList.remove('hidden');
});

// ✕ 버튼 → 모달 닫기
el('btn-close-guide').addEventListener('click', () => {
  el('guide-overlay').classList.add('hidden');
});

// 오버레이 배경 탭 → 모달 닫기
el('guide-overlay').addEventListener('click', e => {
  if (e.target === el('guide-overlay')) el('guide-overlay').classList.add('hidden');
});
```

모달을 JS 상태(`state`)로 관리하지 않고 직접 CSS 클래스 토글로 처리한 이유:  
모달 open/close는 화면 전환이 아니라 단순 UI 레이어이므로 `render()` 재호출 불필요.

### 3-5. `css/style.css` — 신규 스타일

**타이틀 영역**
```css
.title-row          /* flexbox: 제목 좌, 버튼들 우 */
.title-actions      /* ? 버튼 + 버전 뱃지 묶음 */
.version-badge      /* 회색 pill 뱃지 */
.btn-guide          /* 원형 ? 버튼 */
```

**모달**
```css
.modal-overlay      /* 전체화면 반투명 배경, position:fixed */
.modal-overlay.hidden  /* display:none */
.modal              /* 하단 시트 형태, border-radius 상단만 */
.modal-header       /* sticky: 스크롤해도 헤더 고정 */
.modal-body         /* 내용 영역 */
```

**모달 시트 형태를 선택한 이유**  
모바일에서 중앙 팝업보다 하단 시트가 엄지손가락 닿기 쉽고 자연스러움.  
`align-items: flex-end`로 오버레이 안에서 하단 정렬.

`padding-bottom: env(safe-area-inset-bottom, 16px)` — 아이폰 홈바 영역 침범 방지.

---

## 4. 캐시 진단 방법

버전 뱃지 활용법:

| 화면에 표시된 버전 | 의미 |
|------------------|------|
| `v1.2` | 최신 버전 정상 로딩 |
| 버전 뱃지 없음 | 구버전 캐시 서빙 중 |

**구버전 캐시 강제 삭제 방법 (iPhone)**  
설정 → Safari → 방문 기록 및 웹 사이트 데이터 지우기 → 재접속

---

## 5. 현재 버전 히스토리

| 버전 | 내용 |
|------|------|
| v1.0 | 최초 배포 (세션 001) |
| v1.1 | manifest/sw.js 경로 버그 수정 (세션 002) |
| v1.2 | 버전 표시 + 가이드 모달 추가 (세션 003) |
