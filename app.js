/* Hue&You AI - app.js: jeden jazyk naraz, porovnanie fotiek, prieskumník sezón.
   Nikam nič neposiela. Voľba jazyka ostáva len v tomto prehliadači (localStorage). */
(function () {
  var LANGS = ['sk', 'en', 'de', 'es', 'uk', 'fr', 'it', 'pt-BR', 'pl', 'cs'];
  var NAMES = { sk: 'Slovenčina', en: 'English', de: 'Deutsch', es: 'Español', uk: 'Українська', fr: 'Français', it: 'Italiano', 'pt-BR': 'Português (Brasil)', pl: 'Polski', cs: 'Čeština' };
  var FACE = { en: 'face-data', sk: 'udaje-tvare', de: 'gesichtsdaten', es: 'datos-faciales', uk: 'dani-oblychchia', fr: 'donnees-visage', it: 'dati-volto', 'pt-BR': 'dados-rosto', pl: 'dane-twarzy', cs: 'udaje-o-obliceji' };
  var PRIVACY = { en: 'privacy-policy', sk: 'zasady', de: 'datenschutz', es: 'privacidad', uk: 'konfidentsiinist', fr: 'confidentialite', it: 'privacy-it', 'pt-BR': 'privacidade', pl: 'prywatnosc', cs: 'ochrana-soukromi' };
  var SUPPORT = { sk: 'podpora', en: 'support', de: 'hilfe', es: 'soporte', uk: 'pidtrymka', fr: 'aide', it: 'supporto', 'pt-BR': 'suporte', pl: 'pomoc', cs: 'podpora-cs' };
  var KEY = 'hy-lang';
  var root = document.documentElement;

  function norm(code) {
    if (!code) return null;
    var c = String(code).toLowerCase();
    if (c.indexOf('pt') === 0) return 'pt-BR';
    c = c.slice(0, 2);
    return LANGS.indexOf(c) >= 0 ? c : null;
  }
  function stored(v) {
    try {
      if (v === undefined) return localStorage.getItem(KEY);
      localStorage.setItem(KEY, v);
    } catch (e) { return null; }
  }
  function detect() {
    var q = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
    var l = norm(q) || norm(stored());
    if (l) return l;
    var list = navigator.languages || [navigator.language];
    for (var i = 0; i < list.length; i++) { l = norm(list[i]); if (l) return l; }
    return 'en';
  }
  function fillSelect(sel, lang) {
    if (!sel.options.length) {
      LANGS.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c; o.textContent = NAMES[c]; o.lang = c;
        sel.appendChild(o);
      });
    }
    sel.value = lang;
  }
  function ready() { root.classList.remove('pending'); }

  /* ---------- podstránky: súkromie a podpora ---------- */
  var blocks = [].slice.call(document.querySelectorAll('.lang-block'));
  if (blocks.length) {
    var back = document.querySelector('a.back');
    var bar = document.createElement('div');
    bar.className = 'subbar';
    back.parentNode.insertBefore(bar, back);
    bar.appendChild(back);
    var sel = document.createElement('select');
    sel.className = 'lang-select';
    sel.setAttribute('aria-label', 'Language');
    bar.appendChild(sel);

    var blockFor = function (lang) {
      return blocks.filter(function (b) { return b.lang === lang; })[0] || blocks[0];
    };
    var show = function (b) {
      blocks.forEach(function (x) { x.classList.toggle('active', x === b); });
      root.lang = b.lang;
      fillSelect(sel, b.lang);
      back.href = 'index.html?lang=' + encodeURIComponent(b.lang);
      var h = b.querySelector('h1');
      if (h) document.title = h.textContent + ' · Hue&You AI';
    };
    var fromHash = function () {
      if (!location.hash) return null;
      var t = null;
      try { t = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
      return t && t.closest ? { el: t, block: t.closest('.lang-block') } : null;
    };
    var go = function () {
      var hit = fromHash();
      if (hit && hit.block) {
        show(hit.block);
        hit.el.scrollIntoView();
        return true;
      }
      return false;
    };
    if (!go()) show(blockFor(detect()));
    window.addEventListener('hashchange', go);
    sel.addEventListener('change', function () {
      stored(sel.value);
      var b = blockFor(sel.value);
      show(b);
      var h = b.querySelector('h1');
      if (h && history.replaceState) history.replaceState(null, '', '#' + h.id);
      window.scrollTo(0, 0);
    });
    ready();
    return;
  }

  /* ---------- hlavná stránka ---------- */
  var DATA = window.HY_I18N;
  if (!DATA) { ready(); return; }
  var current = 'en';

  function t(k) {
    var d = DATA[current] || {};
    return d[k] !== undefined ? d[k] : DATA.en[k];
  }
  function apply(lang) {
    current = lang;
    root.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) { el.alt = t(el.getAttribute('data-i18n-alt')); });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    document.querySelectorAll('[data-i18n-content]').forEach(function (el) { el.setAttribute('content', t(el.getAttribute('data-i18n-content'))); });
    document.querySelectorAll('[data-c]').forEach(function (el) {
      var c = (DATA[lang] && DATA[lang].c) || DATA.en.c;
      el.textContent = c[el.getAttribute('data-c')] || DATA.en.c[el.getAttribute('data-c')] || el.textContent;
    });
    document.querySelectorAll('[data-doc]').forEach(function (a) {
      var kind = a.getAttribute('data-doc');
      a.href = kind === 'face' ? 'privacy.html#' + FACE[lang] : kind === 'privacy' ? 'privacy.html#' + PRIVACY[lang] : 'support.html#' + SUPPORT[lang];
    });
    var shotLang = lang === 'sk' || lang === 'cs' ? 'sk' : 'en';
    document.querySelectorAll('img[data-shot]').forEach(function (img) {
      img.src = 'img/shots/' + shotLang + '-' + img.getAttribute('data-shot') + '.webp';
    });
    var can = document.querySelector('link[rel="canonical"]');
    if (can) can.href = 'https://dzanino.github.io/HueAndYou/index.html?lang=' + encodeURIComponent(lang);
    document.querySelectorAll('[data-lang-select]').forEach(function (s) { fillSelect(s, lang); });
  }

  var start = detect();
  apply(start);
  ready();

  document.querySelectorAll('[data-lang-select]').forEach(function (s) {
    s.addEventListener('change', function () {
      stored(s.value);
      apply(s.value);
      if (history.replaceState) history.replaceState(null, '', '?lang=' + encodeURIComponent(s.value) + location.hash);
    });
  });

  /* Porovnanie pôvodnej fotky a skúšky */
  var ba = document.getElementById('ba');
  var range = document.getElementById('ba-range');
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touched = false;
  function setPos(p) {
    p = Math.max(0, Math.min(100, p));
    ba.style.setProperty('--pos', p + '%');
    range.value = Math.round(p);
  }
  function fromPointer(e) {
    var r = ba.getBoundingClientRect();
    setPos((e.clientX - r.left) / r.width * 100);
  }
  ba.addEventListener('pointerdown', function (e) {
    touched = true;
    fromPointer(e);
    try { ba.setPointerCapture(e.pointerId); } catch (x) {}
    ba.dataset.drag = '1';
  });
  ba.addEventListener('pointermove', function (e) { if (ba.dataset.drag) fromPointer(e); });
  ['pointerup', 'pointercancel'].forEach(function (n) { ba.addEventListener(n, function () { delete ba.dataset.drag; }); });
  range.addEventListener('input', function () { touched = true; setPos(+range.value); });

  if (!calm) {
    setTimeout(function () {
      var t0 = null, dur = 2600;
      function step(ts) {
        if (touched) return;
        if (t0 === null) t0 = ts;
        var k = (ts - t0) / dur;
        if (k >= 1) { setPos(50); return; }
        setPos(50 + Math.sin(k * Math.PI * 2) * 24);
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, 900);
  }

  var src = document.getElementById('ba-src');
  var img = document.getElementById('ba-img');
  document.querySelectorAll('.look').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.look').forEach(function (x) {
        var on = x === b;
        x.classList.toggle('on', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var n = b.getAttribute('data-look');
      src.srcset = 'img/look-' + n + '.webp';
      img.src = 'img/look-' + n + '.jpg';
      img.setAttribute('data-i18n-alt', b.getAttribute('data-alt'));
      img.alt = t(b.getAttribute('data-alt'));
      touched = true;
    });
  });
  window.addEventListener('load', function () {
    ['chocolate', 'copper'].forEach(function (n) { (new Image()).src = 'img/look-' + n + '.webp'; });
  });

  /* Prieskumník sezón */
  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  function pick(tab, focus) {
    tabs.forEach(function (x) {
      var on = x === tab;
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (x, i) {
    x.addEventListener('click', function () { pick(x); });
    x.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); pick(tabs[(i + d + tabs.length) % tabs.length], true); }
      if (e.key === 'Home') { e.preventDefault(); pick(tabs[0], true); }
      if (e.key === 'End') { e.preventDefault(); pick(tabs[tabs.length - 1], true); }
    });
  });
  if (tabs.length) pick(tabs[0]);

  /* Objavenie sekcií */
  var rev = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !calm) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rev.forEach(function (r) { io.observe(r); });
  } else {
    rev.forEach(function (r) { r.classList.add('in'); });
  }
})();
