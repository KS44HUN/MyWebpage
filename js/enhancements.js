/* enhancements.js – az összes többi script UTÁN töltődik be */
(function () {
  'use strict';

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1) Írógép-effekt a főcímen ---------- */
  var h1 = document.querySelector('.hero h1');
  var tw = null; // futó animáció állapota

  function readHeroTexts() {
    var sp = [].slice.call(h1.children).filter(function (n) { return n.tagName === 'SPAN'; });
    return (sp.length ? sp : [h1]).map(function (t) { return t.textContent; });
  }

  // Az egybetűs szavakat (pl. „A”) nem törhető szóközzel kötjük a következő szóhoz,
  // így sosem maradnak egyedül a sor végén.
  function glue(str) { return str.replace(/(^| )(\S) (?=\S)/g, '$1$2\u00A0'); }

  function glueDom() {
    var sp = [].slice.call(h1.children).filter(function (n) { return n.tagName === 'SPAN'; });
    (sp.length ? sp : [h1]).forEach(function (t) {
      [].slice.call(t.childNodes).forEach(function (n) {
        if (n.nodeType === 3) n.data = glue(n.data);
      });
    });
  }

  // Mérési egységek: az első sor szavai, valamint a lebegő „a” + a következő szó együtt
  function heroUnits(texts) {
    var parts = [texts[0] || ''];
    if (texts.length > 1) parts.push(texts.slice(1).join('\u00A0'));
    return parts.join(' ').split(' ').filter(Boolean);
  }

  // A betűméretet úgy csökkentjük, hogy a leghosszabb szó is elférjen az oszlopban (szó közben ne törjön)
  function fitHero(texts) {
    if (!h1) return;
    if (!tw) h1.style.minHeight = '';
    h1.style.fontSize = '';
    var cs = getComputedStyle(h1);
    var avail = h1.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var base = parseFloat(cs.fontSize);
    if (!avail || !base) return;
    var probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;' +
                          'overflow-wrap:normal;word-break:normal;pointer-events:none';
    h1.appendChild(probe);
    var max = 0;
    heroUnits(texts).forEach(function (w) {
      probe.textContent = w;
      max = Math.max(max, probe.getBoundingClientRect().width);
    });
    probe.remove();
    if (max > avail) h1.style.fontSize = (base * avail / max * 0.97).toFixed(2) + 'px';
  }

  function finishTyping() {
    if (!tw) return;
    var s = tw; tw = null;
    clearTimeout(s.timer);
    s.targets.forEach(function (t, i) {
      t.textContent = s.texts[i];
      t.removeAttribute('aria-hidden');
    });
    s.targets[s.targets.length - 1].appendChild(s.caret);
    s.caret.classList.add('idle');
    h1.removeAttribute('aria-label');
    h1.classList.add('ks-ready');
  }

  function typeHero() {
    if (!h1) return;
    if (reduce) { glueDom(); fitHero(readHeroTexts()); h1.classList.add('ks-ready'); return; }

    glueDom();                       // előbb a végleges (összekötött) szöveggel mérünk, így a lefoglalt hely pontos
    var spans = [].slice.call(h1.children).filter(function (n) { return n.tagName === 'SPAN'; });
    var targets = spans.length ? spans : [h1];
    var texts = targets.map(function (t) { return t.textContent; });

    h1.style.minHeight = '';
    fitHero(texts);

    // a szöveg helyét lefoglaljuk, hogy a főcím alatti elemek ne mozduljanak gépelés közben és utána sem
    h1.style.minHeight = h1.offsetHeight + 'px';
    h1.setAttribute('aria-label', texts.join(' '));
    targets.forEach(function (t) { t.textContent = ''; t.setAttribute('aria-hidden', 'true'); });

    var caret = document.createElement('i');
    caret.className = 'ks-caret';
    caret.setAttribute('aria-hidden', 'true');

    tw = { targets: targets, texts: texts, caret: caret, timer: 0 };
    var state = tw;
    var line = 0, pos = 0, node = null;

    function nextLine() {
      var t = targets[line];
      node = document.createTextNode('');
      t.appendChild(node);
      t.appendChild(caret);
      pos = 0;
    }

    function step() {
      if (tw !== state) return;
      var full = texts[line];
      if (pos < full.length) {
        pos++;
        node.data = full.slice(0, pos);
        state.timer = setTimeout(step, 45 + Math.random() * 40);
      } else if (line < targets.length - 1) {
        line++;
        nextLine();
        state.timer = setTimeout(step, 260);
      } else {
        finishTyping();
      }
    }

    h1.classList.add('ks-ready');
    nextLine();
    state.timer = setTimeout(step, 350);
  }

  // nyelvváltás közben ne maradjon félbe a szöveg: előbb befejezzük, utána fut az i18n
  document.addEventListener('click', function (e) {
    if (tw && e.target.closest && e.target.closest('.lang')) finishTyping();
  }, true);

  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsReady.then(typeHero, typeHero);

  // vissza/előre gombbal (gyorsítótárból) visszatérve is újra lefut az animáció
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && h1) { finishTyping(); typeHero(); }
  });

  /* ---------- 2) Görgetésre mozgó címsorok ---------- */
  var heads = [].slice.call(document.querySelectorAll('main section h2:not(.sr)'));
  heads.forEach(function (h) { h.classList.add('ks-drift'); });
  var ticking = false;

  function update() {
    ticking = false;
    var vh = window.innerHeight, vw = window.innerWidth;
    var amp = Math.min(72, vw * 0.06);
    heads.forEach(function (h) {
      var r = h.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var d = (r.top + r.height / 2 - vh / 2) / (vh / 2);   // +1: lent, -1: fent
      d = Math.max(-1.2, Math.min(1.2, d));
      h.style.transform = 'translate3d(' + (d * amp).toFixed(1) + 'px,0,0)';
    });
    var copy = document.querySelector('.ks-hero-copy') || h1;
    if (copy) {                                             // a hero bal oldala lassabban halad, mint az oldal
      var y = Math.min(window.scrollY, vh);
      copy.style.transform = 'translate3d(0,' + (y * 0.14).toFixed(1) + 'px,0)';
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  if (!reduce) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- 3) Menüpontok és jobb oldali gombok fix szélessége (nyelv-/témaváltáskor se mozduljanak) ---------- */
  // A másik nyelv/állapot becsült felirata(i) – csak a szélesség lefoglalásához kellenek;
  // ha a tényleges felirat hosszabb, a szkript magától megnöveli a helyet.
  var altLabels = {
    '#main': 'Home', '#rolam': 'About me', '#skillek': 'Skills',
    '#projektek': 'Projects', '#tanusitvanyok': 'Certifications', '#kapcsolat': 'Contact',
    'tgl': ['Világos mód', 'Sötét mód', 'Light mode', 'Dark mode'],
    'cta': ['Lépj kapcsolatba', 'Get in touch']
  };
  var widths = {};

  function navActive() { return window.innerWidth >= 900; }

  function lockItems() {
    var list = [].slice.call(document.querySelectorAll('header nav ul a')).map(function (a) {
      return { el: a, key: a.getAttribute('href'), nav: true };
    });
    var t = document.getElementById('tgl');
    if (t) list.push({ el: t, key: 'tgl' });
    var c = document.querySelector('.tools a.pri');
    if (c) list.push({ el: c, key: 'cta' });
    return list;
  }

  // csak a szöveg szélessége (belső margó és keret nélkül)
  function textWidth(el, text) {
    var p = el.cloneNode(false);
    p.removeAttribute('id');
    p.removeAttribute('aria-current');
    p.textContent = text;
    p.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;min-width:0;padding:0;border:0;' +
                      'pointer-events:none;transition:none';
    el.parentNode.appendChild(p);
    var w = p.getBoundingClientRect().width;
    p.remove();
    return w;
  }

  // a szélesség-változás ne animálódjon: átmenet ki → módosítás → újraszámolás → átmenet vissza
  function noTransition(list, fn) {
    var saved = list.map(function (it) { return it.el.style.transition; });
    list.forEach(function (it) { it.el.style.transition = 'none'; });
    fn();
    void document.body.offsetWidth;
    list.forEach(function (it, i) { it.el.style.transition = saved[i]; });
  }

  function applyWidths(list) {
    list.forEach(function (it) {
      it.el.style.minWidth = navActive() && widths[it.key] ? widths[it.key] + 'px' : '';
    });
  }

  function lockNav() {
    var list = lockItems();
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    noTransition(list, function () {
      if (navActive()) {
        list.forEach(function (it) {
          var el = it.el;
          var cs = getComputedStyle(el);
          var pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) +
                    parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
          var texts = [el.textContent].concat(altLabels[it.key] || []);
          var tw = texts.reduce(function (m, t) { return Math.max(m, textWidth(el, t)); }, 0);
          var withDot = it.nav && it.key !== '#main';      // a „Kezdőlap”-nál nincs pötty
          var extra = withDot ? Math.max(pad, 2 * 1.2 * rem) : pad;   // a pöttynek is jusson hely a szöveg előtt
          widths[it.key] = Math.ceil(Math.max(tw + extra, widths[it.key] || 0));
          if (withDot) el.style.setProperty('--ks-tw', textWidth(el, el.textContent).toFixed(1) + 'px');
        });
      }
      applyWidths(list);
    });
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.lang, #tgl')) {   // i18n/téma után: szükség esetén bővít
      setTimeout(function () {
        lockNav();
        if (h1 && !tw && e.target.closest('.lang')) { glueDom(); fitHero(readHeroTexts()); }
      }, 60);
    }
  });
  window.addEventListener('resize', function () {
    widths = {}; lockNav();
    if (h1) fitHero(tw ? tw.texts : readHeroTexts());
  });
  fontsReady.then(lockNav, lockNav);

  /* ---------- 4) Menü: követ görgetéskor, de elrejtőzik, ha az egér nincs a közelében ---------- */
  var header = document.querySelector('header');
  if (header) {
    var coarse = window.matchMedia && matchMedia('(hover: none)').matches;   // érintőképernyő
    var hideTimer = 0, ptrY = -1, lastScroll = window.scrollY;

    var isSticky = function () {
      var pos = getComputedStyle(header).position;
      return pos === 'sticky' || pos === 'fixed';       // 1240 px alatt a header.css szerint nem sticky
    };
    var showHeader = function () { clearTimeout(hideTimer); header.classList.remove('ks-hide'); };
    var hideHeader = function () {
      if (!isSticky() || window.scrollY < 80 || header.matches(':focus-within')) return;
      header.classList.add('ks-hide');
    };
    var nearHeader = function () {
      var r = header.getBoundingClientRect();
      return ptrY >= 0 && ptrY <= Math.max(r.height, 72) + 8;
    };
    var evaluate = function () {
      clearTimeout(hideTimer);
      if (!isSticky() || window.scrollY < 80 || header.matches(':focus-within') || (!coarse && nearHeader())) {
        header.classList.remove('ks-hide');
      } else {
        hideTimer = setTimeout(hideHeader, 350);
      }
    };

    window.addEventListener('mousemove', function (e) { ptrY = e.clientY; if (!coarse) evaluate(); }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { ptrY = -1; evaluate(); });
    window.addEventListener('scroll', function () {
      var y = window.scrollY, dir = y - lastScroll;
      lastScroll = y;
      if (coarse && isSticky()) {                      // érintés: lefelé el, felfelé elő
        if (y < 80 || dir < -2) showHeader(); else if (dir > 4) hideHeader();
      } else {
        evaluate();
      }
    }, { passive: true });
    header.addEventListener('focusin', showHeader);   // billentyűzettel (Tab) is elérhető marad
    header.addEventListener('focusout', function () { setTimeout(evaluate, 0); });
    window.addEventListener('resize', evaluate);
    evaluate();
  }

})();
