(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 화면 폭에 따른 배너 스케일 (Figma 버전 값 보간) ---------- */
  function lerp(a, b, t) { return a + (b - a) * Math.min(1, Math.max(0, t)); }

  function updateScale() {
    var w = window.innerWidth;
    var s, dk, k, mk = 1;
    if (w >= 1440) {            // PC 1440 → 1920
      var t = (w - 1440) / 480;
      s = lerp(0.85, 1, t);
      dk = lerp(0.75, 1, t);
      k = lerp(0.75, 1, t);
    } else if (w >= 768) {      // Tablet 800 → 1440
      var t2 = (w - 800) / 640;
      s = lerp(0.6, 0.85, t2);
      dk = lerp(0.55, 0.75, t2);
      k = lerp(0.5, 0.75, t2);
    } else {                    // Mobile 375 기준
      s = 0.6;
      dk = 0.55;
      mk = Math.min(w / 375, 680 / 560);
      k = 0.45 * mk;
    }
    root.style.setProperty('--s', s.toFixed(4));
    root.style.setProperty('--dk', dk.toFixed(4));
    root.style.setProperty('--k', k.toFixed(4));
    root.style.setProperty('--mk', mk.toFixed(4));
  }
  updateScale();
  window.addEventListener('resize', updateScale);

  /* ---------- 메인 배너 슬라이더 ---------- */
  var hero = document.querySelector('.hero');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dots button'));
  var current = 0;
  var timer = null;
  var DELAY = 6000;

  function go(i) {
    var next = (i + slides.length) % slides.length;
    if (next === current) return;
    slides[current].classList.remove('is-active');
    dots[current].setAttribute('aria-selected', 'false');
    current = next;
    slides[current].classList.add('is-active');
    dots[current].setAttribute('aria-selected', 'true');
  }
  function play() {
    if (reduceMotion) return;
    stop();
    timer = window.setInterval(function () { go(current + 1); }, DELAY);
  }
  function stop() { if (timer) { window.clearInterval(timer); timer = null; } }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { go(i); play(); });
  });
  hero.addEventListener('mouseenter', stop);
  hero.addEventListener('mouseleave', play);

  // swipe
  var startX = null;
  hero.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; stop(); }, { passive: true });
  hero.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
    startX = null;
    play();
  });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : play(); });

  // ?slide=2 로 특정 배너부터 보기
  var start = parseInt(new URLSearchParams(location.search).get('slide'), 10);
  if (start >= 1 && start <= slides.length) go(start - 1);
  play();

  /* ---------- 햄버거 메뉴 ---------- */
  var drawer = document.getElementById('drawer');
  var burger = document.querySelector('.btn-hamburger');
  function setDrawer(open) {
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setDrawer(true); });
  drawer.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) setDrawer(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });
  window.matchMedia('(min-width: 1440px)').addEventListener('change', function (m) { if (m.matches) setDrawer(false); });

  /* ---------- TOP 버튼 ---------- */
  var topBtn = document.querySelector('[data-top]');
  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
})();
