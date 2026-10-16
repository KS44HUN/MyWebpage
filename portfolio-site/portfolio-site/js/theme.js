/**
 * theme.js - light / dark theme toggle.
 * Follows the system setting until the visitor picks a theme; the choice is saved.
 */
(function (P) {
  'use strict';

  const root = document.documentElement;
  const button = document.getElementById('tgl');
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}

  const current = () => saved || (systemDark.matches ? 'dark' : 'light');

  function apply() {
    const theme = current();
    root.dataset.theme = theme;
    button.textContent = P.i18n.t(theme === 'dark' ? 'Világos mód' : 'Sötét mód');
    button.setAttribute('aria-label', P.i18n.t(theme === 'dark' ? 'Váltás világos módra' : 'Váltás sötét módra'));
  }

  button.addEventListener('click', () => {
    saved = current() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', saved); } catch (e) {}
    apply();
  });
  systemDark.addEventListener('change', () => { if (!saved) apply(); });
  document.addEventListener('langchange', apply);
  apply();
})(window.Portfolio);
