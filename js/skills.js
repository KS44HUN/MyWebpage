/**
 * skills.js - skill tiles: tap / Enter opens the level overlay, Escape closes it.
 * (Hover and keyboard focus are handled in CSS.)
 */
(function () {
  'use strict';

  const openTiles = () => document.querySelectorAll('.logos li.open');

  document.querySelectorAll('button.sk').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.parentElement;
      const wasOpen = item.classList.contains('open');
      openTiles().forEach((x) => x.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      openTiles().forEach((x) => x.classList.remove('open'));
      document.body.classList.add('noh'); // hides the hover overlay until the pointer moves
    }
  });

  ['pointermove', 'focusin'].forEach((type) =>
    document.addEventListener(type, () => document.body.classList.remove('noh'), { passive: true })
  );
})();
