/* Mobile navigation menu: adds a hamburger + slide-down panel to the site navbar (#nav on the main site, #pnav on the sub-sites) */
(function () {
  var h = document.getElementById('nav') || document.getElementById('pnav');
  if (!h) return;
  var p = h.id === 'pnav' ? '../' : '';
  var items = [['About', p + 'about.html'], ['Why us', p + 'index.html#why'], ['Products', p + 'products.html'], ['uPVC windows', p + 'upvc-windows/'], ['Aluminium windows', p + 'aluminium-windows/']];
  h.classList.add('has-nm');
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'nm__btn'; b.setAttribute('aria-label', 'Open menu'); b.setAttribute('aria-expanded', 'false'); b.innerHTML = '<i></i><i></i><i></i>';
  var panel = document.createElement('div');
  panel.className = 'nm__panel'; panel.id = 'nm-panel'; b.setAttribute('aria-controls', 'nm-panel');
  panel.innerHTML = items.map(function (it, i) { return '<a href="' + it[1] + '" style="--i:' + i + '">' + it[0] + '</a>'; }).join('') +
    '<a class="nm__cta" href="' + (p ? p + 'index.html#contact' : '#contact') + '" style="--i:' + items.length + '">Get a Free Quote</a>' +
    '<p class="nm__tel">Prefer to talk? <a href="tel:18008334500">1800 833 4500</a></p>';
  h.insertBefore(b, h.firstChild); h.appendChild(panel);
  function set(open) { h.classList.toggle('is-open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false'); b.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
  b.addEventListener('click', function () { set(!h.classList.contains('is-open')); });
  panel.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) set(false); });
  window.addEventListener('scroll', function () { if (h.classList.contains('is-open') && h.classList.contains('is-hidden')) set(false); }, { passive: true });
})();
