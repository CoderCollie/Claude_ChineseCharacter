# Session 007 — 4지선다 퀴즈 모드 구현 (v4.3)

## 무엇을 했는가

기존 플래시카드 방식(한자 탭 → 뒤집기 → 알았다/몰랐다 자가평가)을 4지선다 객관식 퀴즈 방식으로 전면 교체.

## 왜 했는가

자가평가 방식은 사용자 편향(너그러운 자기 채점)이 생겨 실제 기억 여부를 정확히 반영하지 못함.
보기 중 하나를 고르는 방식이 능동적 회상(active recall)을 유도해 학습 효율이 더 높음.

## 어떻게 고쳤는가

### js/app.js (v4.2 → v4.3)
- `state.flipped` 제거, `state.choices`(4개 보기 배열)와 `state.answered`(선택한 id) 추가
- `generateChoices(currentCard)`: HANJA_DATA에서 오답 3개 랜덤 추출 후 정답과 셔플
- `renderStudy()`: 카드 앞면(한자+레벨)만 표시, `.choice-grid` 2×2 그리드로 4개 보기 버튼 렌더링
- `answer(selectedCard)`:
  - 정답이면 600ms, 오답이면 1000ms 후 자동 진행
  - 첫 `render()` 호출로 색 피드백 표시 후 `setTimeout` 내에서 SM2.review + 다음 카드로 이동
- `bindEvents()`: 카드 클릭/스와이프 제거, `.choice-btn` 클릭 핸들러로 교체
- `startSession()` / `retryWrong()`: choices/answered 리셋 로직 포함

### css/style.css
- `.card-simple`: 플립 없는 단순 카드 (배경, 그림자, 둥근 모서리)
- `.choice-grid`: 2열 그리드, gap 12px
- `.choice-btn`: 기본 보기 버튼 스타일
- `.choice-correct`: 정답 표시 (녹색)
- `.choice-wrong`: 오답 표시 (빨간색)
- `.choice-disabled`: 답 선택 후 나머지 보기 비활성화 (opacity 0.45)
- 다크 테마 대응 추가

### sw.js
- 캐시 버전 v9 → v10

## 핵심 개념

**Double-render 피드백 패턴**: `state.answered` 설정 후 즉시 `render()`를 호출해 색 피드백을 표시하고,
`setTimeout` 콜백에서 SM2 업데이트 + 다음 카드로 진행. 단일 렌더러로 피드백과 진행을 모두 처리.

**오답 distractor 생성**: 전체 HANJA_DATA에서 현재 카드를 제외하고 랜덤 3개 선택. 레벨 필터 없이 전체 풀에서
뽑으면 난이도가 자연스럽게 높아져 실력 향상에 유리.
