/* =========================================================
   Prominance — homepage behaviour
   1. Hero: scale the 1326px stage to the viewport and pan between
      home / uPVC (left) / aluminium (right) on hover.
   2. Showcase carousel, accordion, lead form.
   ========================================================= */
(function () {
  'use strict';

  /* intro animation runs on every load (CSS keyed on html.intro), then the class is dropped */
  setTimeout(function () { document.documentElement.classList.remove('intro'); }, 3400);

  /* ------------------------------------------------------- HERO */
  var hero = document.getElementById('hero');
  var DESIGN_W = 1326, DESIGN_H = 823;
  var CAMERA_X = { home: 663, alu: 696, upvc: 630 };   // stage x kept centred when the viewport is narrower than the stage
  var state = 'home';

  // The whole stage always fits inside the viewport (nothing is cropped). On wide screens the
  // scene simply continues sideways: the panels and room photo extend beyond the 1326px design.
  //  · >=900px: scale = min(width, height) so the hero is the viewport height (or a touch shorter on squarer screens)
  //  · narrow / portrait: scale to the height and pan the camera with the state
  function layout() {
    var vw = hero.parentElement.clientWidth, vh = window.innerHeight;
    var k, h, ox = 0;
    if (vw >= 900) {
      k = Math.min(vw / DESIGN_W, vh / DESIGN_H);
      h = Math.min(vh, Math.ceil(DESIGN_H * k));
      ox = (vw - DESIGN_W * k) / 2;
    } else {
      k = Math.max(vw / DESIGN_W, vh / DESIGN_H);
      h = vh;
      ox = vw / 2 - CAMERA_X[state] * k;
      ox = Math.min(0, Math.max(ox, vw - DESIGN_W * k));
    }
    hero.style.height = Math.max(h, 420) + 'px';
    hero.style.setProperty('--k', k.toFixed(4));
    hero.style.setProperty('--ox', ox.toFixed(1) + 'px');
    hero.style.setProperty('--oy', '0px');
  }

  var textT;
  function setState(next) {
    if (next === state) return;
    state = next; lastChange = Date.now();
    hero.dataset.state = next;                 // images / panels move straight away…
    hero.classList.add('pan');
    layout();
    clearTimeout(setState.t);
    setState.t = setTimeout(function () { hero.classList.remove('pan'); }, 1100);
    // …text only fades: out first, re-placed while invisible, then back in
    hero.classList.add('txt-out');
    clearTimeout(textT);
    textT = setTimeout(function () {
      hero.dataset.text = next;
      requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.remove('txt-out'); }); });
    }, 430);
  }

  // Click-to-explore. While the pointer is over the hero (home state) a cursor tip says "Explore";
  // clicking the left half opens uPVC, the right half opens Aluminium. The logo goes back.
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  var tip = document.getElementById('tip');

  var PAGES = { alu: 'aluminium.html', upvc: 'upvc.html' };
  var lastChange = 0;

  hero.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || !canHover.matches) { hero.classList.remove('has-tip'); return; }
    tip.style.transform = 'translate(' + (e.clientX + 16) + 'px,' + (e.clientY + 16) + 'px)';
    var r = hero.getBoundingClientRect();
    var side = state !== 'home' ? state : (e.clientX - r.left >= r.width / 2 ? 'alu' : 'upvc');
    tip.classList.toggle('is-alu', side === 'alu');
    tip.classList.toggle('is-upvc', side === 'upvc');
    hero.classList.add('has-tip');
  }, { passive: true });
  hero.addEventListener('pointerleave', function () { hero.classList.remove('has-tip'); });

  // First click opens a side; once it is open a click anywhere in the hero continues to that system's page.
  hero.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go]');
    var recent = Date.now() - lastChange < 1200;          // ignore clicks while the pan is still running
    if (t) {
      var go = t.getAttribute('data-go');
      if (t.tagName === 'A' && state === go) { if (recent) e.preventDefault(); return; }   // open → follow the link
      if (t.tagName === 'A') e.preventDefault();
      setState(go);
    } else if (state === 'home') {
      var r = hero.getBoundingClientRect();
      setState(e.clientX - r.left < r.width / 2 ? 'upvc' : 'alu');
    } else if (!recent) {
      window.location.href = PAGES[state];
    }
    hero.classList.remove('has-tip');
  });

  document.querySelector('.nav__logo').addEventListener('click', function (e) {
    if (state !== 'home') { e.preventDefault(); setState('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });

  // Touch: tap the outer thirds to move, swipe left/right
  var sx = null;
  hero.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) setState(state === 'upvc' ? 'home' : 'alu');     // swipe left  → scene moves left
    else        setState(state === 'alu'  ? 'home' : 'upvc');    // swipe right → scene moves right
  }, { passive: true });

  window.addEventListener('resize', layout);
  if (window.ResizeObserver) new ResizeObserver(layout).observe(document.body);   // scrollbar appearing/disappearing
  layout();
  // allow QA / deep links:  index.html#state=alu
  var m = /state=(home|alu|upvc)/.exec(location.hash);
  if (m) { hero.style.setProperty('--dur', '1ms'); setState(m[1]); hero.dataset.text = m[1]; hero.classList.remove('txt-out'); clearTimeout(textT); requestAnimationFrame(function () { hero.style.removeProperty('--dur'); }); }

  /* ------------------------------------------------- SMOOTH SCROLL (Lenis) */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    // in-page links glide too
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a || a.hasAttribute('data-go')) return;
      var id = a.getAttribute('href');
      var el = id.length > 1 && document.querySelector(id);
      if (id === '#top') { e.preventDefault(); lenis.scrollTo(0); }
      else if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: 0 }); }
    });
  }

  /* ------------------------------------------------- NAVBAR + hero cover */
  var explore = document.querySelector('.explore');
  var readyT;
  function exploreProgress() {
    if (!explore) return;
    if (reduce) { explore.classList.add('is-ready'); return; }
    var r = explore.getBoundingClientRect(), total = Math.max(1, r.height - window.innerHeight);
    var t = Math.max(0, Math.min(1, -r.top / total));
    var sv = Math.max(0, Math.min(1, t / 0.5));                 // the picture zooms out / shrinks / blurs
    explore.style.setProperty('--s', sv.toFixed(3));
    if (sv >= 0.985) {                                          // once it has settled, all pointers pop together after a short beat
      if (!explore.classList.contains('is-ready') && !readyT) readyT = setTimeout(function () { explore.classList.add('is-ready'); readyT = null; }, 260);
    } else if (sv < 0.9) {
      clearTimeout(readyT); readyT = null; explore.classList.remove('is-ready');
    }
  }
  window.addEventListener('resize', exploreProgress);
  var nav = document.getElementById('nav'), lastY = window.scrollY, navTick = false;
  function navScroll() {
    var y = window.scrollY, dy = y - lastY;
    nav.classList.toggle('is-solid', y > 40);
    if (y < 80) nav.classList.remove('is-hidden');
    else if (dy > 6) nav.classList.add('is-hidden');
    else if (dy < -6) nav.classList.remove('is-hidden');
    if (Math.abs(dy) > 6 || y < 80) lastY = y;
    // the hero stays pinned; the next section slides over it, so dim / ease it back as it is covered
    var p = Math.max(0, Math.min(1, y / Math.max(1, hero.offsetHeight)));
    hero.style.setProperty('--p', p.toFixed(3));
    exploreProgress();
    navTick = false;
  }
  window.addEventListener('scroll', function () { if (!navTick) { navTick = true; requestAnimationFrame(navScroll); } }, { passive: true });
  navScroll();

  /* ------------------------------------------------- REVEAL ON SCROLL */
  (function () {
    var groups = [
      ['.showcase__track', 0], ['.showcase__tabs', 120], ['.explore__bg', 0],
      ['.factory img', 0],
      ['.faq__item', 90], ['.faq__more', 0],
      ['.infra__intro > *', 80], ['.infra__card', 110], ['.infra__note', 0],
      ['.cta__copy > *', 70], ['.card', 150],
      ['.footer__brand, .footer__col', 100], ['.footer__legal', 0]
    ];
    var els = [];
    groups.forEach(function (g) {
      Array.prototype.forEach.call(document.querySelectorAll(g[0]), function (el, i) {
        el.classList.add('reveal'); el.style.setProperty('--d', (i * g[1]) + 'ms'); els.push(el);
      });
    });
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ------------------------------------------------- SHOWCASE */
  // Stock photography (see assets/stock/CREDITS.txt). Swap in project photos any time.
  var SETS = {
    alu: [
      { t: 'Sliding doors',   d: 'Slim aluminium sliding doors that open a living room onto the patio.', img: 'assets/stock/alu-1.jpg', tone: '#6b5a4c' },
      { t: 'Large windows',   d: 'Wide glazing that frames the view and floods the room with light.',    img: 'assets/stock/alu-2.jpg', tone: '#8a7a6a' },
      { t: 'Living spaces',   d: 'Clean sightlines for bright, open living rooms.',                       img: 'assets/stock/alu-3.jpg', tone: '#8c6d4f' },
      { t: 'Kitchen & dining',d: 'Natural light and easy access to outdoor spaces.',                      img: 'assets/stock/alu-4.jpg', tone: '#4d4a46' },
      { t: 'Commercial glazing', d: 'Durable frames for entrances and façades.',                          img: 'assets/stock/alu-5.jpg', tone: '#3f3b38' },
      { t: 'Home & work',     d: 'Bright, comfortable rooms for everyday life.',                          img: 'assets/stock/alu-6.jpg', tone: '#9b8e7e' }
    ],
    upvc: [
      { t: 'Double-hung',     d: 'Classic double-hung uPVC windows with a clean, low-maintenance finish.', img: 'assets/stock/upvc-1.jpg', tone: '#7c8577' },
      { t: 'Sash windows',    d: 'Traditional sash styling with modern thermal performance.',              img: 'assets/stock/upvc-2.jpg', tone: '#8d8b84' },
      { t: 'Casement windows',d: 'Weather-tight casements that suit every kind of home.',                  img: 'assets/stock/upvc-3.jpg', tone: '#8c6d4f' },
      { t: 'Decorative grille',d: 'uPVC frames paired with decorative security grilles.',                  img: 'assets/stock/upvc-4.jpg', tone: '#6c7177' },
      { t: 'Country homes',   d: 'Comfortable, draught-free windows for older and newer homes alike.',     img: 'assets/stock/upvc-5.jpg', tone: '#a39a86' },
      { t: 'Everyday living', d: 'Bright, quiet rooms all year round.',                                    img: 'assets/stock/upvc-6.jpg', tone: '#85766b' }
    ]
  };
  var track = document.getElementById('track');
  var showbg = document.getElementById('showbg');
  var currentSet = 'alu', active = 2, hoverT;
  function src(s, i) { return s.img || 'assets/sections/slide-' + (i + 1) + '.png'; }

  function renderTrack() {
    track.innerHTML = ''; showbg.innerHTML = '';
    SETS[currentSet].forEach(function (s, i) {
      var li = document.createElement('div');
      li.className = 'slide' + (i === active ? ' is-active' : '');
      li.setAttribute('role', 'listitem');
      li.innerHTML = '<button type="button" class="slide__img" aria-label=""><img alt="" loading="lazy"></button>' +
                     '<div class="slide__cap"><h3></h3><p></p></div>';
      var btn = li.querySelector('button');
      btn.style.setProperty('--tone', s.tone);
      btn.setAttribute('aria-label', s.t);
      li.querySelector('img').src = src(s, i);
      li.querySelector('h3').textContent = s.t;
      li.querySelector('p').textContent = s.d;
      // hover (with a tiny intent delay so a fast pass-over doesn't jitter) · click/focus for touch & keyboard
      li.addEventListener('mouseenter', function () { clearTimeout(hoverT); hoverT = setTimeout(function () { setActive(i); }, 70); });
      li.addEventListener('mouseleave', function () { clearTimeout(hoverT); });
      btn.addEventListener('click', function () { setActive(i); });
      btn.addEventListener('focus', function () { setActive(i); });
      track.appendChild(li);

      var bg = document.createElement('img');
      bg.alt = ''; bg.src = src(s, i); if (i === active) bg.className = 'is-on';
      showbg.appendChild(bg);
    });
  }
  function setActive(i) {
    if (i === active) return;
    active = i;
    Array.prototype.forEach.call(track.children, function (el, n) { el.classList.toggle('is-active', n === i); });
    Array.prototype.forEach.call(showbg.children, function (el, n) { el.classList.toggle('is-on', n === i); });
  }
  var switching;
  document.querySelectorAll('.showcase__tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.dataset.set === currentSet) return;
      document.querySelectorAll('.showcase__tabs button').forEach(function (x) {
        var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on);
      });
      currentSet = b.dataset.set; active = 2;
      // minimal transition: current row fades down & out, new row fades up in a short stagger
      track.classList.add('is-out'); showbg.classList.add('is-out');
      clearTimeout(switching);
      switching = setTimeout(function () {
        renderTrack();
        Array.prototype.forEach.call(track.children, function (el, i) { el.style.setProperty('--i', i); el.classList.add('is-in'); });
        void track.offsetWidth;
        track.classList.remove('is-out'); showbg.classList.remove('is-out');
        setTimeout(function () { Array.prototype.forEach.call(track.children, function (el) { el.classList.remove('is-in'); }); }, 700);
      }, 240);
    });
  });
  renderTrack();

  /* ------------------------------------------------ ACCORDION */
  var ITEMS = [
    { i: 'eye',   t: 'Tailored to your dream', tone: '#a98d74',
      p: 'We create tailored solutions that perfectly match your style, needs, and preferences, bringing your vision to life. Every detail is thoughtfully designed around you. Quality materials bring lasting comfort and beauty. Our team guides you from concept to completion. Together, we create a space that feels like home.' },
    { i: 'medal', t: 'Quality & Durability', tone: '#9a8f84',
      p: 'Precision-engineered profiles and rigorous testing keep every window performing as new, year after year.' },
    { i: 'cart',  t: 'Comprehensive Offerings', tone: '#8d9a94',
      p: 'uPVC and aluminium windows and doors in a wide range of configurations, finishes and glazing options.' },
    { i: 'smile', t: 'Seamless Experience', tone: '#a1998c',
      p: 'From first call to final fit, one team handles measurement, manufacture and installation.' },
    { i: 'guide', t: 'Expert Guidance at Every Step', tone: '#8f94a0',
      p: 'Our specialists help you compare systems and choose what fits your home, climate and budget.' },
    { i: 'chat',  t: 'Exceptional Support', tone: '#a39382',
      p: 'Responsive after-sales service and a dedicated helpline whenever you need us.' }
  ];
  /* ---- explore: pointers (tabs) switch the card */
  var xtabs = document.getElementById('xtabs'), xcard = document.getElementById('xcard');
  var xi = 0;
  function showItem(n) {
    xi = n;
    Array.prototype.forEach.call(xtabs.children, function (b, k) { b.classList.toggle('is-active', k === n); b.setAttribute('aria-selected', k === n); });
    xcard.classList.add('is-swap');
    setTimeout(function () {
      document.getElementById('xtitle').textContent = ITEMS[n].t;
      document.getElementById('xdesc').textContent = ITEMS[n].p;
      var im = document.getElementById('ximg');
      im.style.backgroundImage = 'url(assets/stock/acc-' + (n + 1) + '.jpg)'; im.setAttribute('aria-label', ITEMS[n].t);
      xcard.classList.remove('is-swap');
    }, 180);
  }
  ITEMS.forEach(function (it, n) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'explore__tab'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', it.t);
    b.style.setProperty('--i', n);
    b.innerHTML = '<img src="assets/icons/acc-' + (n + 1) + '.png" alt="">';
    b.addEventListener('click', function () { showItem(n); });
    xtabs.appendChild(b);
  });
  showItem(0);
  document.getElementById('xtitle').textContent = ITEMS[0].t;

  /* ---- FAQ accordion */
  document.querySelectorAll('.faq__item').forEach(function (item) {
    item.querySelector('.faq__q').addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      document.querySelectorAll('.faq__item').forEach(function (x) { x.classList.remove('is-open'); x.querySelector('.faq__q').setAttribute('aria-expanded', 'false'); });
      if (open) { item.classList.add('is-open'); this.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ------------------------------------------------- CONTACT SCALE */
  // Contact block is shown 25% larger than the 1326px design, shrinking only as far as needed so the copy never meets the form.
  var cta = document.getElementById('contact');
  function scaleCta() {
    var vw = cta.clientWidth;
    var z = Math.max(0.6, Math.min(1.25, vw / 1326));
    cta.style.setProperty('--z', z.toFixed(3));
  }
  scaleCta();
  if (window.ResizeObserver) new ResizeObserver(scaleCta).observe(document.body);

  /* ------------------------------------------------- LEAD FORM */
  var form = document.getElementById('lead');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    // TODO: POST to your CRM / form endpoint
    document.getElementById('lead-ok').hidden = false;
    form.reset();
  });
})();
