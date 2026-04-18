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
    return state[id] || { interval: 0, repetition: 0, efactor: DEFAULT_EFACTOR, dueDate: null };
  }

  function today() {
    return new Date().toISOString().split('T')[0];
  }

  // quality: 4 = 알았다, 1 = 몰랐다
  function review(id, quality) {
    const state = loadState();
    let card = getCard(state, id);
    let { interval, repetition, efactor } = card;

    if (quality >= 3) {
      if (repetition === 0) interval = 1;
      else if (repetition === 1) interval = 6;
      else interval = Math.round(interval * efactor);
      repetition++;
    } else {
      interval = 1;
      repetition = 0;
    }

    efactor = Math.max(1.3, efactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    const due = new Date();
    due.setDate(due.getDate() + interval);
    const dueDate = due.toISOString().split('T')[0];

    state[id] = { interval, repetition, efactor, dueDate };
    saveState(state);
    return state[id];
  }

  function isDue(id) {
    const state = loadState();
    const card = getCard(state, id);
    if (!card.dueDate) return true; // new card
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
    return hanjaList.filter(h => isDue(h.id));
  }

  function getNewCards(hanjaList) {
    return hanjaList.filter(h => isNew(h.id));
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { review, isDue, isNew, getDueCards, getNewCards, getStats, resetAll, loadState };
})();
