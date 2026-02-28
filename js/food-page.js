(function () {
  /* ── 1. Detect slug ── */
  var slug =
    (typeof window.__FOOD_SLUG !== 'undefined' && window.__FOOD_SLUG) ||
    (new URLSearchParams(window.location.search)).get('f') ||
    window.location.pathname.split('/').pop().replace(/\.html?$/, '');

  /* ── 2. Resolve data path relative to this script ── */
  var scripts = document.querySelectorAll('script[src*="food-page"]');
  var scriptEl = scripts[scripts.length - 1];
  var scriptURL = new URL(scriptEl.src, window.location.href);
  var base = scriptURL.pathname.replace(/\/js\/food-page\.js.*$/, '');
  if (base.endsWith('/')) base = base.slice(0, -1);
  var dataURL = scriptURL.origin + base + '/data/foods.json';

  /* ── 3. Helpers ── */
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function tag(cls, text) {
    return '<span class="fp-tag fp-tag--' + cls + '">' + esc(text) + '</span>';
  }
  function tags(arr, cls) {
    if (!arr || !arr.length) return '';
    return arr.map(function (t) { return tag(cls, t); }).join('');
  }
  function paras(arr) {
    if (!arr || !arr.length) return '';
    return arr.map(function (p) { return '<p class="fp-body">' + esc(p) + '</p>'; }).join('');
  }

  /* ── 4. Page CSS ── */
  var CSS = [
    /* reset */
    '*{box-sizing:border-box;margin:0;padding:0}',
    'html{scroll-behavior:smooth}',
    'html,body{min-height:100%;-webkit-font-smoothing:antialiased}',

    /* body — food-bg as page background */
    'body{background:var(--food-bg);color:#3a3845;font-family:"Source Serif 4",Georgia,serif;font-size:16px;line-height:1.7;max-width:430px;margin:0 auto;overflow-x:hidden;padding-bottom:100px}',
    '@media(min-width:768px){body{max-width:1100px;padding-bottom:60px}}',

    /* ── HERO: full bleed 100vw ── */
    '.fp-hero{position:relative;width:100vw;margin-left:calc(-50vw + 50%);height:500px;overflow:hidden;background:var(--food-deep)}',
    '@media(min-width:768px){.fp-hero{height:600px}}',

    /* actual image — fades in on load */
    '.fp-hero__img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;opacity:0;animation:fpFadeIn 1.4s ease-out 0.2s forwards;z-index:1}',

    /* gradient-only fallback (used when no heroImage) */
    '.fp-hero__gradient{position:absolute;inset:0;z-index:0}',

    /* dark shade: strong gradient from bottom — white title sits on this */
    '.fp-hero__text-shade{position:absolute;bottom:0;left:0;right:0;height:75%;background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,rgba(0,0,0,0.2) 50%,transparent 100%);pointer-events:none;z-index:2}',

    /* bottom fade: thin fade at the very edge only — keeps the dark zone for text */
    '.fp-hero__bottom-fade{position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to bottom,transparent 0%,var(--food-bg) 100%);pointer-events:none;z-index:3}',

    /* mobile back button — hidden on desktop (capsule handles it) */
    '.fp-hero__nav{position:absolute;top:0;left:0;right:0;padding:54px 20px 16px;z-index:10}',
    '@supports(padding-top:env(safe-area-inset-top)){.fp-hero__nav{padding-top:calc(env(safe-area-inset-top) + 12px)}}',
    '@media(min-width:768px){.fp-hero__nav{display:none}}',
    '.fp-nav-btn{width:40px;height:40px;border-radius:50%;border:none;background:rgba(0,0,0,0.2);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.3s;-webkit-tap-highlight-color:transparent}',
    '.fp-nav-btn:hover{background:rgba(0,0,0,0.35)}',
    '.fp-nav-btn svg{width:20px;height:20px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',

    /* hero text block — sits at bottom on top of fades */
    '.fp-hero__text{position:absolute;bottom:0;left:0;right:0;padding:0 28px 38px;z-index:5}',
    /* category pill — food-primary background, white text */
    '.fp-hero__label{display:inline-block;font-family:"DM Sans",sans-serif;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;background:var(--food-primary);color:#fff;padding:5px 13px;border-radius:20px;margin-bottom:14px;animation:fpSlideUp 0.8s ease-out 0.7s both}',
    /* title — white with shadow for readability over any image */
    '.fp-hero__title{font-size:clamp(2.4rem,10vw,3.8rem);font-weight:700;line-height:1.02;color:#fff;letter-spacing:-0.5px;text-shadow:0 2px 16px rgba(0,0,0,0.35),0 1px 4px rgba(0,0,0,0.2);animation:fpSlideUp 0.9s ease-out 0.85s both}',
    '.fp-hero__subtitle{font-family:"Source Serif 4",Georgia,serif;font-style:italic;font-size:14px;font-weight:300;color:rgba(255,255,255,0.8);margin-top:8px;text-shadow:0 1px 6px rgba(0,0,0,0.25);animation:fpSlideUp 0.8s ease-out 1s both}',

    /* ── CONTENT ── */
    '.fp-content{padding:0 24px}',
    '@media(min-width:768px){.fp-content{max-width:680px;margin:0 auto;padding:0 0 40px}}',

    /* essence — flows directly from hero, max 20px gap */
    '.fp-essence{padding:20px 0 28px;border-bottom:1px solid var(--food-light);opacity:0;transform:translateY(20px);animation:fpSlideUp 0.8s ease-out 1.2s both}',
    '.fp-essence p{font-family:"Source Serif 4",Georgia,serif;font-size:18.5px;line-height:1.75;color:var(--food-primary)}',

    /* sections */
    '.fp-section{padding:36px 0 0;opacity:0;transform:translateY(24px);transition:opacity 0.6s ease,transform 0.6s ease}',
    '.fp-section.visible{opacity:1;transform:none}',

    /* section label: food-primary color */
    '.fp-section__label{font-family:"DM Sans",sans-serif;font-size:10.5px;font-weight:500;letter-spacing:2.5px;text-transform:uppercase;color:var(--food-primary);margin-bottom:10px}',
    '.fp-section__title{font-family:"Playfair Display",Georgia,serif;font-size:24px;font-weight:600;color:#1a1a2e;margin-bottom:18px;line-height:1.2}',
    '.fp-body{font-size:15.5px;line-height:1.85;color:#3a3845}',
    '.fp-body+.fp-body{margin-top:14px}',
    '.fp-body em{font-style:italic;color:var(--food-primary)}',

    /* divider — small decorative line */
    '.fp-divider{width:36px;height:2px;background:var(--food-light);margin:36px 0 0;border-radius:2px}',

    /* read-more expandable */
    '.fp-desc{margin-top:4px}',
    '.fp-desc__inner{max-height:180px;overflow:hidden;position:relative;transition:max-height 0.5s ease}',
    '.fp-desc__inner.open{max-height:3000px}',
    '.fp-desc__inner:not(.open)::after{content:"";position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(transparent,var(--food-bg));pointer-events:none}',
    '.fp-readmore{font-family:"DM Sans",sans-serif;font-size:13px;font-weight:500;color:var(--food-secondary);background:none;border:none;cursor:pointer;padding:8px 0;margin-top:4px;transition:color 0.2s;display:block}',
    '.fp-readmore:hover{color:var(--food-primary)}',

    /* tags — standardized colors (not food-specific) */
    '.fp-tags-group{margin-bottom:22px}',
    '.fp-tags-group:last-child{margin-bottom:0}',
    '.fp-tags-group__label{font-family:"DM Sans",sans-serif;font-size:10px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:#9a96a8;margin-bottom:10px}',
    '.fp-tags{display:flex;flex-wrap:wrap;gap:8px}',
    '.fp-tag{font-family:"DM Sans",sans-serif;font-size:13px;font-weight:400;padding:7px 15px;border-radius:100px;border:1px solid;cursor:default;transition:transform 0.2s}',
    '.fp-tag:hover{transform:scale(1.03)}',
    '.fp-tag--symptom{color:#8a3a3a;border-color:rgba(138,58,58,0.25);background:rgba(138,58,58,0.06)}',
    '.fp-tag--condition{color:#1e2a4a;border-color:rgba(30,42,74,0.3);background:rgba(30,42,74,0.04)}',

    /* tips — CSS counter, Playfair numbers */
    '.fp-tips{padding:36px 0 0;opacity:0;transform:translateY(24px);transition:opacity 0.6s ease,transform 0.6s ease}',
    '.fp-tips.visible{opacity:1;transform:none}',
    '.fp-tips__label{font-family:"DM Sans",sans-serif;font-size:10.5px;font-weight:500;letter-spacing:2.5px;text-transform:uppercase;color:var(--food-primary);margin-bottom:10px}',
    '.fp-tips__title{font-family:"Playfair Display",Georgia,serif;font-size:24px;font-weight:600;color:#1a1a2e;margin-bottom:18px;line-height:1.2}',
    '.fp-tips__list{margin-top:8px;display:flex;flex-direction:column;gap:18px;counter-reset:tips}',
    '.fp-tip{display:flex;gap:16px;align-items:flex-start;counter-increment:tips}',
    '.fp-tip::before{content:counter(tips);font-family:"Playfair Display",Georgia,serif;font-size:16px;font-weight:600;color:var(--food-mist);min-width:24px;height:24px;display:flex;align-items:center;justify-content:center;margin-top:3px;flex-shrink:0}',
    '.fp-tip p{font-size:14.5px;line-height:1.75;color:#3a3845;margin:0}',

    /* source note */
    '.fp-source{margin-top:48px;padding-top:24px;border-top:1px solid var(--food-light);text-align:center}',
    '.fp-source p{font-family:"DM Sans",sans-serif;font-size:11px;color:#9a96a8;line-height:1.6}',
    '.fp-source a{color:var(--food-secondary);text-decoration:none}',

    /* animations */
    '@keyframes fpFadeIn{from{opacity:0;transform:scale(1.05)}to{opacity:1;transform:scale(1)}}',
    '@keyframes fpSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}',
  ].join('\n');

  /* ── 5. Render ── */
  function render(food) {
    /* CSS vars for food color palette */
    var vars = Object.keys(food.colors).map(function (k) {
      return '--food-' + k + ':' + food.colors[k];
    }).join(';');
    var styleEl = document.createElement('style');
    styleEl.textContent = ':root{' + vars + '}';
    document.head.appendChild(styleEl);

    /* shared.css (tab bar, desktop nav, components) */
    var sharedLink = document.createElement('link');
    sharedLink.rel = 'stylesheet';
    sharedLink.href = scriptURL.origin + base + '/css/shared.css';
    document.head.appendChild(sharedLink);

    /* food-specific styles */
    var cssEl = document.createElement('style');
    cssEl.textContent = CSS;
    document.head.appendChild(cssEl);

    /* page title */
    document.title = food.name + ' — Healing with MM';

    /* Google Fonts — preconnects + title font
       Use ital,wght axis tuple format which works for both variable and static fonts */
    var pc1 = document.createElement('link');
    pc1.rel = 'preconnect'; pc1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(pc1);

    var pc2 = document.createElement('link');
    pc2.rel = 'preconnect'; pc2.href = 'https://fonts.gstatic.com';
    pc2.crossOrigin = 'anonymous';
    document.head.appendChild(pc2);

    var fontName = (food.titleFont && food.titleFont.trim()) || 'Playfair Display';
    /* Request weight 400 and 700; if font lacks 700 Google returns closest available */
    var fontUrl = 'https://fonts.googleapis.com/css2?family='
      + fontName.replace(/ /g, '+')
      + ':ital,wght@0,400;0,700;1,400&display=swap';
    var fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet'; fontLink.href = fontUrl;
    document.head.appendChild(fontLink);

    /* ── hero ── */
    var hasImage = food.heroImage && food.heroImage.length > 0;
    var heroInner = hasImage
      ? '<img class="fp-hero__img" src="' + esc(food.heroImage) + '" alt="' + esc(food.name) + '" onerror="this.style.opacity=\'0\'">'
        + '<div class="fp-hero__text-shade"></div>'
      : '<div class="fp-hero__gradient" style="background:linear-gradient(160deg,var(--food-secondary) 0%,var(--food-primary) 40%,var(--food-deep) 100%)"></div>'
        + '<div class="fp-hero__text-shade"></div>';

    /* ── description ── */
    var descHTML = '';
    if (food.description && food.description.length) {
      descHTML = '<div class="fp-section">'
        + '<div class="fp-section__label">About</div>'
        + '<div class="fp-section__title">Information</div>'
        + '<div class="fp-desc">'
        + '<div class="fp-desc__inner" id="fpDescInner">' + paras(food.description) + '</div>'
        + '<button class="fp-readmore" id="fpReadmore" onclick="window.__fpToggleDesc()">Read more</button>'
        + '</div></div>'
        + '<div class="fp-divider"></div>';
    }

    /* ── symptoms & conditions ── */
    var symptomsHTML = '';
    if ((food.symptoms && food.symptoms.length) || (food.conditions && food.conditions.length)) {
      symptomsHTML = '<div class="fp-section">'
        + '<div class="fp-section__label">Helps With</div>'
        + '<div class="fp-section__title">Symptoms &amp; Conditions</div>';
      if (food.symptoms && food.symptoms.length) {
        symptomsHTML += '<div class="fp-tags-group">'
          + '<div class="fp-tags-group__label">Symptoms</div>'
          + '<div class="fp-tags">' + tags(food.symptoms, 'symptom') + '</div></div>';
      }
      if (food.conditions && food.conditions.length) {
        symptomsHTML += '<div class="fp-tags-group">'
          + '<div class="fp-tags-group__label">Conditions</div>'
          + '<div class="fp-tags">' + tags(food.conditions, 'condition') + '</div></div>';
      }
      symptomsHTML += '</div><div class="fp-divider"></div>';
    }

    /* ── emotional support ── */
    var emotionalHTML = '';
    if (food.emotionalSupport && food.emotionalSupport.length) {
      emotionalHTML = '<div class="fp-section">'
        + '<div class="fp-section__label">Beyond the Physical</div>'
        + '<div class="fp-section__title">Emotional Support</div>'
        + paras(food.emotionalSupport)
        + '</div>';
    }

    /* ── spiritual lesson ── */
    var spiritualHTML = '';
    if (food.spiritualLesson && food.spiritualLesson.length) {
      spiritualHTML = '<div class="fp-section">'
        + '<div class="fp-section__label">Deeper Wisdom</div>'
        + '<div class="fp-section__title">Spiritual Lesson</div>'
        + paras(food.spiritualLesson)
        + '</div>';
    }

    /* ── tips ── */
    var tipsHTML = '';
    if (food.tips && food.tips.length) {
      var needsDivider = !!(emotionalHTML || spiritualHTML);
      tipsHTML = (needsDivider ? '<div class="fp-divider"></div>' : '')
        + '<div class="fp-tips">'
        + '<div class="fp-tips__label">Practical</div>'
        + '<div class="fp-tips__title">Tips</div>'
        + '<div class="fp-tips__list">'
        + food.tips.map(function (tip) {
            return '<div class="fp-tip"><p>' + esc(tip) + '</p></div>';
          }).join('')
        + '</div></div>';
    }

    /* ── assemble full page ── */
    var html =
      '<div class="fp-hero">'
      + heroInner
      + '<div class="fp-hero__bottom-fade"></div>'
      + '<nav class="fp-hero__nav">'
      + '<button class="fp-nav-btn" onclick="history.back()" aria-label="Go back">'
      + '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>'
      + '</button>'
      + '</nav>'
      + '<div class="fp-hero__text">'
      + '<div class="fp-hero__label">' + esc(food.category) + '</div>'
      + '<h1 class="fp-hero__title food-title">' + esc(food.name) + '</h1>'
      + '<p class="fp-hero__subtitle">' + esc(food.subtitle) + '</p>'
      + '</div>'
      + '</div>'
      + '<div class="fp-content">'
      + (food.essence ? '<div class="fp-essence"><p>' + esc(food.essence) + '</p></div>' : '')
      + descHTML
      + symptomsHTML
      + emotionalHTML
      + spiritualHTML
      + tipsHTML
      + '<div class="fp-source"><p>Content inspired by <strong>Medical Medium</strong> by Anthony William.<br>For educational purposes only — not medical advice.</p></div>'
      + '</div>';

    document.body.innerHTML = html;

    /* apply title font once element exists */
    var titleEl = document.querySelector('.food-title');
    if (titleEl) titleEl.style.fontFamily = "'" + fontName + "', serif";

    /* scroll reveal */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
      document.querySelectorAll('.fp-section, .fp-tips').forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll('.fp-section, .fp-tips').forEach(function (el) { el.classList.add('visible'); });
    }

    /* read-more toggle */
    window.__fpToggleDesc = function () {
      var inner = document.getElementById('fpDescInner');
      var btn = document.getElementById('fpReadmore');
      if (!inner) return;
      var open = inner.classList.toggle('open');
      if (btn) btn.textContent = open ? 'Read less' : 'Read more';
    };

    /* inject tabbar; mark as sub-page so desktop capsule shows back arrow */
    var tb = document.createElement('script');
    tb.src = base + '/js/tabbar.js';
    tb.onload = function () {
      var bar = document.getElementById('topBar');
      if (bar) bar.classList.add('sub-page');
    };
    document.body.appendChild(tb);
  }

  /* ── 6. Fetch and go ── */
  fetch(dataURL)
    .then(function (r) { return r.json(); })
    .then(function (foods) {
      var food = foods.find(function (f) { return f.slug === slug; });
      if (!food) {
        document.body.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif">'
          + '<h2>Food not found</h2><p>Slug: ' + esc(slug) + '</p>'
          + '<a href="../">&#8592; Back to Healing Foods</a></div>';
        return;
      }
      render(food);
    })
    .catch(function (err) {
      document.body.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif">'
        + '<h2>Error loading food data</h2><p>' + esc(String(err)) + '</p></div>';
    });
})();
