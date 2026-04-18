'use strict';

const App = (() => {
  const NEW_PER_SESSION = 20;
  const LEVELS = [8, 7, 6, 5, 4, 3, 2, 1];

  let state = {
    screen: 'home',
    selectedLevels: [8, 7, 6, 5, 4, 3],
    queue: [],
    queueIndex: 0,
    flipped: false,
    sessionCorrect: 0,
    sessionTotal: 0,
  };

  function el(id) { return document.getElementById(id); }
  function qs(sel) { return document.querySelector(sel); }

  // ── Render ─────────────────────────────────────────────────────────────────

  function render() {
    const app = el('app');
    if (state.screen === 'home') app.innerHTML = renderHome();
    else if (state.screen === 'study') app.innerHTML = renderStudy();
    else app.innerHTML = renderDone();
    bindEvents();
  }

  function renderHome() {
    const stats = SM2.getStats();
    const filtered = getByLevels(state.selectedLevels);
    const due = SM2.getDueCards(filtered).length;
    const newAvail = SM2.getNewCards(filtered).length;

    const levelBtns = LEVELS.map(lv => {
      const sel = state.selectedLevels.includes(lv);
      const count = HANJA_DATA.filter(h => h.level === lv).length;
      return `<button class="lv-btn${sel ? ' selected' : ''}" data-lv="${lv}">
        ${LEVEL_LABELS[lv]}<span class="lv-count">${count}</span>
      </button>`;
    }).join('');

    const sessionSize = due + Math.min(newAvail, NEW_PER_SESSION);

    return `
    <div class="screen home-screen">
      <h1 class="app-title">漢字 카드</h1>
      <section class="level-section">
        <p class="section-label">급수 선택</p>
        <div class="level-grid">${levelBtns}</div>
      </section>
      <section class="stats-section">
        <div class="stat-box"><span class="stat-num">${due}</span><span class="stat-label">복습</span></div>
        <div class="stat-box"><span class="stat-num">${Math.min(newAvail, NEW_PER_SESSION)}</span><span class="stat-label">신규</span></div>
        <div class="stat-box"><span class="stat-num">${stats.total}</span><span class="stat-label">전체학습</span></div>
      </section>
      <button class="btn-primary" id="btn-start" ${sessionSize === 0 ? 'disabled' : ''}>
        ${sessionSize === 0 ? '학습 완료 ✓' : `학습 시작 (${sessionSize}장)`}
      </button>
    </div>`;
  }

  function renderStudy() {
    const card = state.queue[state.queueIndex];
    const total = state.queue.length;
    const current = state.queueIndex + 1;
    const pct = Math.round((state.queueIndex / total) * 100);
    const cardState = SM2.loadState()[card.id];
    const isNew = !cardState;

    return `
    <div class="screen study-screen">
      <div class="study-header">
        <button class="btn-icon" id="btn-home">✕</button>
        <div class="progress-wrap">
          <div class="progress-bar" style="width:${pct}%"></div>
        </div>
        <span class="progress-text">${current}/${total}</span>
      </div>
      <div class="card-area">
        <div class="card${state.flipped ? ' flipped' : ''}" id="card">
          <div class="card-front">
            ${isNew ? '<span class="badge-new">NEW</span>' : ''}
            <div class="hanja-char">${card.char}</div>
            <p class="card-hint">탭하여 확인</p>
          </div>
          <div class="card-back">
            <div class="hanja-char">${card.char}</div>
            <div class="eumhun">${card.eumhun}</div>
            <div class="card-level">${LEVEL_LABELS[card.level]}</div>
          </div>
        </div>
      </div>
      <div class="action-row${state.flipped ? ' visible' : ''}">
        <button class="btn-wrong" id="btn-wrong">몰랐다 ✗</button>
        <button class="btn-right" id="btn-right">알았다 ✓</button>
      </div>
    </div>`;
  }

  function renderDone() {
    const pct = state.sessionTotal > 0
      ? Math.round((state.sessionCorrect / state.sessionTotal) * 100) : 0;
    return `
    <div class="screen done-screen">
      <div class="done-icon">${pct >= 70 ? '🎉' : '📚'}</div>
      <h2>오늘 학습 완료!</h2>
      <div class="done-stats">
        <div class="stat-box"><span class="stat-num">${state.sessionTotal}</span><span class="stat-label">학습</span></div>
        <div class="stat-box"><span class="stat-num">${state.sessionCorrect}</span><span class="stat-label">정답</span></div>
        <div class="stat-box"><span class="stat-num">${pct}%</span><span class="stat-label">정답률</span></div>
      </div>
      <button class="btn-primary" id="btn-again">다시 학습</button>
      <button class="btn-secondary" id="btn-home-done">홈으로</button>
    </div>`;
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  function bindEvents() {
    if (state.screen === 'home') {
      document.querySelectorAll('.lv-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const lv = parseInt(btn.dataset.lv);
          if (state.selectedLevels.includes(lv)) {
            if (state.selectedLevels.length > 1)
              state.selectedLevels = state.selectedLevels.filter(l => l !== lv);
          } else {
            state.selectedLevels = [...state.selectedLevels, lv];
          }
          render();
        });
      });
      const btnStart = el('btn-start');
      if (btnStart) btnStart.addEventListener('click', startSession);
    }

    if (state.screen === 'study') {
      el('card').addEventListener('click', () => {
        if (!state.flipped) { state.flipped = true; render(); }
      });
      el('btn-home').addEventListener('click', () => {
        state.screen = 'home'; render();
      });
      const btnRight = el('btn-right');
      const btnWrong = el('btn-wrong');
      if (btnRight) btnRight.addEventListener('click', () => answer(true));
      if (btnWrong) btnWrong.addEventListener('click', () => answer(false));
    }

    if (state.screen === 'done') {
      el('btn-again').addEventListener('click', startSession);
      el('btn-home-done').addEventListener('click', () => { state.screen = 'home'; render(); });
    }
  }

  // ── Logic ──────────────────────────────────────────────────────────────────

  function startSession() {
    const filtered = getByLevels(state.selectedLevels);
    const due = SM2.getDueCards(filtered);
    const newCards = SM2.getNewCards(filtered).slice(0, NEW_PER_SESSION);
    const queue = shuffle([...due, ...newCards]);

    if (queue.length === 0) { render(); return; }

    state.screen = 'study';
    state.queue = queue;
    state.queueIndex = 0;
    state.flipped = false;
    state.sessionCorrect = 0;
    state.sessionTotal = 0;
    render();
  }

  function answer(correct) {
    const card = state.queue[state.queueIndex];
    SM2.review(card.id, correct ? 4 : 1);
    state.sessionTotal++;
    if (correct) state.sessionCorrect++;

    state.queueIndex++;
    state.flipped = false;

    if (state.queueIndex >= state.queue.length) {
      state.screen = 'done';
    }
    render();
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
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
