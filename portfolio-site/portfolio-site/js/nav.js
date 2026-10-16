/**
 * nav.js - marks the menu item of the section currently in view (aria-current).
 *
 * Görgetéskor mindig újraszámolja az aktív elemet (nem csak szekcióba lépéskor), így az oldal
 * tetejére visszagörgetve a „Kezdőlap”, az oldal alján pedig az utolsó menüpont lesz aktív.
 * Menüpontra kattintva a kattintott elem aktív marad az animált görgetés végéig (nem ugrál
 * végig a köztes szekciókon), a görgetés megállása után pedig újraszámolódik a valós állapot.
 */
(function () {
  'use strict';

  const links = [...document.querySelectorAll('nav a[href^="#"]')];
  const targets = links
    .map((link) => ({ link, el: document.getElementById(link.getAttribute('href').slice(1)) }))
    .filter((t) => t.el);
  if (!targets.length) return;

  // A „Kezdőlap” (main) az alapértelmezett: az oldal teteje, az első szekció előtt.
  const home = targets.find((t) => t.el.tagName === 'MAIN') || targets[0];
  const sections = targets.filter((t) => t !== home);

  let current = null;
  let ticking = false;
  let locked = null;       // a kattintott menüpont, amíg tart a görgetés
  let idleTimer = 0;

  function setActive(target) {
    if (target === current) return;
    current = target;
    links.forEach((link) => {
      if (link === target.link) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function release() {
    locked = null;
    update();
  }

  function update() {
    ticking = false;

    if (locked) {                                       // kattintás utáni görgetés: a cél marad aktív
      setActive(locked);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(release, 150);             // 150 ms mozgás nélkül → vége a görgetésnek
      return;
    }
    const line = window.innerHeight * 0.45;            // a képernyő felső 45%-ánál húzott vonal
    let active = home;
    let bestTop = -Infinity;

    sections.forEach((t) => {
      const top = t.el.getBoundingClientRect().top;
      if (top <= line && top > bestTop) { bestTop = top; active = t; }   // a vonalat legutóbb átlépő szekció
    });

    // az oldal legalján az utolsó szekció akkor is aktív, ha rövid és nem éri el a vonalat
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom && sections.length) active = sections[sections.length - 1];

    setActive(active);
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  links.forEach((link) => {
    link.addEventListener('click', () => {
      const t = targets.find((x) => x.link === link);
      if (!t) return;
      locked = t;
      setActive(t);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(release, 300);             // ha nem indul görgetés (már ott vagyunk), feloldjuk
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', update);
  update();
})();
