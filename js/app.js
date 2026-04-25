'use strict';

const APP_VERSION = 'v5.7';

const App = (() => {
  const NEW_PER_SESSION = 10;
  const DUE_PER_SESSION = 10;
  const LEVELS = [8, 7, 6, 5, 4, 3, 2, 1];

  // 레벨별 인덱스 — 앱 로드 시 1회만 생성
  const HANJA_BY_LEVEL = {};
  for (const h of HANJA_DATA) {
    (HANJA_BY_LEVEL[h.level] = HANJA_BY_LEVEL[h.level] || []).push(h);
  }

  let state = {
    screen: 'home',
    queue: [],
    queueIndex: 0,
    choices: null,
    answered: null,
    quizDir: null,
    introduced: false,
    sessionCorrect: 0,
    sessionTotal: 0,
    sessionWrong: [],
    // 단어 퀴즈
    wqQueue: [],
    wqIndex: 0,
    wqAnswered: null,
    wqCorrect: 0,
    wqTotal: 0,
    wqWrong: [],
    newVersionAvailable: false,
    swRegistration: null,
    isDarkMode: localStorage.getItem('hanja_dark_mode') === 'true'
  };

  function el(id) { return document.getElementById(id); }

  // ── Render ─────────────────────────────────────────────────────────────────

  function render() {
    const app = el('app');
    document.body.classList.toggle('dark-theme', state.isDarkMode);

    if (state.screen === 'home') app.innerHTML = renderHome();
    else if (state.screen === 'study') app.innerHTML = renderStudy();
    else if (state.screen === 'history') app.innerHTML = renderHistory();
    else if (state.screen === 'word-quiz') app.innerHTML = renderWordQuiz();
    else if (state.screen === 'word-done') app.innerHTML = renderWordDone();
    else app.innerHTML = renderDone();
    bindEvents();
  }

  function renderHome() {
    const smState = SM2.loadState();
    const t = new Date().toISOString().split('T')[0];
    let statsTotal = 0, statsDue = 0;
    for (const id in smState) {
      statsTotal++;
      if (smState[id].dueDate <= t) statsDue++;
    }
    const due = statsDue;
    const newAvail = HANJA_DATA.filter(h => !smState[h.id]).length;
    const streak = SM2.getStreak();
    const bestStreak = SM2.getBestStreak();
    const isNewRecord = streak > 0 && streak === bestStreak;
    const dailyStats = SM2.getDailyStats();
    const recentHistory = SM2.getRecentHistory(5);
    const maxCount = Math.max(...recentHistory.map(d => d.count), 1);

    const SESSION_SIZE = 10;
    const dueCount = Math.min(due, SESSION_SIZE);
    const newCount = Math.min(newAvail, SESSION_SIZE - dueCount);
    const sessionSize = dueCount + newCount;

    let greetingText, subGreetingText;
    if (streak >= 3) {
      greetingText = `🔥 ${streak}일 연속 학습 중!`;
      subGreetingText = isNewRecord ? '새 최고 기록이에요! 계속 달려요 🏆' : `최고 기록까지 ${bestStreak - streak}일 남았어요!`;
    } else if (streak === 2) {
      greetingText = '이틀 연속이에요! 💪';
      subGreetingText = '내일도 하면 🔥 스트릭 시작!';
    } else if (streak === 1) {
      greetingText = '오늘 학습 완료! 😊';
      subGreetingText = '내일도 이어가면 연속 학습 스트릭이 시작돼요!';
    } else {
      greetingText = '안녕하세요! 😊';
      subGreetingText = bestStreak > 0 ? `이전 최고 기록: ${bestStreak}일 연속 — 다시 도전해봐요!` : '오늘도 한자 공부를 시작해볼까요?';
    }

    return `
    <div class="screen home-screen">
      <div class="title-row">
        <div class="app-logo-group">
          <svg class="app-logo-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <h1 class="app-title">漢字 카드</h1>
        </div>
        <div class="title-actions">
          ${streak > 0 ? `<span class="streak-badge">🔥 ${streak}일 연속${isNewRecord ? ' 🏆' : ''}</span>` : ''}
          <button class="btn-icon-small" id="btn-toggle-dark" title="다크모드">${state.isDarkMode ? '☀️' : '🌙'}</button>
          <button class="btn-icon-small" id="btn-settings" title="설정">⚙️</button>
          <button class="btn-guide" id="btn-guide">?</button>
        </div>
      </div>

      <section class="welcome-section">
        <p class="greeting">${greetingText}</p>
        <p class="sub-greeting">${subGreetingText}</p>
        ${dailyStats.today > 0 ? `<p class="quiz-today-count">오늘 <strong>${dailyStats.today}문제</strong> 풀었어요 · 누적 <strong>${dailyStats.total}문제</strong></p>` : ''}
      </section>



      ${recentHistory.some(d => d.count > 0) ? `
      <section class="daily-chart-section">
        <p class="section-label">최근 5일 학습량</p>
        <div class="daily-chart">
          ${recentHistory.map(d => `
            <div class="chart-col">
              <span class="chart-num">${d.count > 0 ? d.count : ''}</span>
              <div class="chart-bar-wrap">
                <div class="chart-bar${d.label === '오늘' ? ' chart-bar-today' : ''}" style="height:${Math.max(d.count > 0 ? 4 : 0, Math.round(d.count / maxCount * 100))}%"></div>
              </div>
              <span class="chart-label${d.label === '오늘' ? ' chart-label-today' : ''}">${d.label}</span>
            </div>
          `).join('')}
        </div>
      </section>` : ''}

      <button class="btn-primary" id="btn-start-all" ${sessionSize === 0 ? 'disabled' : ''}>
        ${sessionSize === 0 ? '오늘의 학습 완료 ✓' : `학습 시작 (${sessionSize}장)`}
      </button>
      <button class="btn-secondary btn-word-quiz" id="btn-word-quiz" ${statsTotal < 10 ? 'disabled' : ''}>
        📝 단어 퀴즈${statsTotal < 10 ? ` (${statsTotal}/10 학습 필요)` : ''}
      </button>
      <button class="btn-secondary" id="btn-history">학습 기록 보기 →</button>

      <div class="home-footer">
        <span class="version-badge clickable" id="btn-version" title="강제 업데이트">${APP_VERSION} (force update)</span>
      </div>

      ${state.newVersionAvailable ? `
        <div class="update-banner">
          <span>새로운 버전이 있습니다!</span>
          <button id="btn-update">업데이트</button>
        </div>
      ` : ''}
    </div>

    <!-- 설정 모달 -->
    <div class="modal-overlay hidden" id="settings-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>설정 및 데이터 관리</h2>
          <button class="btn-icon" id="btn-close-settings">✕</button>
        </div>
        <div class="modal-body">
          <section class="guide-section">
            <h3>데이터 백업/복원</h3>
            <p class="guide-note">사파리 브라우저와 홈 화면 앱(PWA)은 저장소가 다릅니다. 아래 기능을 이용해 데이터를 옮겨보세요.</p>
            <div class="setting-actions">
              <button class="btn-secondary" id="btn-export">내보내기 (Backup)</button>
              <button class="btn-secondary" id="btn-import">불러오기 (Restore)</button>
              <input type="file" id="file-input" style="display:none" accept=".json">
            </div>
          </section>
          <section class="guide-section">
            <h3>초기화</h3>
            <button class="btn-wrong" id="btn-reset" style="width:100%">모든 학습 기록 삭제</button>
          </section>
        </div>
      </div>
    </div>

    <!-- 도움말 모달 -->
    <div class="modal-overlay hidden" id="guide-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>학습 방법 안내</h2>
          <button class="btn-icon" id="btn-close-guide">✕</button>
        </div>
        <div class="modal-body">
          <section class="guide-section">
            <h3>기본 사용법</h3>
            <ol>
              <li><strong>학습 시작</strong>을 누르면 쉬운 급수(8급)부터 순서대로 학습이 진행돼요</li>
              <li>한자 카드가 나오면 4개의 보기 중 맞는 음훈을 선택하세요</li>
              <li>정답이면 초록색, 오답이면 빨간색으로 피드백이 표시돼요</li>
            </ol>
          </section>
          <section class="guide-section">
            <h3>SM-2 간격반복이란?</h3>
            <p>과학적으로 검증된 암기 방법으로, Anki 앱이 사용하는 알고리즘이에요. 기억이 사라지기 직전에 복습시켜 장기 기억으로 전환해줘요.</p>
          </section>
          <section class="guide-section">
            <h3>복습 간격 스케줄</h3>
            <table class="guide-table">
              <thead><tr><th>회차</th><th>결과</th><th>다음 복습</th></tr></thead>
              <tbody>
                <tr><td>1회</td><td class="right">정답</td><td>1일 후</td></tr>
                <tr><td>2회</td><td class="right">정답</td><td>6일 후</td></tr>
                <tr><td>3회</td><td class="right">정답</td><td>~15일 후</td></tr>
                <tr><td>4회</td><td class="right">정답</td><td>~38일 후</td></tr>
                <tr><td>언제든</td><td class="wrong">오답</td><td>내일 (초기화)</td></tr>
              </tbody>
            </table>
            <p class="guide-note">정답을 맞출수록 간격이 점점 길어져요. 틀리면 다시 1일부터 시작해요.</p>
          </section>
          <section class="guide-section">
            <h3>매일 학습 루틴</h3>
            <ul>
              <li>앱을 열면 <strong>복습</strong> 대상이 먼저 나오고, 부족하면 <strong>신규</strong> 한자로 채워져 항상 10장이 준비돼요</li>
              <li>매일 꾸준히 하면 기억에 오래 남아요</li>
              <li>쉬운 한자부터 마스터하면 다음 급수 한자가 자동으로 등장해요</li>
            </ul>
          </section>
        </div>
      </div>
    </div>`;
  }

  function renderStudy() {
    const card = state.queue[state.queueIndex];
    const total = state.queue.length;
    const current = state.queueIndex + 1;
    const pct = Math.round((state.queueIndex / total) * 100);
    const isNew = !SM2.loadState()[card.id];

    const header = `
      <div class="study-header">
        <button class="btn-icon" id="btn-home">✕</button>
        <div class="progress-wrap">
          <div class="progress-bar" style="width:${pct}%"></div>
        </div>
        <span class="progress-text">${current}/${total}</span>
      </div>`;

    // 신규 카드 + 아직 소개 안 됨 → 소개 화면
    if (isNew && !state.introduced) {
      const busuHtml = card.busu && card.busu !== '확인중'
        ? `<div class="intro-meta-row"><span class="intro-meta-label">부수</span><span>${card.busu}</span></div>` : '';
      const wordsHtml = card.words && card.words.length
        ? `<div class="intro-meta-row"><span class="intro-meta-label">단어</span><span>${card.words.join('  ')}</span></div>` : '';
      const similarHtml = card.similar && card.similar.length
        ? `<div class="intro-meta-row"><span class="intro-meta-label">유의자</span><span>${card.similar.join('  ')}</span></div>` : '';
      return `
      <div class="screen study-screen">
        ${header}
        <div class="card-area">
          <div class="card-simple card-intro">
            <span class="badge-new">NEW</span>
            <div class="hanja-char">${card.char}</div>
            <div class="eumhun" style="margin-top:12px">${card.eumhun}</div>
            <div class="card-level" style="margin-top:6px">${LEVEL_LABELS[card.level]}</div>
            <div class="intro-meta">
              ${busuHtml}${wordsHtml}${similarHtml}
            </div>
          </div>
        </div>
        <div class="study-footer study-footer--intro">
          <button class="btn-primary btn-intro-next" id="btn-intro-next">확인했어요 →</button>
        </div>
      </div>`;
    }

    // 보기와 방향이 없으면 생성
    if (!state.choices) state.choices = generateChoices(card);
    if (!state.quizDir) state.quizDir = Math.random() < 0.5 ? 'char2eumhun' : 'eumhun2char';
    const choices = state.choices;
    const answered = state.answered;
    const dir = state.quizDir;

    const choiceBtns = choices.map((c, i) => {
      let cls = 'choice-btn';
      if (answered) {
        if (c.id === card.id) cls += ' choice-correct';
        else if (c.id === answered) cls += ' choice-wrong';
        else cls += ' choice-disabled';
      }
      const label = dir === 'char2eumhun' ? c.eumhun : `<span class="choice-char">${c.char}</span>`;
      return `<button class="${cls}" data-idx="${i}">${label}</button>`;
    }).join('');

    const acc = SM2.getAccuracy(card.id);
    const accBadge = acc
      ? `<span class="badge-acc ${acc.pct < 50 ? 'badge-acc-low' : acc.pct < 80 ? 'badge-acc-mid' : 'badge-acc-high'}">${acc.pct}% (${acc.correct}/${acc.total})</span>`
      : '';

    const cardBody = dir === 'char2eumhun'
      ? `${isNew ? '<span class="badge-new">NEW</span>' : ''}${accBadge}
         <div class="hanja-char">${card.char}</div>
         <div class="card-level">${LEVEL_LABELS[card.level]}</div>`
      : `${isNew ? '<span class="badge-new">NEW</span>' : ''}${accBadge}
         <div class="card-hint" style="font-size:.8rem;margin-bottom:8px">${LEVEL_LABELS[card.level]}</div>
         <div class="eumhun" style="font-size:1.8rem;font-weight:800">${card.eumhun}</div>
         <div class="card-hint" style="margin-top:12px">한자를 고르세요</div>`;

    return `
    <div class="screen study-screen">
      ${header}
      <div class="card-area">
        <div class="card-simple">
          ${cardBody}
        </div>
      </div>
      <div class="study-footer">
        <div class="choice-grid">
          ${choiceBtns}
        </div>
      </div>
    </div>`;
  }

  function renderHistory() {
    const smState = SM2.loadState();
    const accState = SM2.loadAccuracy();
    const studied = HANJA_DATA.filter(h => smState[h.id]);

    const progressRows = LEVELS.map(lv => {
      const cards = HANJA_BY_LEVEL[lv] || [];
      const total = cards.length;
      const learned = cards.filter(h => smState[h.id]).length;
      const pct = total > 0 ? Math.round(learned / total * 100) : 0;
      return `<div class="lv-prog-row">
        <span class="lv-prog-label">${LEVEL_LABELS[lv]}</span>
        <div class="lv-prog-track"><div class="lv-prog-fill" style="width:${pct}%"></div></div>
        <span class="lv-prog-num">${learned}/${total}</span>
      </div>`;
    }).join('');

    function accPct(h) {
      const r = accState[h.id];
      return r && r.t > 0 ? r.c / r.t : 1;
    }

    const strong = studied.filter(h => smState[h.id].repetition >= 2).sort((a, b) => accPct(a) - accPct(b));
    const weak = studied.filter(h => smState[h.id].repetition === 0 || smState[h.id].efactor < 2.0).sort((a, b) => accPct(a) - accPct(b));
    const learning = studied.filter(h => {
      const s = smState[h.id];
      return s.repetition === 1 && s.efactor >= 2.0;
    }).sort((a, b) => accPct(a) - accPct(b));

    function cardChip(h, type) {
      const s = smState[h.id];
      const r = accState[h.id];
      const accText = r && r.t > 0 ? `${Math.round(r.c / r.t * 100)}%` : '';
      return `<div class="hist-chip hist-${type}" title="${h.eumhun} | 다음복습: ${s.dueDate}">
        <span class="hist-char">${h.char}</span>
        <span class="hist-eumhun">${h.eumhun}</span>
        ${accText ? `<span class="hist-acc">${accText}</span>` : ''}
      </div>`;
    }

    function section(title, icon, items, type, emptyMsg) {
      return `<section class="hist-section">
        <h3 class="hist-title">${icon} ${title} <span class="hist-count">${items.length}</span></h3>
        ${items.length === 0
          ? `<p class="hist-empty">${emptyMsg}</p>`
          : `<div class="hist-grid">${items.map(h => cardChip(h, type)).join('')}</div>`
        }
      </section>`;
    }

    return `
    <div class="screen history-screen">
      <div class="study-header">
        <button class="btn-icon" id="btn-back">←</button>
        <span class="history-title">학습 기록</span>
        <span class="progress-text">${studied.length}장</span>
      </div>
      <div class="hist-body">
        <section class="hist-section">
          <h3 class="hist-title">📊 급수별 진행률</h3>
          <div class="progress-list">${progressRows}</div>
        </section>
        ${section('잘 아는 한자', '💪', strong, 'strong', '아직 없어요. 정답을 꾸준히 맞춰보세요!')}
        ${section('학습 중', '📖', learning, 'learning', '없어요.')}
        ${section('헷갈리는 한자', '🔄', weak, 'weak', '없어요. 모두 잘 외우고 있어요!')}
      </div>
    </div>`;
  }

  function renderDone() {
    const pct = state.sessionTotal > 0
      ? Math.round((state.sessionCorrect / state.sessionTotal) * 100) : 0;
    const wrongCount = state.sessionWrong.length;
    return `
    <div class="screen done-screen">
      <div class="done-icon">${pct >= 70 ? '🎉' : '📚'}</div>
      <h2>세션 완료!</h2>
      <div class="done-stats">
        <div class="stat-box"><span class="stat-num">${state.sessionTotal}</span><span class="stat-label">학습</span></div>
        <div class="stat-box"><span class="stat-num">${state.sessionCorrect}</span><span class="stat-label">정답</span></div>
        <div class="stat-box"><span class="stat-num">${pct}%</span><span class="stat-label">정답률</span></div>
      </div>
      ${wrongCount > 0 ? `<button class="btn-retry" id="btn-retry">틀린 카드만 다시 (${wrongCount}장)</button>` : ''}
      <button class="btn-primary" id="btn-again">새 학습 시작</button>
      <button class="btn-home-done" id="btn-home-done">홈으로</button>
    </div>`;
  }

  function renderWordQuiz() {
    const item = state.wqQueue[state.wqIndex];
    const total = state.wqQueue.length;
    const pct = Math.round((state.wqIndex / total) * 100);
    const answered = state.wqAnswered;

    const hanjaDisplay = item.hiddenIdx === 0
      ? `<span class="wq-blank">?</span><span class="wq-char">${item.revealed}</span>`
      : `<span class="wq-char">${item.revealed}</span><span class="wq-blank">?</span>`;

    const choiceBtns = item.choices.map((ch, i) => {
      let cls = 'choice-btn';
      if (answered) {
        if (ch === item.correct) cls += ' choice-correct';
        else if (ch === answered) cls += ' choice-wrong';
        else cls += ' choice-disabled';
      }
      return `<button class="${cls}" data-wq-idx="${i}"><span class="choice-char">${ch}</span></button>`;
    }).join('');

    return `
    <div class="screen study-screen">
      <div class="study-header">
        <button class="btn-icon" id="btn-wq-home">✕</button>
        <div class="progress-wrap">
          <div class="progress-bar" style="width:${pct}%"></div>
        </div>
        <span class="progress-text">${state.wqIndex + 1}/${total}</span>
      </div>
      <div class="card-area">
        <div class="card-simple wq-card">
          <div class="wq-label">단어 완성</div>
          <div class="wq-kor">${item.korReading}</div>
          <div class="wq-hanja">${hanjaDisplay}</div>
        </div>
      </div>
      <div class="study-footer">
        <div class="choice-grid">${choiceBtns}</div>
      </div>
    </div>`;
  }

  function renderWordDone() {
    const pct = state.wqTotal > 0 ? Math.round(state.wqCorrect / state.wqTotal * 100) : 0;
    return `
    <div class="screen done-screen">
      <div class="done-icon">${pct >= 70 ? '🎉' : '📝'}</div>
      <h2>단어 퀴즈 완료!</h2>
      <div class="done-stats">
        <div class="stat-box"><span class="stat-num">${state.wqTotal}</span><span class="stat-label">문제</span></div>
        <div class="stat-box"><span class="stat-num">${state.wqCorrect}</span><span class="stat-label">정답</span></div>
        <div class="stat-box"><span class="stat-num">${pct}%</span><span class="stat-label">정답률</span></div>
      </div>
      ${state.wqWrong.length > 0 ? `<button class="btn-retry" id="btn-wq-retry">틀린 문제 다시 풀기 (${state.wqWrong.length}개)</button>` : ''}
      <button class="btn-primary btn-again" id="btn-wq-again">단어 퀴즈 다시</button>
      <button class="btn-home-done" id="btn-wq-home-done">홈으로</button>
    </div>`;
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  function bindEvents() {
    if (state.screen === 'home') {
      el('btn-start-all').addEventListener('click', () => startSession());

      el('btn-guide').addEventListener('click', () => { el('guide-overlay').classList.remove('hidden'); });
      el('btn-close-guide').addEventListener('click', () => { el('guide-overlay').classList.add('hidden'); });

      el('btn-settings').addEventListener('click', () => { el('settings-overlay').classList.remove('hidden'); });
      el('btn-close-settings').addEventListener('click', () => { el('settings-overlay').classList.add('hidden'); });

      el('btn-history').addEventListener('click', () => { state.screen = 'history'; render(); });

      el('btn-toggle-dark').addEventListener('click', () => {
        state.isDarkMode = !state.isDarkMode;
        localStorage.setItem('hanja_dark_mode', state.isDarkMode);
        render();
      });

      if (el('btn-update')) {
        el('btn-update').addEventListener('click', () => {
          if (state.swRegistration && state.swRegistration.waiting) {
            state.swRegistration.waiting.postMessage('skipWaiting');
          }
        });
      }

      el('btn-version').addEventListener('click', () => {
        if (confirm('최신 버전으로 강제 업데이트할까요?\n(캐시를 삭제하고 페이지를 새로고침합니다)')) {
          forceUpdate();
        }
      });

      el('btn-export').addEventListener('click', exportData);
      el('btn-import').addEventListener('click', () => el('file-input').click());
      el('file-input').addEventListener('change', importData);
      el('btn-reset').addEventListener('click', () => {
        if (confirm('모든 학습 데이터를 초기화하시겠습니까? 복구할 수 없습니다.')) {
          SM2.resetAll();
          location.reload();
        }
      });
    }

    if (state.screen === 'history') {
      el('btn-back').addEventListener('click', () => { state.screen = 'home'; render(); });

      let touchStartX = 0, touchStartY = 0;
      const histScreen = document.querySelector('.history-screen');
      histScreen.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });
      histScreen.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
        if (dx > 60 && dy < 80) { state.screen = 'home'; render(); }
      }, { passive: true });
    }

    if (state.screen === 'study') {
      el('btn-home').addEventListener('click', () => { state.screen = 'home'; render(); });

      if (el('btn-intro-next')) {
        el('btn-intro-next').addEventListener('click', () => {
          const card = state.queue[state.queueIndex];
          SM2.introduce(card.id);
          state.queueIndex++;
          state.choices = null;
          state.answered = null;
          state.quizDir = null;
          state.introduced = false;
          if (state.queueIndex >= state.queue.length) {
            state.screen = 'done';
            SM2.recordStreak();
          }
          render();
        });
      }

      // 미답 상태일 때만 보기 클릭 허용
      if (!state.answered) {
        document.querySelectorAll('.choice-btn').forEach((btn, i) => {
          btn.addEventListener('click', () => {
            const selected = state.choices[i];
            answer(selected);
          });
        });
      }
    }

    if (state.screen === 'done') {
      if (el('btn-retry')) el('btn-retry').addEventListener('click', retryWrong);
      el('btn-again').addEventListener('click', () => startSession());
      el('btn-home-done').addEventListener('click', () => { state.screen = 'home'; render(); });
    }

    if (state.screen === 'word-quiz') {
      el('btn-wq-home').addEventListener('click', () => { state.screen = 'home'; render(); });
      if (!state.wqAnswered) {
        document.querySelectorAll('[data-wq-idx]').forEach((btn, i) => {
          btn.addEventListener('click', () => answerWordQuiz(state.wqQueue[state.wqIndex].choices[i]));
        });
      }
    }

    if (state.screen === 'word-done') {
      if (el('btn-wq-retry')) {
        el('btn-wq-retry').addEventListener('click', () => {
          state.wqQueue = shuffle([...state.wqWrong]);
          state.wqIndex = 0;
          state.wqAnswered = null;
          state.wqCorrect = 0;
          state.wqTotal = 0;
          state.wqWrong = [];
          state.screen = 'word-quiz';
          render();
        });
      }
      el('btn-wq-again').addEventListener('click', startWordQuiz);
      el('btn-wq-home-done').addEventListener('click', () => { state.screen = 'home'; render(); });
    }

    if (state.screen === 'home' && el('btn-word-quiz') && !el('btn-word-quiz').disabled) {
      el('btn-word-quiz').addEventListener('click', startWordQuiz);
    }
  }

  // ── Logic ──────────────────────────────────────────────────────────────────

  function generateChoices(currentCard) {
    // 같은 급수 우선, 부족하면 다른 급수로 보충
    const sameLevel = shuffle((HANJA_BY_LEVEL[currentCard.level] || []).filter(h => h.id !== currentCard.id));
    const distractors = sameLevel.slice(0, 3);
    if (distractors.length < 3) {
      const others = shuffle(HANJA_DATA.filter(h => h.id !== currentCard.id && h.level !== currentCard.level));
      distractors.push(...others.slice(0, 3 - distractors.length));
    }
    return shuffle([currentCard, ...distractors]);
  }

  async function forceUpdate() {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let r of registrations) await r.unregister();
    }
    const cacheNames = await caches.keys();
    for (let c of cacheNames) await caches.delete(c);
    // 쿼리스트링으로 브라우저 캐시도 우회
    window.location.href = window.location.pathname + '?v=' + Date.now();
  }

  function exportData() {
    const data = {
      sm2: localStorage.getItem('hanja_sm2_state'),
      streak: localStorage.getItem('hanja_streak')
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hanja_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.sm2) localStorage.setItem('hanja_sm2_state', data.sm2);
        if (data.streak) localStorage.setItem('hanja_streak', data.streak);
        alert('데이터 복원이 완료되었습니다!');
        location.reload();
      } catch {
        alert('잘못된 파일 형식입니다.');
      }
    };
    reader.readAsText(file);
  }

  function startSession(mode = 'all') {
    let queue = [];

    if (mode === 'weak') {
      queue = shuffle(SM2.getWeakCards(HANJA_DATA).slice(0, 20));
    } else {
      const SESSION_SIZE = 10;
      const t = new Date().toISOString().split('T')[0];
      const smState = SM2.loadState();
      const acc = SM2.loadAccuracy();

      function isWeak(id) {
        const a = acc[id];
        return a && a.t > 0 && (a.c / a.t) < 0.5;
      }

      const introduced = HANJA_DATA.filter(h => smState[h.id]);
      // ① 복습 대상 중 정답률 50% 미만
      const dueWeak   = shuffle(introduced.filter(h => smState[h.id].dueDate <= t &&  isWeak(h.id)));
      // ② 아직 복습일이 안 됐지만 정답률 50% 미만 (앞당겨 출제)
      const earlyWeak = shuffle(introduced.filter(h => smState[h.id].dueDate >  t &&  isWeak(h.id)));
      // ③ 복습 대상 중 정답률 50% 이상
      const dueNormal =         introduced.filter(h => smState[h.id].dueDate <= t && !isWeak(h.id));

      const hasWeak = dueWeak.length + earlyWeak.length > 0;

      // 우선순위: ①→②→③, 약한 카드가 남아있으면 신규 없음
      queue = [...dueWeak, ...earlyWeak, ...dueNormal].slice(0, SESSION_SIZE);

      if (queue.length < SESSION_SIZE && !hasWeak) {
        // 약한 카드가 없을 때만 신규 카드 투입 (8급→1급 순서)
        for (const lv of LEVELS) {
          if (queue.length >= SESSION_SIZE) break;
          const pool = (HANJA_BY_LEVEL[lv] || []).filter(h => !smState[h.id]);
          queue.push(...shuffle(pool).slice(0, SESSION_SIZE - queue.length));
        }
      }
    }

    if (queue.length === 0) { render(); return; }

    state.screen = 'study';
    state.queue = queue;
    state.queueIndex = 0;
    state.choices = null;
    state.answered = null;
    state.quizDir = null;
    state.introduced = false;
    state.sessionCorrect = 0;
    state.sessionTotal = 0;
    state.sessionWrong = [];
    render();
  }

  function answer(selectedCard) {
    const card = state.queue[state.queueIndex];
    const correct = selectedCard.id === card.id;

    state.answered = selectedCard.id;
    render(); // 피드백 표시

    setTimeout(() => {
      SM2.review(card.id, correct ? 4 : 1);
      SM2.recordAccuracy(card.id, correct);
      SM2.recordDailyQuiz();
      state.sessionTotal++;
      if (correct) state.sessionCorrect++;
      else state.sessionWrong.push(card);

      state.queueIndex++;
      state.choices = null;
      state.answered = null;
      state.quizDir = null;
      state.introduced = false;

      if (state.queueIndex >= state.queue.length) {
        state.screen = 'done';
        SM2.recordStreak();
      }
      render();
    }, correct ? 300 : 600);
  }

  function retryWrong() {
    const wrong = state.sessionWrong;
    state.screen = 'study';
    state.queue = shuffle([...wrong]);
    state.queueIndex = 0;
    state.choices = null;
    state.answered = null;
    state.quizDir = null;
    state.introduced = false;
    state.sessionCorrect = 0;
    state.sessionTotal = 0;
    state.sessionWrong = [];
    render();
  }

  function buildWordQuizQueue() {
    const smState = SM2.loadState();
    const learnedMap = {};
    for (const h of HANJA_DATA) {
      if (smState[h.id]) learnedMap[h.char] = h;
    }

    const seen = new Set();
    const items = [];

    for (const card of HANJA_DATA) {
      if (!smState[card.id]) continue;
      for (const w of (card.words || [])) {
        const match = w.match(/^(.+)\(([^)]+)\)$/);
        if (!match) continue;
        const korReading = match[1].trim();
        const hanja = match[2];
        if (hanja.length !== 2) continue;
        if (!learnedMap[hanja[0]] || !learnedMap[hanja[1]]) continue;
        if (seen.has(hanja)) continue;
        seen.add(hanja);

        const hiddenIdx = Math.random() < 0.5 ? 0 : 1;
        const correct = hanja[hiddenIdx];
        const revealed = hanja[1 - hiddenIdx];

        // 같은 급수 우선 오답 생성
        const correctCard = learnedMap[correct];
        const pool = Object.values(learnedMap).filter(h => h.char !== correct && h.char !== revealed);
        const sameLevel = shuffle(pool.filter(h => h.level === correctCard.level)).slice(0, 3).map(h => h.char);
        const distractors = [...sameLevel];
        if (distractors.length < 3) {
          const others = shuffle(pool.filter(h => h.level !== correctCard.level)).slice(0, 3 - distractors.length).map(h => h.char);
          distractors.push(...others);
        }

        items.push({ word: w, hanja, hiddenIdx, correct, revealed, korReading, choices: shuffle([correct, ...distractors]) });
      }
    }

    return shuffle(items).slice(0, 10);
  }

  function startWordQuiz() {
    const queue = buildWordQuizQueue();
    if (queue.length === 0) {
      alert('학습한 단어가 부족합니다. 더 많은 한자를 학습한 후 이용해주세요.');
      return;
    }
    state.screen = 'word-quiz';
    state.wqQueue = queue;
    state.wqIndex = 0;
    state.wqAnswered = null;
    state.wqCorrect = 0;
    state.wqTotal = 0;
    state.wqWrong = [];
    render();
  }

  function answerWordQuiz(selectedChar) {
    const item = state.wqQueue[state.wqIndex];
    const correct = selectedChar === item.correct;
    state.wqAnswered = selectedChar;
    render();
    setTimeout(() => {
      state.wqTotal++;
      if (correct) state.wqCorrect++;
      else state.wqWrong.push(item);
      SM2.recordDailyQuiz();
      state.wqIndex++;
      state.wqAnswered = null;
      if (state.wqIndex >= state.wqQueue.length) state.screen = 'word-done';
      render();
    }, correct ? 300 : 600);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function init() {
    render();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').then(reg => {
        state.swRegistration = reg;
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              state.newVersionAvailable = true;
              render();
            }
          });
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) { window.location.reload(); refreshing = true; }
      });
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
