/* CLOOFEN — cgi artist portfolio
   Ванильный JS + GSAP c CDN. GSAP считается опциональным: если он не
   доехал, ставим html.reveal и сайт работает как статика. */

(function () {
  'use strict';

  /* ─── Данные работ ─────────────────────────────────────────────
     Порядок в массиве = порядок в сетке. Slug должен совпадать с
     именами в media/: <slug>-preview.mp4, <slug>.mp4, <slug>.jpg    */
  var WORKS = [
    { slug: 'byreal',     title: 'Byreal',      desc: 'Product film — Bybit' },
    { slug: 'solayer',    title: 'Solayer',     desc: 'Product 3D — card launch' },
    { slug: 'bleap',      title: 'Bleap',       desc: 'Product film — fintech app' },
    { slug: 'mr-stephen', title: 'Mr. Stephen', desc: 'CG environment — short film' },
    { slug: 'sentient',   title: 'Sentient',    desc: 'CG world — concept & animation' },
    { slug: 'stable',     title: 'Stable',      desc: 'Product film — CG & interface' },
    { slug: 'noise',      title: 'Noise',       desc: 'Motion graphics — funding round' },
    { slug: 'seismic',    title: 'Seismic',     desc: 'Brand identity in 3D' },
    { slug: 'checkout',   title: 'Checkout',    desc: 'UI motion — interface animation' }
  ];

  var COLS = 3;

  var doc = document.documentElement;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animate = hasGSAP && !reduced;

  var grid   = document.getElementById('grid');
  var intro  = document.getElementById('intro');

  /* ─── 1. Сетка работ ──────────────────────────────────────────── */

  function buildGrid() {
    var frag = document.createDocumentFragment();

    WORKS.forEach(function (w, i) {
      var b = document.createElement('button');
      b.className = 'card anim';
      b.type = 'button';
      b.dataset.index = i;
      b.setAttribute('aria-label', w.title + ' — ' + w.desc);

      var num = String(i + 1).padStart(2, '0');
      b.innerHTML =
        '<img src="media/' + w.slug + '.jpg" alt="" loading="eager" decoding="async">' +
        '<video src="media/' + w.slug + '-preview.mp4" poster="media/' + w.slug + '.jpg"' +
        ' muted loop playsinline preload="metadata"></video>' +
        '<span class="card-meta">' +
          '<span><span class="t">' + w.title + '</span>' +
          '<span class="d">' + w.desc + '</span></span>' +
          '<span class="n">' + num + '</span>' +
        '</span>';

      frag.appendChild(b);
    });

    grid.appendChild(frag);
  }

  /* Высота сетки считается из ширины ячейки, чтобы в покое плитки были
     ровно 16:9, а анимация раскрытия шла по фиксированной коробке. */
  function sizeGrid() {
    if (!canExpand()) { grid.style.removeProperty('--grid-h'); return; }
    var gap = parseFloat(getComputedStyle(grid).columnGap) || 12;
    var cell = (grid.clientWidth - gap * (COLS - 1)) / COLS;
    var rows = Math.ceil(WORKS.length / COLS);
    grid.style.setProperty('--grid-h', (cell * 9 / 16 * rows + gap * (rows - 1)) + 'px');
  }

  function canExpand() {
    return window.matchMedia('(min-width: 862px) and (hover: hover)').matches;
  }

  function expand(index) {
    if (!canExpand()) return;
    var rows = Math.ceil(WORKS.length / COLS);
    var col = index % COLS, row = Math.floor(index / COLS);

    var c = [], r = [], i;
    for (i = 0; i < COLS; i++) c.push(i === col ? '1.6fr' : '0.7fr');
    for (i = 0; i < rows; i++) r.push(i === row ? '1.44fr' : '0.78fr');

    grid.style.gridTemplateColumns = c.join(' ');
    grid.style.gridTemplateRows = r.join(' ');
    grid.classList.add('dim');
  }

  function collapse() {
    grid.style.removeProperty('grid-template-columns');
    grid.style.removeProperty('grid-template-rows');
    grid.classList.remove('dim');
  }

  /* Превью играют только пока видимы — девять одновременных декодов
     сажают батарею и роняют fps даже на десктопе. */
  function watchPreviews() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var card = e.target, v = card.querySelector('video');
        if (!v) return;
        if (e.isIntersecting) {
          if (v.preload !== 'auto') v.preload = 'auto';
          var p = v.play();
          if (p && p.catch) p.catch(function () { /* автоплей может быть запрещён */ });
          v.addEventListener('playing', function () { card.classList.add('ready'); }, { once: true });
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.25 });

    Array.prototype.forEach.call(grid.children, function (c) { io.observe(c); });
  }

  /* ─── 2. Лайтбокс ─────────────────────────────────────────────── */

  var lb = document.getElementById('lb');
  var lbVideo = document.getElementById('lbVideo');
  var lbTitle = document.getElementById('lbTitle');
  var lbDesc = document.getElementById('lbDesc');
  var lastFocus = null;

  var lbIndex = 0;

  function loadLB(i) {
    var w = WORKS[i];
    if (!w) return;
    lbIndex = i;
    lbTitle.textContent = w.title;
    lbDesc.textContent = w.desc;
    lbVideo.poster = 'media/' + w.slug + '.jpg';
    lbVideo.src = 'media/' + w.slug + '.mp4';   /* грузим только по клику */
    var p = lbVideo.play();
    if (p && p.catch) p.catch(function () {});
  }

  function stepLB(dir) {
    var next = (lbIndex + dir + WORKS.length) % WORKS.length;
    if (animate) {
      window.gsap.fromTo(lbVideo, { opacity: .25 }, { opacity: 1, duration: .45, ease: 'power2.out' });
    }
    loadLB(next);
  }

  function openLB(i) {
    if (!WORKS[i]) return;
    lastFocus = document.activeElement;
    loadLB(i);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (animate) {
      window.gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: .32, ease: 'power2.out' });
      window.gsap.fromTo(lb.querySelector('.lb-inner'),
        { scale: .94, y: 18 }, { scale: 1, y: 0, duration: .55, ease: 'expo.out' });
    } else {
      lb.style.opacity = 1;
    }

    document.getElementById('lbClose').focus();
  }

  function closeLB() {
    lb.classList.remove('open');
    lbVideo.pause();
    lbVideo.removeAttribute('src');   /* снимаем src, иначе видео качается в фоне */
    lbVideo.load();
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  /* ─── 3. Ввод: мышь, клавиатура ───────────────────────────────── */

  var hoverTimer = null;

  function bindGrid() {
    Array.prototype.forEach.call(grid.children, function (card) {
      var i = parseInt(card.dataset.index, 10);
      card.addEventListener('mouseenter', function () {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { expand(i); }, 70);
      });
      card.addEventListener('focus', function () { clearTimeout(hoverTimer); expand(i); });
      card.addEventListener('click', function () { openLB(i); });
    });
    grid.addEventListener('mouseleave', function () { clearTimeout(hoverTimer); collapse(); });
    grid.addEventListener('focusout', function (e) {
      if (!grid.contains(e.relatedTarget)) collapse();
    });

    grid.addEventListener('keydown', function (e) {
      var keys = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLS, ArrowDown: COLS };
      if (!(e.key in keys)) return;
      var cur = parseInt(document.activeElement.dataset.index, 10);
      if (isNaN(cur)) return;
      var next = cur + keys[e.key];
      if (next < 0 || next >= WORKS.length) return;
      e.preventDefault();
      grid.children[next].focus();
    });
  }

  document.getElementById('lbClose').addEventListener('click', closeLB);
  document.getElementById('lbPrev').addEventListener('click', function () { stepLB(-1); });
  document.getElementById('lbNext').addEventListener('click', function () { stepLB(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLB(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLB();
    else if (e.key === 'ArrowLeft') stepLB(-1);
    else if (e.key === 'ArrowRight') stepLB(1);
  });

  /* ─── 4. Курсор ───────────────────────────────────────────────── */

  function initCursor() {
    if (!animate) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var dot = document.getElementById('cur');
    var ring = document.getElementById('curRing');
    var label = ring.querySelector('span');
    var gsap = window.gsap;

    var xd = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power3' });
    var yd = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power3' });
    var xr = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' });
    var yr = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });

    var shown = false;
    window.addEventListener('mousemove', function (e) {
      if (!shown) { shown = true; gsap.to([dot, ring], { opacity: 1, duration: .3 }); }
      xd(e.clientX); yd(e.clientY); xr(e.clientX); yr(e.clientY);
    });

    document.addEventListener('mouseleave', function () {
      shown = false; gsap.to([dot, ring], { opacity: 0, duration: .2 });
    });

    function grow(on, text) {
      if (text) label.textContent = text;
      gsap.to(ring, { scale: on ? 1.55 : 1, borderColor: on ? '#00ffa8' : 'rgba(255,255,255,.2)', duration: .4, ease: 'expo.out' });
      gsap.to(label, { opacity: (on && text) ? 1 : 0, duration: .25 });
      gsap.to(dot, { opacity: on ? 0 : 1, duration: .25 });
    }

    Array.prototype.forEach.call(grid.children, function (c) {
      c.addEventListener('mouseenter', function () { grow(true, 'PLAY'); });
      c.addEventListener('mouseleave', function () { grow(false); });
    });
    document.querySelectorAll('a, button').forEach(function (el) {
      if (el.classList.contains('card')) return;
      el.addEventListener('mouseenter', function () { grow(true, ''); });
      el.addEventListener('mouseleave', function () { grow(false); });
    });
  }

  /* Кнопки тянутся к курсору */
  function initMagnetic() {
    if (!animate) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var gsap = window.gsap;

    document.querySelectorAll('.magnetic').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'elastic.out(1, .4)' });
      var yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'elastic.out(1, .4)' });

      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * .38);
        yTo((e.clientY - (r.top + r.height / 2)) * .5);
      });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ─── 5. Расшифровка текста ───────────────────────────────────── */

  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&/\\|<>*+=';

  function scramble(el, done) {
    /* Работает только по чистому тексту: элемент с детьми (например с
       <br>) развалился бы в одну строку. */
    if (el.children.length) { if (done) done(); return; }
    var final = el.dataset.text || el.textContent;
    el.dataset.text = final;

    var frame = 0, total = 26;
    var seeds = final.split('').map(function () { return Math.floor(Math.random() * 14); });

    var id = setInterval(function () {
      el.textContent = final.split('').map(function (ch, i) {
        if (ch === ' ') return ' ';
        if (frame >= seeds[i] + 10) return ch;
        if (frame >= seeds[i]) return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        return '';
      }).join('');

      if (++frame > total) {
        clearInterval(id);
        el.textContent = final;
        if (done) done();
      }
    }, 26);
  }

  /* ─── 7. Анимации ─────────────────────────────────────────────── */

  function initAnimations() {
    var gsap = window.gsap;
    var ST = window.ScrollTrigger;
    if (ST) gsap.registerPlugin(ST);

    /* Первый экран */
    var heroTL = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
    heroTL
      .fromTo('#reel', { scale: 1.14 }, { scale: 1, duration: 2.4, ease: 'power2.out' }, 0)
      .to('.hero .label', { opacity: 1, duration: .8 }, .1)
      .to('h1 .line > span', { y: '0%', duration: 1.15, stagger: .085 }, .18)
      .to('.hero .btn', { opacity: 1, y: 0, duration: .8 }, .62)
      .to('.hero .scroll-cue', { opacity: 1, duration: .8 }, .74);

    gsap.set('.hero .btn', { y: 16 });

    if (!ST) { doc.classList.add('reveal'); return heroTL; }

    /* Первый экран уезжает параллаксом */
    gsap.to('#heroMedia', {
      yPercent: 12, scale: 1.05, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 }
    });
    /* Отдельным триггером, потому что затухание должно закончиться
       раньше движения — к нижней кромке видео уже растворено в фон */
    gsap.to('#heroMedia', {
      opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: '38% top', end: 'bottom top', scrub: .6 }
    });
    gsap.to('.hero-inner', {
      opacity: 0, yPercent: -14, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '55% top', scrub: .6 }
    });

    /* Заголовки секций: линия чертится, текст расшифровывается */
    gsap.utils.toArray('.sec-head').forEach(function (head) {
      var rule = head.querySelector('.rule');
      var h2 = head.querySelector('h2[data-scramble]');
      ST.create({
        trigger: head, start: 'top 82%', once: true,
        onEnter: function () {
          if (rule) gsap.to(rule, { scaleX: 1, duration: 1.1, ease: 'expo.out' });
          if (h2) scramble(h2);
        }
      });
    });

    /* Контактный заголовок — с <br>, скрамблу не поддаётся: просто выезжает */
    gsap.from('#contact h2', {
      opacity: 0, y: 40, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: '#contact', start: 'top 78%', once: true }
    });

    /* Всё помеченное .anim вне первого экрана — пачками по мере входа */
    var batchTargets = gsap.utils.toArray('.anim').filter(function (el) {
      return !el.closest('.hero');
    });

    gsap.set(batchTargets, { y: 26 });

    ST.batch(batchTargets, {
      start: 'top 88%',
      once: true,
      onEnter: function (els) {
        gsap.to(els, {
          opacity: 1, y: 0, duration: .95, stagger: .07, ease: 'expo.out', overwrite: true
        });
      }
    });

    return heroTL;
  }

  /* ─── 9. Запуск ───────────────────────────────────────────────── */

  function boot() {
    doc.dataset.booted = '1';
    buildGrid();
    sizeGrid();
    bindGrid();
    watchPreviews();

    if (!animate) {
      doc.classList.add('reveal');
      if (intro) { intro.dataset.done = '1'; intro.style.display = 'none'; }
      return;
    }

    initCursor();
    initMagnetic();

    /* Загрузчика больше нет: постер видео рисуется мгновенно и держит
       первый экран, пока подтягивается сам ролик. Ждать нечего. */
    var heroTL = initAnimations();
    if (heroTL) heroTL.play(0);

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        collapse();
        sizeGrid();
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      }, 180);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
