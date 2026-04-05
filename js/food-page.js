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

  /* ── 4. Page CSS — Premium taste-skill redesign ── */
  var CSS = [
    /* reset */
    '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}',
    'html{scroll-behavior:smooth}',
    'html,body{min-height:auto;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}',

    /* body */
    'body{background:var(--food-bg);color:#44403c;font-family:"Source Serif 4",Georgia,serif;font-size:16px;line-height:1.7;max-width:430px;margin:0 auto;overflow-x:hidden;overflow-y:auto !important;padding-bottom:40px}',
    '@media(min-width:768px){body{max-width:1100px;padding-bottom:60px}}',

    /* grain overlay */
    'body::after{content:"";position:fixed;inset:0;z-index:9999;pointer-events:none;opacity:0.015;background-image:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E");background-repeat:repeat;background-size:256px 256px}',

    /* ── HERO ── */
    '.fp-hero{position:relative;width:100vw;margin-left:calc(-50vw + 50%);height:520px;overflow:hidden;background:var(--food-deep)}',
    '@media(min-width:768px){.fp-hero{height:620px}}',

    /* hero image */
    '.fp-hero__img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;opacity:0;animation:fpFadeIn 1.6s cubic-bezier(0.16,1,0.3,1) 0.15s forwards;z-index:1}',

    /* gradient fallback */
    '.fp-hero__gradient{position:absolute;inset:0;z-index:0}',

    /* dark shade for text readability */
    '.fp-hero__text-shade{position:absolute;bottom:0;left:0;right:0;height:70%;background:linear-gradient(to top,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.18) 45%,transparent 100%);pointer-events:none;z-index:2}',

    /* bottom fade to page bg */
    '.fp-hero__bottom-fade{position:absolute;bottom:0;left:0;right:0;height:25%;background:linear-gradient(to bottom,transparent 0%,var(--food-bg) 100%);pointer-events:none;z-index:3}',

    /* mobile back button */
    '.fp-hero__nav{position:absolute;top:0;left:0;right:0;padding:54px 22px 16px;z-index:10}',
    '@supports(padding-top:env(safe-area-inset-top)){.fp-hero__nav{padding-top:calc(env(safe-area-inset-top) + 14px)}}',
    '@media(min-width:768px){.fp-hero__nav{display:none}}',
    '.fp-nav-btn{width:42px;height:42px;border-radius:50%;border:none;background:rgba(0,0,0,0.18);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.4s cubic-bezier(0.16,1,0.3,1);-webkit-tap-highlight-color:transparent}',
    '.fp-nav-btn:hover{background:rgba(0,0,0,0.3)}',
    '.fp-nav-btn:active{transform:scale(0.92)}',
    '.fp-nav-btn svg{width:20px;height:20px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',

    /* hero text block */
    '.fp-hero__text{position:absolute;bottom:0;left:0;right:0;padding:0 32px 44px;z-index:5}',

    /* category pill */
    '.fp-hero__label{display:inline-block;font-family:"Outfit","DM Sans",sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;background:rgba(0,0,0,0.25);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:rgba(255,255,255,0.9);padding:6px 14px;border-radius:100px;margin-bottom:16px;border:1px solid rgba(255,255,255,0.1);animation:fpSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.7s both}',

    /* title */
    '.fp-hero__title{font-size:clamp(2.6rem,10vw,4rem);font-weight:700;line-height:1.0;color:#fff;letter-spacing:-0.03em;text-shadow:0 2px 20px rgba(0,0,0,0.3),0 1px 4px rgba(0,0,0,0.15);animation:fpSlideUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.85s both}',

    /* subtitle */
    '.fp-hero__subtitle{font-family:"Source Serif 4",Georgia,serif;font-style:italic;font-size:15px;font-weight:300;color:var(--food-mist);margin-top:10px;opacity:0.9;animation:fpSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) 1s both}',

    /* ── CONTENT ── */
    '.fp-content{padding:0 28px}',
    '@media(min-width:768px){.fp-content{max-width:680px;margin:0 auto;padding:0 0 48px}}',

    /* essence */
    '.fp-essence{padding:24px 0 32px;border-bottom:1px solid var(--food-light);opacity:0;transform:translateY(20px);animation:fpSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) 1.2s both}',
    '.fp-essence p{font-family:"Source Serif 4",Georgia,serif;font-size:19px;line-height:1.8;color:var(--food-primary);font-weight:400}',

    /* sections */
    '.fp-section{padding:40px 0 0;opacity:0;transform:translateY(28px);transition:opacity 0.7s cubic-bezier(0.16,1,0.3,1),transform 0.7s cubic-bezier(0.16,1,0.3,1)}',
    '.fp-section.visible{opacity:1;transform:none}',

    /* section label & title */
    '.fp-section__label{font-family:"Outfit","DM Sans",sans-serif;font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--food-primary);margin-bottom:10px;opacity:0.7}',
    '.fp-section__title{font-family:"Playfair Display",Georgia,serif;font-size:26px;font-weight:600;color:#1c1917;margin-bottom:20px;line-height:1.15;letter-spacing:-0.02em}',
    '.fp-body{font-size:15.5px;line-height:1.9;color:#44403c;max-width:65ch}',
    '.fp-body+.fp-body{margin-top:16px}',
    '.fp-body em{font-style:italic;color:var(--food-primary)}',

    /* divider */
    '.fp-divider{width:40px;height:2px;background:var(--food-light);margin:40px 0 0;border-radius:2px;opacity:0.6}',

    /* read-more */
    '.fp-desc{margin-top:6px}',
    '.fp-desc__inner{max-height:200px;overflow:hidden;position:relative;transition:max-height 0.6s cubic-bezier(0.16,1,0.3,1)}',
    '.fp-desc__inner.open{max-height:4000px}',
    '.fp-desc__inner:not(.open)::after{content:"";position:absolute;bottom:0;left:0;right:0;height:70px;background:linear-gradient(transparent,var(--food-bg));pointer-events:none}',
    '.fp-readmore{font-family:"Outfit","DM Sans",sans-serif;font-size:13px;font-weight:500;color:var(--food-secondary);background:none;border:none;cursor:pointer;padding:10px 0;margin-top:4px;transition:color 0.3s cubic-bezier(0.16,1,0.3,1);display:inline-flex;align-items:center;gap:6px;letter-spacing:0.02em}',
    '.fp-readmore:hover{color:var(--food-primary)}',
    '.fp-readmore svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;transition:transform 0.3s cubic-bezier(0.16,1,0.3,1)}',
    '.fp-readmore.open svg{transform:rotate(180deg)}',

    /* tags */
    '.fp-tags-group{margin-bottom:24px}',
    '.fp-tags-group:last-child{margin-bottom:0}',
    '.fp-tags-group__label{font-family:"Outfit","DM Sans",sans-serif;font-size:10px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:#a8a29e;margin-bottom:10px}',
    '.fp-tags{display:flex;flex-wrap:wrap;gap:8px}',
    '.fp-tag{font-family:"Outfit","DM Sans",sans-serif;font-size:13px;font-weight:400;padding:8px 16px;border-radius:100px;border:1px solid;cursor:default;transition:transform 0.4s cubic-bezier(0.16,1,0.3,1),box-shadow 0.4s cubic-bezier(0.16,1,0.3,1);letter-spacing:0.01em}',
    '.fp-tag:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.06)}',
    '.fp-tag--symptom{color:#8a4040;border-color:rgba(138,64,64,0.2);background:rgba(138,64,64,0.05)}',
    '.fp-tag--condition{color:#2a3a5e;border-color:rgba(42,58,94,0.2);background:rgba(42,58,94,0.04)}',

    /* tips */
    '.fp-tips{padding:40px 0 0;opacity:0;transform:translateY(28px);transition:opacity 0.7s cubic-bezier(0.16,1,0.3,1),transform 0.7s cubic-bezier(0.16,1,0.3,1)}',
    '.fp-tips.visible{opacity:1;transform:none}',
    '.fp-tips__label{font-family:"Outfit","DM Sans",sans-serif;font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--food-primary);margin-bottom:10px;opacity:0.7}',
    '.fp-tips__title{font-family:"Playfair Display",Georgia,serif;font-size:26px;font-weight:600;color:#1c1917;margin-bottom:22px;line-height:1.15;letter-spacing:-0.02em}',
    '.fp-tips__list{margin-top:8px;display:flex;flex-direction:column;gap:22px;counter-reset:tips}',
    '.fp-tip{display:flex;gap:18px;align-items:flex-start;counter-increment:tips}',
    '.fp-tip::before{content:counter(tips);font-family:"Playfair Display",Georgia,serif;font-size:16px;font-weight:600;color:var(--food-mist);min-width:28px;height:28px;display:flex;align-items:center;justify-content:center;margin-top:2px;flex-shrink:0;background:var(--food-light);border-radius:50%;opacity:0.7}',
    '.fp-tip p{font-size:14.5px;line-height:1.8;color:#44403c;margin:0}',

    /* source note */
    '.fp-source{margin-top:56px;padding-top:28px;border-top:1px solid var(--food-light);text-align:center}',
    '.fp-source p{font-family:"Outfit","DM Sans",sans-serif;font-size:11px;color:#a8a29e;line-height:1.7}',
    '.fp-source a{color:var(--food-secondary);text-decoration:none;border-bottom:1px solid rgba(0,0,0,0.1);transition:border-color 0.3s}',
    '.fp-source a:hover{border-color:var(--food-secondary)}',

    /* animations */
    '@keyframes fpFadeIn{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:scale(1)}}',
    '@keyframes fpSlideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}',
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

    /* shared.css */
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

    /* Google Fonts */
    var pc1 = document.createElement('link');
    pc1.rel = 'preconnect'; pc1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(pc1);

    var pc2 = document.createElement('link');
    pc2.rel = 'preconnect'; pc2.href = 'https://fonts.gstatic.com';
    pc2.crossOrigin = 'anonymous';
    document.head.appendChild(pc2);

    var fontName = (food.titleFont && food.titleFont.trim()) || 'Playfair Display';
    var fontUrl = 'https://fonts.googleapis.com/css2?family='
      + fontName.replace(/ /g, '+')
      + ':ital,wght@0,400;0,700;1,400&display=swap';
    var fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet'; fontLink.href = fontUrl;
    document.head.appendChild(fontLink);

    /* Also load Outfit for UI elements */
    var outfitLink = document.createElement('link');
    outfitLink.rel = 'stylesheet';
    outfitLink.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(outfitLink);

    /* ── hero ── */
    var hasImage = food.heroImage && food.heroImage.length > 0;
    var heroInner = hasImage
      ? '<img class="fp-hero__img" src="' + esc(food.heroImage) + '" alt="' + esc(food.name) + '" onerror="this.style.opacity=\'0\';this.style.position=\'absolute\';this.style.pointerEvents=\'none\'">'
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
        + '<button class="fp-readmore" id="fpReadmore" onclick="window.__fpToggleDesc()">'
        + 'Read more <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>'
        + '</button>'
        + '</div></div>'
        + '<div class="fp-divider"></div>';
    }

    /* ── symptoms & conditions ── */
    var symptomsHTML = '';
    if ((food.symptoms && food.symptoms.length) || (food.conditions && food.conditions.length)) {
      symptomsHTML = '<div class="fp-section">'
        + '<div class="fp-section__label">Helps with</div>'
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
        + '<div class="fp-section__label">Beyond the physical</div>'
        + '<div class="fp-section__title">Emotional Support</div>'
        + paras(food.emotionalSupport)
        + '</div>';
    }

    /* ── spiritual lesson ── */
    var spiritualHTML = '';
    if (food.spiritualLesson && food.spiritualLesson.length) {
      spiritualHTML = '<div class="fp-section">'
        + '<div class="fp-section__label">Deeper wisdom</div>'
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

    /* apply title font */
    var titleEl = document.querySelector('.food-title');
    if (titleEl) titleEl.style.fontFamily = "'" + fontName + "', serif";

    /* scroll reveal with IntersectionObserver */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
        });
      }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
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
      if (btn) {
        btn.classList.toggle('open', open);
        btn.innerHTML = (open ? 'Read less' : 'Read more')
          + ' <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';
      }
    };

    /* inject tabbar */
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
        document.body.innerHTML = '<div style="padding:60px 40px;text-align:center;font-family:Outfit,sans-serif;color:#44403c">'
          + '<h2 style="font-family:Playfair Display,serif;font-size:24px;margin-bottom:12px;color:#1c1917">Food not found</h2>'
          + '<p style="margin-bottom:20px">We couldn\'t find a food matching "' + esc(slug) + '"</p>'
          + '<a href="../" style="color:#b5892e;border-bottom:1px solid rgba(181,137,46,0.3)">Back to Healing Foods</a></div>';
        return;
      }
      render(food);
    })
    .catch(function (err) {
      document.body.innerHTML = '<div style="padding:60px 40px;text-align:center;font-family:Outfit,sans-serif;color:#44403c">'
        + '<h2 style="font-family:Playfair Display,serif;font-size:24px;margin-bottom:12px;color:#1c1917">Error loading food data</h2>'
        + '<p>' + esc(String(err)) + '</p></div>';
    });
})();
