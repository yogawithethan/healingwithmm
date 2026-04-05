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
      id: 'heal', label: 'Heal', href: base + '/', paths: ['/', '/tracker'],
      icon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'
    },
    {
      id: 'foods', label: 'Foods', href: base + '/foods/', paths: ['/foods'],
      icon: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'
    },
    {
      id: 'community', label: 'Community', href: base + '/community/', paths: ['/community'],
      icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
    },
    {
      id: 'cleanse', label: 'Cleanse', href: base + '/planner/', paths: ['/planner'],
      icon: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>'
    },
    {
      id: 'recipes', label: 'Recipes', href: base + '/recipes/', paths: ['/recipes'],
      icon: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>'
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
    /* Sign in button / profile icon — right side of top bar */
    + '<a class="nav-signin" id="navSignIn" href="' + base + '/profile/">'
    + 'Sign in</a>'
    + '<a class="nav-profile nav-profile--hidden" id="navProfileIcon" href="' + base + '/profile/" aria-label="Profile">'
    + '</a>'
    + '</div></nav>';

  var topEl = document.createElement('div');
  topEl.innerHTML = topHtml;
  document.body.appendChild(topEl.firstElementChild);

  /* ── Desktop nav: fade in frosted background on scroll ── */
  var topBar = document.getElementById('topBar');
  if (topBar) {
    var onScroll = function () {
      if (window.scrollY > 30) {
        topBar.classList.add('scrolled');
      } else {
        topBar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
