/**
 * marquee.js - the curved text in the bridge section moves with the scroll position
 * (no autoplay: movement only follows the visitor's own scrolling).
 */
(function () {
  'use strict';

  const text = document.getElementById('mq');
  if (!text || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frame = 0;
  const period = () => text.getComputedTextLength() / 3 || 900; // the phrase is repeated 3 times

  function update() {
    frame = 0;
    text.setAttribute('startOffset', (-((scrollY * 0.5) % period())).toFixed(1));
  }

  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  update();
})();
