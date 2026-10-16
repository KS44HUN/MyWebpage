/**
 * lanyard.js - the ID badge swings when the page is scrolled.
 * A pendulum (th, w) moves the strap + clasp, a second spring (dl, dv) lets the
 * card lag behind. The result is written to CSS custom properties on #hang and
 * to the strap paths (see lanyard.css). Disabled for prefers-reduced-motion.
 */
(function () {
  'use strict';

  const root = document.getElementById('lanyard');
  const hang = document.getElementById('hang');
  const strap = root && root.querySelector('.strap');
  if (!root || !hang || !strap) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const paths = [...strap.querySelectorAll('path')];
  const L = 140;      // rope length (px)
  const OFFSET = 7;   // strap centre vs. card centre (px)
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  let th = 0, w = 0;      // pendulum angle (rad) and angular velocity
  let dl = 0, dv = 0;     // card lag angle and its velocity
  let last = 0, running = false, prevScroll = scrollY, width = 300;

  function resize() {
    width = root.clientWidth || 300;
    strap.setAttribute('viewBox', '0 0 ' + width + ' ' + L);
    strap.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    strap.classList.add('on');
  }

  function draw() {
    const s = Math.sin(th), c = Math.cos(th);
    const px = width / 2 + OFFSET + L * s, py = L * c, k = 60;
    paths.forEach((p) => {
      const ax = ((p.dataset.s === 'l' ? 0.22 : 0.78) * width).toFixed(1);
      p.setAttribute('d', 'M' + ax + ' 0C' + ax + ' ' + k + ' ' + (px - k * s).toFixed(1) + ' ' + (py - k * c).toFixed(1) + ' ' + px.toFixed(1) + ' ' + py.toFixed(1));
    });
    const style = hang.style;
    style.setProperty('--x', (L * s).toFixed(1) + 'px');
    style.setProperty('--y', (L * (c - 1)).toFixed(1) + 'px');
    style.setProperty('--r', (-th * 57.3).toFixed(2) + 'deg');
    style.setProperty('--d', (dl * 57.3).toFixed(2) + 'deg');
    style.setProperty('--ry', clamp(w * 9, -30, 30).toFixed(1) + 'deg');
    style.setProperty('--s', (th * 100).toFixed(1));
  }

  function tick(now) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    w += (-18 * Math.sin(th) - 2.2 * w) * dt;
    th = clamp(th + w * dt, -0.6, 0.6);
    dv += ((clamp(0.6 * th - 0.08 * w, -0.35, 0.35) - dl) * 45 - 5 * dv) * dt;
    dl = clamp(dl + dv * dt, -0.35, 0.35);
    draw();
    if (Math.abs(th) > 0.002 || Math.abs(w) > 0.01 || Math.abs(dl) > 0.002 || Math.abs(dv) > 0.01) {
      requestAnimationFrame(tick);
    } else {
      running = false;
      th = w = dl = dv = 0;
      draw();
    }
  }

  function kick(impulse) {
    if (reduceMotion.matches) return;
    w += impulse;
    if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(tick);
    }
  }

  addEventListener('scroll', () => {
    const delta = scrollY - prevScroll;
    prevScroll = scrollY;
    kick(clamp(delta * 0.012, -1.2, 1.2));
  }, { passive: true });
  addEventListener('resize', () => { resize(); draw(); });

  resize();
  draw();

  // Az oldal betöltése után azonnal elindítjuk a kezdő lendítést a szövegtől függetlenül
  setTimeout(() => kick(1.1), 600);
})();