// Tab bar + desktop nav — include on every page via correct relative path to js/tabbar.js
(function () {
  // Detect base path from the script's resolved URL
  var scripts = document.querySelectorAll('script[src*="tabbar"]');
  var scriptEl = scripts[scripts.length - 1];
  var scriptURL = new URL(scriptEl.src, window.location.href);
  var base = scriptURL.pathname.replace(/\/js\/tabbar\.js.*$/, '');
  if (base.endsWith('/')) base = base.slice(0, -1);

  var currentPath = window.location.pathname;
  var normalPath = currentPath.replace(/\/index\.html$/, '/');

  function isActive(paths) {
    return paths.some(function (p) {
      var full = base + p;
      return normalPath === full || normalPath === full + '/' ||
             normalPath.startsWith(full + '/') ||
             (p === '/' && normalPath === base + '/');
    });
  }

  var tabs = [
    {
      /* Heal — Heroicons: heart */
      id: 'heal', label: 'Heal', href: base + '/', paths: ['/', '/tracker'],
      icon: '<path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>'
    },
    {
      /* Foods — Heroicons/Phosphor: leaf */
      id: 'foods', label: 'Foods', href: base + '/foods/', paths: ['/foods'],
      icon: '<path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66"/><path d="M7 14c3.37-2.73 5.28-4.7 8.24-7.46"/><path d="M20.7 5.63a1 1 0 0 0-1.1-.39C16.78 6.1 13.3 7.84 10.4 10.6c-3.1 2.96-4.6 6.3-5.3 8.28a1 1 0 0 0 .39 1.1 1 1 0 0 0 1.1.05c1.8-1 4.78-2.95 7.48-5.63 2.8-2.79 4.54-6.27 5.43-9.05a1 1 0 0 0-.8-1.32z" fill="none"/>'
    },
    {
      /* Community — Heroicons: user-group */
      id: 'community', label: 'Community', href: base + '/community/', paths: ['/community'],
      icon: '<path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0z"/>'
    },
    {
      /* Cleanse — water droplet (Phosphor: drop) */
      id: 'cleanse', label: 'Cleanse', href: base + '/planner/', paths: ['/planner'],
      icon: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>'
    },
    {
      /* Recipes — Heroicons: fork + knife (utensils) */
      id: 'recipes', label: 'Recipes', href: base + '/recipes/', paths: ['/recipes'],
      icon: '<path d="M15.75 2.25v6a3.75 3.75 0 1 1-7.5 0v-6"/><path d="M12 8.25v13.5"/><path d="M9 2.25H6.75a.75.75 0 0 0-.75.75v3.75c0 2.07 1.68 3.75 3.75 3.75"/><path d="M15 2.25h2.25a.75.75 0 0 1 .75.75v3.75c0 2.07-1.68 3.75-3.75 3.75"/>'
    }
  ];

  /* ── Mobile bottom tab bar ── */
  var bottomHtml = '<div class="mm-tab-bar"><div class="mm-tab-bar-inner">';
  tabs.forEach(function (tab) {
    var active = isActive(tab.paths) ? ' active' : '';
    bottomHtml += '<a class="mm-tab-item' + active + '" href="' + tab.href + '">';
    bottomHtml += '<div class="mm-tab-icon">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
      + tab.icon + '</svg></div>';
    bottomHtml += '<span class="mm-tab-label">' + tab.label + '</span>';
    bottomHtml += '</a>';
  });
  bottomHtml += '</div></div>';

  var bottomEl = document.createElement('div');
  bottomEl.innerHTML = bottomHtml;
  document.body.appendChild(bottomEl.firstElementChild);

  /* ── Desktop top nav ── */
  var topHtml = '<nav class="top-bar" id="topBar"><div class="top-bar-inner">'
    + '<a class="nav-logo" href="' + base + '/">Healing <em>with</em> MM</a>'
    + '<div class="nav-capsule">'
    + '<button class="nav-back" onclick="history.back()" aria-label="Go back">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">'
    + '<polyline points="15 18 9 12 15 6" stroke="#1c1917" stroke-width="2.2" fill="none"/></svg>'
    + '</button>';
  tabs.forEach(function (tab) {
    var active = isActive(tab.paths) ? ' active' : '';
    topHtml += '<a class="nav-pill' + active + '" href="' + tab.href + '">';
    topHtml += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
      + tab.icon + '</svg>';
    topHtml += tab.label + '</a>';
  });
  topHtml += '</div>'
    /* Profile icon — right side of top bar */
    + '<a class="nav-profile" href="' + base + '/profile/" aria-label="Profile">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">'
    + '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
    + '</svg></a>'
    + '</div></nav>';

  var topEl = document.createElement('div');
  topEl.innerHTML = topHtml;
  document.body.appendChild(topEl.firstElementChild);
})();
