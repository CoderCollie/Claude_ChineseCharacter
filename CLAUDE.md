# 프로젝트 규칙

## 작업 기록 (필수)

모든 작업 세션이 끝나면 반드시 `history/session-NNN.md` 파일을 생성한다.

- 파일명: `session-001.md`, `session-002.md` ... 순번으로 증가
- 내용: 무엇을 왜 했는지, 어떻게 고쳤는지, 핵심 개념 설명 포함
- 작성 후 git commit & push까지 완료

## 프로젝트 개요

한국어문회 한자능력검정시험(8급~1급) 대비 PWA 플래시카드 앱.  
배포 URL: `https://codercollie.github.io/Claude_ChineseCharacter/`  
레포: `https://github.com/CoderCollie/Claude_ChineseCharacter`

## 배포 환경 주의사항

GitHub Pages 서브디렉토리 배포이므로 절대경로는 항상 `/Claude_ChineseCharacter/` 포함.  
`manifest.json`의 `start_url`, `scope` 및 `sw.js`의 캐시 경로 모두 해당.
