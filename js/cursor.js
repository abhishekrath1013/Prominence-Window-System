/* Custom cursor: the Prominance "A" mark follows the pointer (mouse / trackpad only). The tip of the A is the click point. */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var base = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/js\/cursor\.js.*$/, '') : '';
  var el = document.createElement('div');
  el.className = 'pcur'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<img src="' + base + 'assets/prominance-a-mark.png" alt="" width="30" height="26" draggable="false">';
  document.body.appendChild(el);
  document.documentElement.classList.add('has-pcur');
  var x = -100, y = -100, cx = x, cy = y, raf = null, shown = false;
  function loop() {
    cx += (x - cx) * 0.38; cy += (y - cy) * 0.38;
    el.style.transform = 'translate(' + (cx - 15).toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
    if (Math.abs(x - cx) > .1 || Math.abs(y - cy) > .1) raf = requestAnimationFrame(loop); else raf = null;
  }
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!shown) { shown = true; cx = x; cy = y; el.classList.add('is-on'); }
    el.classList.toggle('is-link', !!e.target.closest('a, button, [role="button"], input, select, textarea, label, .slide, [data-go]'));
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.addEventListener('pointerdown', function () { el.classList.add('is-down'); });
  document.addEventListener('pointerup', function () { el.classList.remove('is-down'); });
  document.documentElement.addEventListener('mouseleave', function () { el.classList.remove('is-on'); shown = false; });
})();
