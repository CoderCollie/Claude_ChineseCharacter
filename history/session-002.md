# 세션 002 — PWA 아이폰 홈 화면 추가 버그 수정

**날짜**: 2026-04-18  
**작업자**: CoderCollie + Claude Sonnet 4.6  
**커밋**: `fix: manifest start_url/scope와 sw.js 경로를 서브디렉토리로 수정`

---

## 1. 문제 현상

아이폰 Safari에서 공유 버튼 → **홈 화면에 추가** 를 눌렀을 때,  
`https://codercollie.github.io/Claude_ChineseCharacter/` 가 아니라  
`https://codercollie.github.io/` (루트) 로 바로가기가 생성됨.

---

## 2. 원인 분석

### GitHub Pages 배포 구조 이해

GitHub Pages에서 특정 레포를 배포하면 URL 구조가 아래와 같음:

```
https://{username}.github.io/{repo-name}/
```

이 프로젝트의 경우:
```
https://codercollie.github.io/Claude_ChineseCharacter/
```

즉, 앱은 **루트(`/`)가 아닌 서브디렉토리(`/Claude_ChineseCharacter/`)** 에 위치함.

### 버그가 있던 코드

**`manifest.json` (수정 전)**
```json
{
  "start_url": "/",
  ...
}
```

`start_url: "/"` 는 `https://codercollie.github.io/` 를 의미함.  
아이폰이 이 값을 그대로 읽어 홈 화면 바로가기 URL로 등록해버린 것.

**`sw.js` (수정 전)**
```js
const CACHE = 'hanja-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  ...
];
```

Service Worker의 캐시 경로도 전부 루트(`/`) 기준이라 실제 파일을 찾지 못함.

---

## 3. 수정 내용

### `manifest.json` — `start_url` + `scope` 추가

```json
{
  "start_url": "/Claude_ChineseCharacter/",
  "scope": "/Claude_ChineseCharacter/",
  ...
}
```

| 필드 | 역할 |
|------|------|
| `start_url` | 홈 화면 아이콘을 탭했을 때 열리는 URL |
| `scope` | PWA가 제어하는 URL 범위. 이 범위를 벗어나면 일반 브라우저로 열림 |

**`scope`를 왜 추가해야 하나?**  
`scope` 없이 `start_url`만 바꾸면 Safari가 URL 범위를 제대로 인식 못해  
앱 내에서 링크 이동 시 standalone 모드가 해제될 수 있음.  
`scope`를 명시하면 해당 경로 내에서는 항상 앱 모드로 유지.

### `sw.js` — 캐시 경로 전부 수정 + 캐시 버전 업

```js
const CACHE = 'hanja-v2';  // v1 → v2로 올림
const ASSETS = [
  '/Claude_ChineseCharacter/',
  '/Claude_ChineseCharacter/index.html',
  '/Claude_ChineseCharacter/css/style.css',
  '/Claude_ChineseCharacter/js/data.js',
  '/Claude_ChineseCharacter/js/sm2.js',
  '/Claude_ChineseCharacter/js/app.js',
  '/Claude_ChineseCharacter/manifest.json'
];
```

**캐시 버전을 올린 이유**  
Service Worker는 한 번 설치되면 브라우저에 남아 있음.  
이미 `hanja-v1`을 캐시한 기기에서는 구버전 파일을 계속 서빙함.  
`CACHE` 이름을 `hanja-v2`로 바꾸면 `activate` 이벤트에서 `hanja-v1`을 자동 삭제하고  
새 경로로 다시 캐시를 채움.

```js
// sw.js의 activate 이벤트가 이 역할을 함
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});
```

---

## 4. 핵심 개념 정리

### PWA `manifest.json` 주요 필드

| 필드 | 설명 | 예시 |
|------|------|------|
| `start_url` | 앱 실행 시 첫 화면 URL | `"/Claude_ChineseCharacter/"` |
| `scope` | PWA가 제어하는 경로 범위 | `"/Claude_ChineseCharacter/"` |
| `display` | UI 모드 | `"standalone"` (주소창 숨김) |
| `short_name` | 홈 화면 아이콘 아래 표시 이름 | `"漢字카드"` |

### GitHub Pages 배포 시 항상 주의할 점

GitHub Pages의 **레포 페이지** (user.github.io/repo) 배포는  
루트(`/`)가 아닌 서브디렉토리에 배포됨.  
따라서 PWA 설정의 모든 절대 경로는 `/repo-name/`을 포함해야 함.

```
❌ start_url: "/"
✅ start_url: "/Claude_ChineseCharacter/"

❌ '/index.html'
✅ '/Claude_ChineseCharacter/index.html'
```

단, `manifest.json`의 아이콘 경로처럼 **상대 경로**(`"icons/icon-192.png"`)는  
`manifest.json` 위치 기준으로 해석되므로 그대로 둬도 됨.

### Service Worker 캐시 업데이트 흐름

```
1. 새 sw.js push
2. 기기가 사이트 접속 → 브라우저가 sw.js 변경 감지
3. 새 Service Worker install (새 캐시 'hanja-v2' 생성)
4. 기존 Service Worker 종료 후 activate
5. activate에서 'hanja-v1' 삭제
6. 이후 모든 요청은 새 캐시로 서빙
```

---

## 5. 수정 후 아이폰 홈 화면 추가 방법

1. Safari에서 `https://codercollie.github.io/Claude_ChineseCharacter/` 접속
2. 하단 **공유 버튼** (네모+화살표 아이콘) 탭
3. **홈 화면에 추가** 선택
4. 이름 확인 후 **추가**
5. 홈 화면에 `漢字카드` 아이콘 생성 → 탭하면 주소창 없이 앱처럼 실행
