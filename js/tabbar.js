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
      id: 'heal', label: 'Heal', href: base + '/', paths: ['/', '/foods', '/tracker'],
      icon: '<path d="M12 22c-4-4-8-7.5-8-12 0-3.5 3-6 6-4 1.5.8 2 2 2 2s.5-1.2 2-2c3-2 6 .5 6 4 0 4.5-4 8-8 12z"/><path d="M12 22v-8"/><path d="M9 17c0-2 1.5-3 3-4"/>'
    },
    {
      id: 'recipes', label: 'Recipes', href: base + '/recipes/', paths: ['/recipes'],
      icon: '<path d="M3 2v7c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>'
    },
    {
      id: 'community', label: 'Community', href: base + '/community/', paths: ['/community'],
      icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
    },
    {
      id: 'planner', label: 'Planner', href: base + '/planner/', paths: ['/planner'],
      icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" stroke-linecap="round"/>'
    },
    {
      id: 'profile', label: 'Profile', href: base + '/profile/', paths: ['/profile'],
      icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
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
    + '<polyline points="15 18 9 12 15 6" stroke="#1a1a2e" stroke-width="2.2" fill="none"/></svg>'
    + '</button>';
  tabs.forEach(function (tab) {
    var active = isActive(tab.paths) ? ' active' : '';
    topHtml += '<a class="nav-pill' + active + '" href="' + tab.href + '">';
    topHtml += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
      + tab.icon + '</svg>';
    topHtml += tab.label + '</a>';
  });
  topHtml += '</div></div></nav>';

  var topEl = document.createElement('div');
  topEl.innerHTML = topHtml;
  document.body.appendChild(topEl.firstElementChild);
})();
