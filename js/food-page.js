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

  /* ── 3. Render helpers ── */
  function tag(cls, text) {
    return '<span class="fp-tag fp-tag--' + cls + '">' + esc(text) + '</span>';
  }
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function tags(arr, cls) {
    if (!arr || !arr.length) return '';
    return arr.map(function (t) { return tag(cls, t); }).join('');
  }
  function paragraphs(arr) {
    if (!arr || !arr.length) return '';
    return arr.map(function (p) {
      return '<p class="fp-body">' + esc(p) + '</p>';
    }).join('');
  }

  /* ── 4. Full page CSS ── */
  var CSS = [
    '*{box-sizing:border-box;margin:0;padding:0}',
    'html,body{min-height:100%;background:var(--food-bg,#faf9fc);color:#1a1a2e;font-family:"DM Sans","Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased}',
    'body{padding-bottom:90px}',

    /* hero */
    '.fp-hero{position:relative;width:100%;min-height:340px;display:flex;align-items:flex-end;overflow:hidden}',
    '.fp-hero__img{position:absolute;inset:0;background-size:cover;background-position:center;z-index:0}',
    '.fp-hero__fade{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.18) 0%,var(--food-bg,#faf9fc) 100%);z-index:1}',
    '.fp-hero__content{position:relative;z-index:2;padding:28px 22px 32px;width:100%}',
    '.fp-back{display:inline-flex;align-items:center;gap:6px;color:var(--food-primary);font-size:13px;font-weight:600;text-decoration:none;background:rgba(255,255,255,.75);backdrop-filter:blur(8px);border-radius:20px;padding:5px 12px 5px 8px;margin-bottom:18px;transition:background .2s}',
    '.fp-back svg{width:16px;height:16px;stroke:var(--food-primary);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.fp-hero__label{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--food-mist);margin-bottom:6px}',
    '.fp-hero__title{font-size:clamp(2.4rem,8vw,3.4rem);font-weight:700;line-height:1.05;color:var(--food-deep);letter-spacing:-.02em}',
    '.fp-hero__subtitle{font-size:14px;color:var(--food-secondary);margin-top:6px;font-style:italic}',

    /* no-image gradient fallback */
    '.fp-hero__gradient{position:absolute;inset:0;z-index:0}',

    /* content */
    '.fp-content{padding:0 18px;max-width:520px;margin:0 auto}',

    /* essence */
    '.fp-essence{background:var(--food-tint);border-left:3px solid var(--food-secondary);border-radius:0 10px 10px 0;padding:16px 18px;margin:22px 0;font-size:15px;line-height:1.65;color:var(--food-deep);font-style:italic}',

    /* sections */
    '.fp-section{margin:28px 0}',
    '.fp-section__label{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--food-mist);margin-bottom:4px}',
    '.fp-section__title{font-size:20px;font-weight:700;color:var(--food-deep);margin-bottom:14px;letter-spacing:-.01em}',
    '.fp-body{font-size:15px;line-height:1.7;color:#3a3845;margin-bottom:12px}',
    '.fp-body:last-child{margin-bottom:0}',

    /* read-more */
    '.fp-desc{position:relative}',
    '.fp-desc__inner{overflow:hidden;max-height:112px;transition:max-height .4s ease}',
    '.fp-desc__inner.open{max-height:2000px}',
    '.fp-desc__fade{position:absolute;bottom:28px;left:0;right:0;height:60px;background:linear-gradient(transparent,var(--food-bg));pointer-events:none;transition:opacity .3s}',
    '.fp-desc__fade.hidden{opacity:0;pointer-events:none}',
    '.fp-readmore{display:block;margin-top:8px;background:none;border:1.5px solid var(--food-light);border-radius:20px;padding:6px 16px;font-size:13px;font-weight:600;color:var(--food-primary);cursor:pointer;transition:background .2s,color .2s}',
    '.fp-readmore:hover{background:var(--food-light)}',

    /* divider */
    '.fp-divider{height:1px;background:var(--food-light);margin:24px 0}',

    /* tags */
    '.fp-tags-group{margin-bottom:16px}',
    '.fp-tags-group__label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--food-mist);margin-bottom:8px}',
    '.fp-tags{display:flex;flex-wrap:wrap;gap:7px}',
    '.fp-tag{font-size:13px;font-weight:600;padding:5px 12px;border-radius:20px;display:inline-block}',
    '.fp-tag--symptom{background:var(--food-light);color:var(--food-primary)}',
    '.fp-tag--condition{background:var(--food-tint);color:var(--food-deep);border:1px solid var(--food-light)}',

    /* scroll reveal */
    '.fp-section{opacity:0;transform:translateY(18px);transition:opacity .5s ease,transform .5s ease}',
    '.fp-section.visible{opacity:1;transform:none}',

    /* source note */
    '.fp-source{margin-top:32px;padding:16px 18px;background:var(--food-tint);border-radius:12px;text-align:center;font-size:12px;color:var(--food-mist);line-height:1.6}',
    '.fp-source strong{color:var(--food-secondary)}'
  ].join('\n');

  /* ── 5. Render food page HTML ── */
  function render(food) {
    /* inject CSS vars */
    var vars = Object.keys(food.colors).map(function (k) {
      return '--food-' + k + ':' + food.colors[k];
    }).join(';');
    var styleEl = document.createElement('style');
    styleEl.textContent = ':root{' + vars + '}';
    document.head.appendChild(styleEl);

    /* inject page styles */
    var cssEl = document.createElement('style');
    cssEl.textContent = CSS;
    document.head.appendChild(cssEl);

    /* set page title */
    document.title = food.name + ' — Healing with MM';

    /* inject Google Font for title */
    var fontUrl = 'https://fonts.googleapis.com/css2?family=' +
      encodeURIComponent(food.titleFont) + ':wght@400;600;700&display=swap';
    var fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = fontUrl;
    document.head.appendChild(fontLink);

    /* hero background */
    var heroBg = food.heroImage
      ? '<div class="fp-hero__img" style="background-image:url(\'' + food.heroImage + '\')"></div>'
      : '<div class="fp-hero__gradient" style="background:linear-gradient(160deg,var(--food-secondary) 0%,var(--food-primary) 40%,var(--food-deep) 100%)"></div>';

    /* description section */
    var descHTML = '';
    if (food.description && food.description.length) {
      var paras = paragraphs(food.description);
      descHTML = '<div class="fp-section scroll-reveal">'
        + '<div class="fp-section__label">About</div>'
        + '<div class="fp-section__title">Information</div>'
        + '<div class="fp-desc">'
        + '<div class="fp-desc__inner" id="fpDescInner">' + paras + '</div>'
        + '<div class="fp-desc__fade" id="fpDescFade"></div>'
        + '</div>'
        + '<button class="fp-readmore" id="fpReadmore" onclick="window.__fpToggleDesc()">Read more</button>'
        + '</div>'
        + '<div class="fp-divider"></div>';
    }

    /* symptoms & conditions */
    var symptomsHTML = '';
    if ((food.symptoms && food.symptoms.length) || (food.conditions && food.conditions.length)) {
      symptomsHTML = '<div class="fp-section scroll-reveal">'
        + '<div class="fp-section__label">Helps With</div>'
        + '<div class="fp-section__title">Symptoms &amp; Conditions</div>';
      if (food.symptoms && food.symptoms.length) {
        symptomsHTML += '<div class="fp-tags-group">'
          + '<div class="fp-tags-group__label">Symptoms</div>'
          + '<div class="fp-tags">' + tags(food.symptoms, 'symptom') + '</div>'
          + '</div>';
      }
      if (food.conditions && food.conditions.length) {
        symptomsHTML += '<div class="fp-tags-group">'
          + '<div class="fp-tags-group__label">Conditions</div>'
          + '<div class="fp-tags">' + tags(food.conditions, 'condition') + '</div>'
          + '</div>';
      }
      symptomsHTML += '</div><div class="fp-divider"></div>';
    }

    /* emotional support */
    var emotionalHTML = '';
    if (food.emotionalSupport && food.emotionalSupport.length) {
      emotionalHTML = '<div class="fp-section scroll-reveal">'
        + '<div class="fp-section__label">Beyond the Physical</div>'
        + '<div class="fp-section__title">Emotional Support</div>'
        + paragraphs(food.emotionalSupport)
        + '</div>';
    }

    /* spiritual lesson */
    var spiritualHTML = '';
    if (food.spiritualLesson && food.spiritualLesson.length) {
      spiritualHTML = '<div class="fp-section scroll-reveal">'
        + '<div class="fp-section__label">Deeper Wisdom</div>'
        + '<div class="fp-section__title">Spiritual Lesson</div>'
        + paragraphs(food.spiritualLesson)
        + '</div>';
    }

    /* essence */
    var essenceHTML = food.essence
      ? '<div class="fp-essence">' + esc(food.essence) + '</div>'
      : '';

    /* full HTML */
    var html = '<div class="fp-hero">'
      + heroBg
      + '<div class="fp-hero__fade"></div>'
      + '<div class="fp-hero__content">'
      + '<a class="fp-back" href="../">'
      + '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>Healing Foods</a>'
      + '<div class="fp-hero__label">' + esc(food.category) + '</div>'
      + '<h1 class="fp-hero__title food-title">' + esc(food.name) + '</h1>'
      + '<div class="fp-hero__subtitle">' + esc(food.subtitle) + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="fp-content">'
      + essenceHTML
      + descHTML
      + symptomsHTML
      + emotionalHTML
      + spiritualHTML
      + '<div class="fp-source">Content inspired by <strong>Medical Medium</strong> by Anthony William.<br>For educational purposes only — not medical advice.</div>'
      + '</div>';

    document.body.innerHTML = html;

    /* apply title font */
    var titleEl = document.querySelector('.food-title');
    if (titleEl) {
      titleEl.style.fontFamily = "'" + food.titleFont + "', serif";
    }

    /* scroll reveal via IntersectionObserver */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
        });
      }, { threshold: 0.08 });
      document.querySelectorAll('.fp-section').forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll('.fp-section').forEach(function (el) { el.classList.add('visible'); });
    }

    /* read-more toggle */
    window.__fpToggleDesc = function () {
      var inner = document.getElementById('fpDescInner');
      var fade = document.getElementById('fpDescFade');
      var btn = document.getElementById('fpReadmore');
      if (!inner) return;
      var open = inner.classList.toggle('open');
      if (fade) fade.classList.toggle('hidden', open);
      if (btn) btn.textContent = open ? 'Show less' : 'Read more';
    };

    /* inject tabbar */
    var tb = document.createElement('script');
    tb.src = base + '/js/tabbar.js';
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
          + '<a href="../">← Back to Healing Foods</a></div>';
        return;
      }
      render(food);
    })
    .catch(function (err) {
      document.body.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif">'
        + '<h2>Error loading food data</h2><p>' + esc(String(err)) + '</p></div>';
    });
})();
