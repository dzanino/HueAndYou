/* dzanino.github.io/HueAndYou — site.js
   Anonymous visit counter: no cookies, no identifiers, nothing stored about the visitor.
   A visit = first page opened in a browser tab session (sessionStorage), not every page view.
   Bots and headless browsers are not counted. Owner can exclude own device in the panel.
   Hidden panel: click "©" in the footer three times quickly. */
(function () {
  var API = 'https://abacus.jasoncameron.dev';
  var NS = 'hue-gh-6p9t';
  var START = '2026-10-04';              // first counted day (Europe/Bratislava)

  function day(offset) {
    var d = new Date(Date.now() - (offset || 0) * 86400000);
    try {
      return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Bratislava' }).format(d);
    } catch (e) {
      return d.toISOString().slice(0, 10);
    }
  }
  function key(ymd) { return 'd' + ymd.replace(/-/g, ''); }
  function store(kind, k, v) {
    try {
      var s = kind === 'l' ? window.localStorage : window.sessionStorage;
      if (v === undefined) return s.getItem(k);
      if (v === null) s.removeItem(k); else s.setItem(k, v);
    } catch (e) { return null; }
  }

  // ---- count the visit ----
  var ua = navigator.userAgent || '';
  var isBot = navigator.webdriver || /bot|crawl|spider|slurp|preview|lighthouse|headless|pingdom|monitor/i.test(ua);
  if (location.protocol === 'https:' && !isBot && store('l', 'hy-own') !== '1' && !store('s', 'hy-v')) {
    store('s', 'hy-v', '1');
    var opt = { mode: 'cors', keepalive: true, credentials: 'omit' };
    fetch(API + '/hit/' + NS + '/tot', opt).catch(function () {});
    fetch(API + '/hit/' + NS + '/' + key(day(0)), opt).catch(function () {});
  }

  // ---- hidden panel ----
  function get(k) {
    return fetch(API + '/get/' + NS + '/' + k, { mode: 'cors', credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : { value: 0 }; })
      .then(function (j) { return j && j.value > 0 ? j.value : 0; })
      .catch(function () { return null; });
  }
  function fmt(n) { return n === null ? '–' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  var panel = null;
  function close() { if (panel) { panel.remove(); panel = null; } }

  function open() {
    if (panel) return close();
    if (store('l', 'hy-own') === null) store('l', 'hy-own', '1'); // first open: stop counting this device
    panel = document.createElement('div');
    panel.setAttribute('role', 'dialog');
    panel.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:9999;max-width:320px;width:calc(100% - 32px);' +
      'background:#14263a;color:#eaf1f8;border-radius:14px;padding:16px 18px;font:14px/1.5 -apple-system,Helvetica,Arial,sans-serif;' +
      'box-shadow:0 18px 44px rgba(0,0,0,.35)';
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<b style="font-size:15px;color:#fff">Návštevnosť Hue&You AI</b>' +
        '<button type="button" aria-label="Zavrieť" style="background:none;border:0;color:#fecee7;font-size:20px;cursor:pointer;line-height:1">×</button>' +
      '</div>' +
      '<div data-x="body" style="color:#e6dcf0">Načítavam…</div>' +
      '<label style="display:flex;gap:8px;align-items:flex-start;margin-top:10px;font-size:12.5px;color:#c9b6db;cursor:pointer">' +
        '<input type="checkbox" style="margin-top:3px"> Nepočítať návštevy z tohto zariadenia</label>';
    document.body.appendChild(panel);
    panel.querySelector('button').onclick = close;
    var cb = panel.querySelector('input');
    cb.checked = store('l', 'hy-own') === '1';
    cb.onchange = function () { store('l', 'hy-own', cb.checked ? '1' : '0'); };

    var keys = ['tot'];
    for (var i = 0; i < 7; i++) keys.push(key(day(i)));
    Promise.all(keys.map(get)).then(function (v) {
      var total = v[0];
      var days = Math.max(1, Math.floor((Date.parse(day(0)) - Date.parse(START)) / 86400000) + 1);
      var week = v.slice(1).reduce(function (a, b) { return a + (b || 0); }, 0);
      var avg = total === null ? null : (total / days).toFixed(1).replace('.', ',');
      var since = START.split('-').reverse().map(Number).join('. ');
      if (!panel) return;
      panel.querySelector('[data-x="body"]').innerHTML =
        '<div style="display:grid;grid-template-columns:1fr auto;gap:2px 12px">' +
          '<span>Celkom</span><b style="color:#fff">' + fmt(total) + '</b>' +
          '<span>Denný priemer</span><b style="color:#fff">' + (avg === null ? '–' : avg) + '</b>' +
          '<span>Dnes</span><b style="color:#fff">' + fmt(v[1]) + '</b>' +
          '<span>Včera</span><b style="color:#fff">' + fmt(v[2]) + '</b>' +
          '<span>Posledných 7 dní</span><b style="color:#fff">' + fmt(week) + '</b>' +
        '</div>' +
        '<div style="margin-top:8px;font-size:12px;color:#c9b6db">Počíta sa od ' + since + ' (' + days + (days === 1 ? ' deň' : days < 5 ? ' dni' : ' dní') +
        '). Návšteva = prvé otvorenie webu v okne prehliadača; roboty sa nepočítajú.</div>';
    });
  }

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  var clicks = 0, timer = null;
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-fz]') : null;
    if (!t) return;
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(function () { clicks = 0; }, 1200);
    if (clicks >= 3) { clicks = 0; open(); }
  });
})();
