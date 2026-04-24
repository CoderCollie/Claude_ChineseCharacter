'use strict';

const SM2 = (() => {
  const STORAGE_KEY = 'hanja_sm2_state';
  const DEFAULT_EFACTOR = 2.5;

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getCard(state, id) {
    return state[id] || { interval: 0, repetition: 0, efactor: DEFAULT_EFACTOR, dueDate: null, lastReviewed: null };
  }

  function today() {
    return new Date().toISOString().split('T')[0];
  }

  // quality: 4 = 알았다, 1 = 몰랐다
  function review(id, quality) {
    const state = loadState();
    let card = getCard(state, id);
    let { interval, repetition, efactor, dueDate } = card;
    const alreadyToday = card.lastReviewed === today();

    if (quality >= 3) {
      if (!alreadyToday) {
        // 다른 날 정답: 정상 SM-2 진행
        if (repetition === 0) interval = 1;
        else if (repetition === 1) interval = 6;
        else interval = Math.round(interval * efactor);
        repetition++;
        const due = new Date();
        due.setDate(due.getDate() + interval);
        dueDate = due.toISOString().split('T')[0];
      }
      // 같은 날 재등장 + 정답: interval/repetition/dueDate 그대로 유지
    } else {
      // 오답: 날짜 무관하게 항상 리셋
      interval = 1;
      repetition = 0;
      const due = new Date();
      due.setDate(due.getDate() + 1);
      dueDate = due.toISOString().split('T')[0];
    }

    efactor = Math.max(1.3, efactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    state[id] = { interval, repetition, efactor, dueDate, lastReviewed: today() };
    saveState(state);
    return state[id];
  }

  function isDue(id) {
    const state = loadState();
    const card = state[id];
    if (!card) return false; // 신규 카드는 복습 대상이 아님
    return card.dueDate <= today();
  }

  function isNew(id) {
    const state = loadState();
    return !state[id];
  }

  function getStats() {
    const state = loadState();
    const t = today();
    let learned = 0, due = 0, total = 0;
    for (const id in state) {
      total++;
      if (state[id].dueDate === t) learned++;
      if (state[id].dueDate <= t) due++;
    }
    return { learned, due, total };
  }

  function getDueCards(hanjaList) {
    const state = loadState();
    const t = today();
    return hanjaList.filter(h => { const c = state[h.id]; return c && c.dueDate <= t; });
  }

  function getNewCards(hanjaList) {
    const state = loadState();
    return hanjaList.filter(h => !state[h.id]);
  }

  const ACC_KEY = 'hanja_accuracy';

  function loadAccuracy() {
    try { return JSON.parse(localStorage.getItem(ACC_KEY) || '{}'); } catch { return {}; }
  }

  function recordAccuracy(id, correct) {
    const acc = loadAccuracy();
    const r = acc[id] || { c: 0, t: 0 };
    r.t++;
    if (correct) r.c++;
    acc[id] = r;
    localStorage.setItem(ACC_KEY, JSON.stringify(acc));
  }

  function getAccuracy(id) {
    const acc = loadAccuracy();
    const r = acc[id];
    if (!r || r.t === 0) return null;
    return { correct: r.c, total: r.t, pct: Math.round(r.c / r.t * 100) };
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACC_KEY);
  }

  function recordStreak() {
    const t = today();
    let s;
    try { s = JSON.parse(localStorage.getItem('hanja_streak') || 'null'); } catch { s = null; }
    if (!s) s = { lastDate: null, count: 0, best: 0 };
    if (s.lastDate === t) return;
    const prev = new Date(); prev.setDate(prev.getDate() - 1);
    const yStr = prev.toISOString().split('T')[0];
    s.count = s.lastDate === yStr ? s.count + 1 : 1;
    s.lastDate = t;
    s.best = Math.max(s.best || 0, s.count);
    localStorage.setItem('hanja_streak', JSON.stringify(s));
  }

  function getStreak() {
    let s;
    try { s = JSON.parse(localStorage.getItem('hanja_streak') || 'null'); } catch { s = null; }
    if (!s) return 0;
    const prev = new Date(); prev.setDate(prev.getDate() - 1);
    const yStr = prev.toISOString().split('T')[0];
    return (s.lastDate === today() || s.lastDate === yStr) ? s.count : 0;
  }

  function getBestStreak() {
    let s;
    try { s = JSON.parse(localStorage.getItem('hanja_streak') || 'null'); } catch { s = null; }
    if (!s) return 0;
    return s.best || s.count || 0;
  }

  function getWeakCards(hanjaList) {
    const state = loadState();
    return hanjaList.filter(h => {
      const card = state[h.id];
      return card && (card.repetition === 0 || card.efactor < 2.0);
    });
  }

  function introduce(id) {
    const state = loadState();
    if (state[id]) return;
    state[id] = { interval: 1, repetition: 0, efactor: DEFAULT_EFACTOR, dueDate: today(), lastReviewed: null };
    saveState(state);
  }

  return { review, isDue, isNew, introduce, getDueCards, getNewCards, getWeakCards, getStats, resetAll, loadState, recordStreak, getStreak, getBestStreak, recordAccuracy, getAccuracy, loadAccuracy };
})();
