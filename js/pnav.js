/* Prominance navbar behaviour for the sub-sites: solid after the top, hides on scroll down, returns on scroll up */
(function () {
  var nav = document.getElementById('pnav'); if (!nav) return;
  var last = window.scrollY, tick = false;
  function run() {
    var y = window.scrollY, dy = y - last;
    nav.classList.toggle('is-solid', y > 40);
    if (y < 80) nav.classList.remove('is-hidden'); else if (dy > 6) nav.classList.add('is-hidden'); else if (dy < -6) nav.classList.remove('is-hidden');
    if (Math.abs(dy) > 6 || y < 80) last = y;
    tick = false;
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true });
  run();
})();
