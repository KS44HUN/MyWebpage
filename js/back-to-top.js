(() => {
  'use strict';
  const button = document.getElementById('back-to-top');
  if (!button) return;
  const update = () => { button.hidden = window.scrollY < 300; };
  const updateLanguage = () => {
    const en = document.documentElement.lang.toLowerCase().startsWith('en');
    const label = en ? 'Back to top' : 'Vissza az oldal tetejére';
    button.setAttribute('aria-label', label);
    button.title = label;
  };
  button.addEventListener('click', () => {
    window.scrollTo({top: 0, left: 0, behavior: 'instant'});
  });
  window.addEventListener('scroll', update, {passive: true});
  window.addEventListener('langchange', updateLanguage);
  updateLanguage();
  update();
})();
