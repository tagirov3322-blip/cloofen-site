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
    { slug: 'checkout',   title: 'Stripe',      desc: 'UI motion — interface animation' }
  ];

  var COLS = 3;

  var doc = document.documentElement;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animate = hasGSAP && !reduced;

  var grid = document.getElementById('grid');

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

  /* Одновременно играет не больше MAX превью.
     Раньше запускались все видимые сразу: на десктопе сетка 3×3 влезает
     в экран целиком, и девять декодеров H.264 работали параллельно —
     слабые машины на этом захлёбывались. Остальные карточки показывают
     постер или замерший кадр, разницы на глаз почти нет. */
  function watchPreviews() {
    var cards = Array.prototype.slice.call(grid.children);
    var MAX = window.matchMedia('(pointer: coarse)').matches ? 2 : 4;
    var visible = [];

    function apply() {
      cards.forEach(function (card) {
        var v = card.querySelector('video');
        if (!v) return;
        var i = visible.indexOf(card);
        if (i > -1 && i < MAX) {
          if (v.preload !== 'auto') v.preload = 'auto';
          if (v.paused) {
            v.addEventListener('playing', function () { card.classList.add('ready'); }, { once: true });
            var pr = v.play();
            if (pr && pr.catch) pr.catch(function () { /* автоплей может быть запрещён */ });
          }
        } else if (!v.paused) {
          v.pause();   /* класс ready не снимаем: пусть остаётся замерший кадр */
        }
      });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = visible.indexOf(e.target);
        if (e.isIntersecting && i === -1) visible.push(e.target);
        else if (!e.isIntersecting && i > -1) visible.splice(i, 1);
      });
      apply();
    }, { threshold: 0.25 });

    cards.forEach(function (c) { io.observe(c); });
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

  function bindGrid() {
    Array.prototype.forEach.call(grid.children, function (card) {
      var i = parseInt(card.dataset.index, 10);
      card.addEventListener('click', function () { openLB(i); });
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

  /* ─── 4. Копирование почты ────────────────────────────────────── */

  function initCopyMail() {
    var btn = document.getElementById('copyMail');
    if (!btn) return;
    var hint = document.getElementById('copyHint');
    var idle = hint.textContent;
    var timer = null;

    function fallback(text) {
      /* clipboard API живёт только на https и localhost — на голом http
         нужен старый путь через скрытое поле */
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }

    function done(ok) {
      hint.textContent = ok ? 'Copied' : 'Press Ctrl+C';
      btn.classList.add('copied');
      clearTimeout(timer);
      timer = setTimeout(function () {
        btn.classList.remove('copied');
        setTimeout(function () { hint.textContent = idle; }, 300);
      }, 1600);
    }

    btn.addEventListener('click', function () {
      var mail = btn.dataset.mail;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mail)
          .then(function () { done(true); })
          .catch(function () { done(fallback(mail)); });
      } else {
        done(fallback(mail));
      }
    });
  }

  /* ─── 4. Плавная прокрутка по ссылкам навигации ─────────────────
     Своя, а не CSS scroll-behavior: браузерная плавная прокрутка отдаёт
     ScrollTrigger позицию с задержкой, из-за чего триггеры первого экрана
     залипали в конечном состоянии и он пропадал. Здесь позиция ставится
     напрямую каждый кадр — ST видит её честно. */

  function initSmoothLinks() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();

        var from = window.scrollY;
        var to = Math.max(0, Math.min(
          target.getBoundingClientRect().top + from,
          document.documentElement.scrollHeight - window.innerHeight
        ));
        if (reduce) { window.scrollTo(0, to); return; }

        var dist = to - from;
        var dur = Math.min(1100, Math.max(450, Math.abs(dist) * 0.55));
        var start = null;

        requestAnimationFrame(function step(now) {
          if (start === null) start = now;
          var p = Math.min(1, (now - start) / dur);
          var e2 = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
          window.scrollTo(0, from + dist * e2);
          if (p < 1) requestAnimationFrame(step);
        });
      });
    });
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
      .to('.hero .scroll-cue', { opacity: 1, duration: .8 }, .66);

    if (!ST) { doc.classList.add('reveal'); return heroTL; }

    /* Первый экран уезжает параллаксом */
    gsap.to('#heroMedia', {
      yPercent: 12, scale: 1.05, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6, invalidateOnRefresh: true }
    });
    /* Отдельным триггером, потому что затухание должно закончиться
       раньше движения — к нижней кромке видео уже растворено в фон */
    gsap.to('#heroMedia', {
      opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: '38% top', end: 'bottom top', scrub: .6, invalidateOnRefresh: true }
    });
    gsap.to('.hero-inner', {
      opacity: 0, yPercent: -14, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '55% top', scrub: .6, invalidateOnRefresh: true }
    });

    /* Заголовки секций: линия чертится, текст расшифровывается */
    gsap.utils.toArray('.sec-head').forEach(function (head) {
      var h2 = head.querySelector('h2');
      ST.create({
        trigger: head, start: 'top 82%', once: true,
        onEnter: function () {
          if (h2) gsap.from(h2, { opacity: 0, y: 22, duration: .9, ease: 'expo.out' });
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
          opacity: 1, y: 0, duration: 1.05, stagger: .09, ease: 'expo.out', overwrite: true
        });
      }
    });

    return heroTL;
  }

  /* ─── 9. Запуск ───────────────────────────────────────────────── */

  function boot() {
    doc.dataset.booted = '1';
    buildGrid();
    bindGrid();
    watchPreviews();

    /* Прокрутка и копирование почты — не украшения: они обязаны работать
       и при отключённых анимациях, поэтому идут ДО раннего выхода. */
    initSmoothLinks();
    initCopyMail();

    if (!animate) {
      doc.classList.add('reveal');
      return;
    }

    /* Загрузчика больше нет: постер видео рисуется мгновенно и держит
       первый экран, пока подтягивается сам ролик. Ждать нечего. */
    var heroTL = initAnimations();
    if (heroTL) heroTL.play(0);

    /* Метаданные ролика и шрифты приезжают после первого расчёта позиций.
       Без пересчёта start/end триггеров уезжают относительно вёрстки. */
    if (window.ScrollTrigger) {
      var reel = document.getElementById('reel');
      if (reel) reel.addEventListener('loadedmetadata', function () { window.ScrollTrigger.refresh(); }, { once: true });
      window.addEventListener('load', function () { window.ScrollTrigger.refresh(); }, { once: true });
    }

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () {
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
