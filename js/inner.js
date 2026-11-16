/* =========================================================
   Prominance — inner pages
   Smooth scroll · navbar · layered hero · scroll reveals · count-up · parallax · process line · FAQ · lead form
   ========================================================= */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- smooth scroll (same Lenis settings as the homepage) */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href'), el = id.length > 1 && document.querySelector(id);
      if (id === '#top') { e.preventDefault(); lenis.scrollTo(0); }
      else if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: 0 }); }
    });
    if (location.hash.length > 1) {                    // deep link such as about.html#why
      var target = document.querySelector(location.hash);
      if (target) setTimeout(function () { lenis.scrollTo(target, { offset: 0, immediate: true }); }, 60);
    }
  }

  /* ---- navbar: solid after the top, hides on scroll down, returns on scroll up; hero is covered by the next section */
  var nav = $('#nav'), hero = $('.ihero'), lastY = window.scrollY, ticking = false;
  var parallax = $$('[data-parallax]');
  var process = $('.process__grid');
  function frame() {
    var y = window.scrollY, dy = y - lastY, vh = window.innerHeight;
    nav.classList.toggle('is-solid', y > 40);
    if (y < 80) nav.classList.remove('is-hidden');
    else if (dy > 6) nav.classList.add('is-hidden');
    else if (dy < -6) nav.classList.remove('is-hidden');
    if (Math.abs(dy) > 6 || y < 80) lastY = y;
    if (hero) hero.style.setProperty('--p', Math.max(0, Math.min(1, y / Math.max(1, hero.offsetHeight))).toFixed(3));
    if (!reduce) {
      parallax.forEach(function (el) {
        var host = el.closest('[data-parallax-host]') || el.parentElement, r = host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var f = parseFloat(el.getAttribute('data-parallax')) || .1;
        el.style.setProperty('--py', (((r.top + r.height / 2) - vh / 2) * -f).toFixed(1) + 'px');
      });
    }
    if (process) {
      var pr = process.getBoundingClientRect();
      var pp = Math.max(0, Math.min(1, (vh * .78 - pr.top) / Math.max(1, pr.height + vh * .1)));
      process.style.setProperty('--pp', pp.toFixed(3));
      var steps = $$('.pstep', process);
      steps.forEach(function (s, i) { s.classList.toggle('is-on', pp > (i / steps.length) * .82 + .04 || reduce); });
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  window.addEventListener('resize', frame);
  frame();

  /* ---- reveal on scroll: everything marked .reveal (or in the groups below) fades/slides in once */
  var groups = [
    ['.shead > *', 90], ['.answer__copy > *', 80], ['.facts', 120],
    ['.stats__item', 110], ['.bcard', 90], ['.rcard', 90], ['.tbl-wrap', 0], ['.tbl-note', 0],
    ['.fac__frame', 0], ['.fac__item', 110], ['.pstep', 110], ['.pick__card', 120], ['.related a', 100],
    ['.value', 80], ['.story > *', 120], ['.faq__head > *', 80], ['.faq__item', 90],
    ['.cta__copy > *', 70], ['.card', 150],
    ['.footer__brand, .footer__col', 100], ['.footer__legal', 0]
  ];
  var els = [];
  groups.forEach(function (g) {
    $$(g[0]).forEach(function (el, i) {
      if (el.classList.contains('reveal')) return;
      el.classList.add('reveal'); el.style.setProperty('--d', (i * g[1]) + 'ms'); els.push(el);
    });
  });
  $$('[data-r]').forEach(function (el) { if (els.indexOf(el) < 0) { el.classList.add('reveal'); els.push(el); } });
  if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (el) { el.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---- count-up numbers */
  var counters = $$('[data-count]');
  function fmt(n) { return Math.round(n).toLocaleString('en-IN'); }
  function run(el) {
    var to = parseFloat(el.getAttribute('data-count')), t0 = null, dur = 1700;
    if (reduce) { el.firstChild.nodeValue = fmt(to); return; }
    (function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.firstChild.nodeValue = fmt(to * e);
      if (k < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  if ('IntersectionObserver' in window && !reduce) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); co.unobserve(en.target); } });
    }, { threshold: .6 });
    counters.forEach(function (el) { el.firstChild.nodeValue = '0'; co.observe(el); });
  } else counters.forEach(function (el) { el.firstChild.nodeValue = fmt(parseFloat(el.getAttribute('data-count'))); });

  /* ---- FAQ accordion (same behaviour as the homepage) */
  $$('.faq__item').forEach(function (item) {
    var q = $('.faq__q', item);
    q.addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      $$('.faq__item').forEach(function (x) { x.classList.remove('is-open'); $('.faq__q', x).setAttribute('aria-expanded', 'false'); });
      if (open) { item.classList.add('is-open'); q.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---- contact block scale (design is 1326px wide) + lead form */
  var cta = $('#contact');
  if (cta) {
    var scaleCta = function () { cta.style.setProperty('--z', Math.max(0.6, Math.min(1.25, cta.clientWidth / 1326)).toFixed(3)); };
    scaleCta();
    if (window.ResizeObserver) new ResizeObserver(scaleCta).observe(document.body);
  }
  var form = $('#lead');
  if (form) {
    var pre = (document.body.getAttribute('data-interest') || '');
    if (pre && form.interest) { $$('option', form.interest).forEach(function (o) { if (o.textContent.indexOf(pre) === 0) form.interest.value = o.textContent; }); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      // TODO: POST to your CRM / form endpoint
      $('#lead-ok').hidden = false;
      form.reset();
    });
  }
})();
