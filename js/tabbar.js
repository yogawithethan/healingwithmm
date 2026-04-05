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
      /* Heal — heart (Feather/Lucide style) */
      id: 'heal', label: 'Heal', href: base + '/', paths: ['/', '/tracker'],
      icon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'
    },
    {
      /* Foods — leaf (Lucide: sprout/seedling) */
      id: 'foods', label: 'Foods', href: base + '/foods/', paths: ['/foods'],
      icon: '<path d="M6 21c2-4 4.5-7 10-9"/><path d="M16 3c-1.5 3-3 5.5-3 9"/><path d="M20 3c-5 0-9.5 2.5-9.5 9 0 0-3.5-1-6.5 0"/>'
    },
    {
      /* Community — people (Lucide: users) */
      id: 'community', label: 'Community', href: base + '/community/', paths: ['/community'],
      icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
    },
    {
      /* Cleanse — droplet (Lucide: droplets) */
      id: 'cleanse', label: 'Cleanse', href: base + '/planner/', paths: ['/planner'],
      icon: '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 14.1c1.44 0 2.6-1.19 2.6-2.64 0-.76-.37-1.47-1.11-2.08S12.73 7.8 12.56 6.9c-.18.9-.74 1.82-1.49 2.48S10 10.7 10 11.46c0 1.45 1.15 2.64 2.56 2.64z"/>'
    },
    {
      /* Recipes — utensils (Lucide: cooking pot / simple fork-knife) */
      id: 'recipes', label: 'Recipes', href: base + '/recipes/', paths: ['/recipes'],
      icon: '<path d="M6 2v6a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2"/><path d="M9 11v11"/><line x1="6" y1="5" x2="12" y2="5"/><path d="M18 2v4a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2V2"/><path d="M18 8v14"/>'
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
