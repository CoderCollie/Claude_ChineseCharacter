# 세션 008 — 대화 로그 자동 저장 + PROJECT.md 전면 갱신

**날짜**: 2026-04-24  
**작업자**: CoderCollie + Claude Sonnet 4.6  

---

## 무엇을 했는가

1. **Claude Code Stop 훅 설정** — Claude가 응답을 완료할 때마다 대화 `.jsonl` 파일을 프로젝트 내 `logs/` 폴더로 자동 복사하도록 `.claude/settings.local.json`에 Stop 훅 추가
2. **`.gitignore` 생성** — `logs/` 폴더를 git 추적 제외
3. **PROJECT.md 전면 갱신** — 코드베이스 전체 분석 후 누락·오기 수정

---

## Stop 훅 동작 방식

```json
"hooks": {
  "Stop": [{
    "hooks": [{
      "type": "command",
      "command": "read -r input; SESSION_ID=$(echo \"$input\" | jq -r '.session_id // empty'); ...",
      "statusMessage": "대화 로그 저장 중..."
    }]
  }]
}
```

- Stop 이벤트 stdin으로 `{ session_id: "..." }` 수신
- `~/.claude/projects/-Users-seunghoonlee-Claude-ChineseCharacter/<id>.jsonl` → `logs/<id>.jsonl` 복사
- 동일 세션의 최신 상태로 덮어쓰기 (타임스탬프 prefix 없음)

---

## PROJECT.md 갱신 내용

| 섹션 | 변경 내용 |
|------|-----------|
| 섹션 1 | 최종 업데이트 날짜 갱신 (2026-04-24) |
| 섹션 4 | `scripts/`, `logs/`, `.gitignore`, `GEMINI.md`, `js/data.js`(레거시) 추가 |
| 섹션 5 | 급수별 카드 수 표 추가 (총 2,992장) |
| 섹션 6 | `resetAll()`과 `exportData()`의 localStorage 처리 범위 주의사항 추가 |
| 섹션 7 | `SM2.introduce()` 함수 문서화 |
| 섹션 8 | 신규 카드 인트로 화면 플로우 추가, 단어 퀴즈(Word Quiz) 섹션 신규 추가 |
| 섹션 9 | `introduced`, `wqQueue`, `wqIndex`, `wqAnswered`, `wqCorrect`, `wqTotal`, `wqWrong` 필드 추가 |
| 섹션 10 | 신규 카드 UX, 선택지 border-radius, 단어 퀴즈 진입 조건 추가 |

---

## 발견한 잠재적 기술 부채

- `js/data.js` — 레거시 모놀리식 데이터 파일. `index.html`에서 로드하지 않으나 파일이 남아 있음. 삭제 가능.
- `state.introduced` — 항상 `false`로 reset되며 `true`로 세팅되는 코드 없음. 사실상 미사용 필드.
- `exportData()` — `hanja_accuracy`를 내보내지 않아 기기 이전 시 정답률 통계 유실 가능.
