# Gemini 작업 규칙

> **프로젝트 전체 명세는 `PROJECT.md`를 참조하세요.**  
> 작업 시작 전 반드시 PROJECT.md를 읽어 현재 버전과 상태를 확인하세요.  
> 이 파일(GEMINI.md)의 이전 스펙 내용은 PROJECT.md로 이전되었습니다.

## 작업 기록 (필수)

모든 작업 세션이 끝나면 반드시 `history/session-NNN.md` 파일을 생성한다.

- 파일명: `session-001.md`, `session-002.md` ... 순번으로 증가
- 내용: 무엇을 왜 했는지, 어떻게 고쳤는지, 핵심 개념 설명 포함
- 작성 후 git commit & push까지 완료

## 기능 변경 시 필수 업데이트

1. `PROJECT.md` 해당 섹션 업데이트 (버전, 스키마, 로직, UX 결정사항 등)
2. `js/app.js`의 `APP_VERSION` 상수 업
3. `sw.js`의 `CACHE` 버전 업
4. `history/session-NNN.md` 작성

## 배포 환경 주의사항

GitHub Pages 서브디렉토리 배포이므로 절대경로는 항상 `/Claude_ChineseCharacter/` 포함.  
`manifest.json`의 `start_url`, `scope` 및 `sw.js`의 캐시 경로 모두 해당.
