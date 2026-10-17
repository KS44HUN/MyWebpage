/**
 * i18n.js - Hungarian / English switching.
 * The HTML is written in Hungarian; for English every text node and aria-label
 * is looked up in Portfolio.translations. The choice is saved in localStorage.
 * Other modules listen to the "langchange" event.
 */
(function (P) {
  'use strict';

  const DICT = P.translations.en;
  const LEVELS = P.translations.levels;
  const originalTitle = document.title;
  const originals = new WeakMap(); // text node -> original Hungarian text
  let lang = detectLanguage();
  let announcer = null;

  function detectLanguage() {
    try {
      const saved = localStorage.getItem('lang');
      if (saved) return saved;
    } catch (e) {}
    return (navigator.language || 'hu').toLowerCase().startsWith('hu') ? 'hu' : 'en';
  }

  // Texts with dynamic parts (name, numbers...) are handled with patterns.
  const PATTERNS = [
    [/^(.+) – Rendszergazda, full-stack tanuló$/, (m, a) => a + ' – Systems Administrator, Full-Stack Learner'],
    [/^(.+), kezdőlap$/, (m, a) => a + ', home'],
    [/^© (\d+) (.+)\. Minden jog fenntartva\.$/, (m, y, n) => '© ' + y + ' ' + n + '. All rights reserved.'],
    [/^, szint: (.+), (\d) az 5-ből$/, (m, l, n) => ', level: ' + (LEVELS[l] || l) + ', ' + n + ' out of 5'],
    [/^(.+) haladás$/, (m, a) => a + ' progress'],
    [/^Igazolás megtekintése: (.+)$/, (m, a) => 'View credential: ' + t(a)]
  ];

  /** Translates a string when English is active (leading/trailing spaces are kept). */
  function t(s) {
    if (lang !== 'en') return s;
    const key = s.trim();
    if (!key) return s;
    if (DICT[key]) return s.replace(key, () => DICT[key]);
    for (const [re, fn] of PATTERNS) {
      const m = key.match(re);
      if (m) return s.replace(key, () => fn(...m));
    }
    return s;
  }

  function translatePage() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentElement;
        const ok = p && !/^(SCRIPT|STYLE|NOSCRIPT|SVG)$/.test(p.tagName) && !p.closest('#tgl,[role=status]') && n.nodeValue.trim();
        return ok ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    let node;
    while ((node = walker.nextNode())) {
      if (!originals.has(node)) originals.set(node, node.nodeValue);
      const original = originals.get(node);
      node.nodeValue = lang === 'en' ? t(original) : original;
    }
    document.querySelectorAll('[aria-label],[title],[placeholder],[alt],[aria-description]').forEach((el) => {
      if (el.id === 'tgl') return; // the theme button is translated by theme.js
      ['aria-label', 'title', 'placeholder', 'alt', 'aria-description'].forEach((attr) => {
        const value = el.getAttribute(attr);
        if (value == null) return;
        const store = '_o' + attr;
        if (el[store] === undefined) el[store] = value;
        el.setAttribute(attr, lang === 'en' ? t(el[store]) : el[store]);
      });
    });
    document.title = lang === 'en' ? t(originalTitle) : originalTitle;
  }

  function setLang(next, byUser) {
    lang = next;
    const root = document.documentElement;
    root.lang = next;
    root.dataset.lang = next;
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === next)));
    translatePage();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: next } }));
    if (byUser) {
      try { localStorage.setItem('lang', next); } catch (e) {}
      announcer.textContent = next === 'en' ? 'Language changed to English' : 'A nyelv magyarra váltott';
    }
    dispatchEvent(new Event('scroll')); // lets the marquee recalculate its text length
  }

  /** Call once, after all other modules are loaded. */
  function init() {
    announcer = document.createElement('span');
    announcer.className = 'sr';
    announcer.setAttribute('role', 'status');
    document.body.appendChild(announcer);
    document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.l, true)));
    setLang(lang, false);
  }

  P.i18n = { t, setLang, init, get lang() { return lang; } };
})(window.Portfolio);
