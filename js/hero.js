/* =========================================================
   01. 메인 배너 — liet.co.kr 메인 배너 모션 (피그마 102:32)
   7.5s 자동 넘김 · 진행 바 · 일시정지 · 이전/다음 · 스와이프 · 슬라이드별 컨트롤 색
   ========================================================= */
(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  if (!hero) return;
  var slides = Array.from(hero.querySelectorAll('.hero__slide'));
  var controls = hero.querySelector('.hero__controls');
  var bar = hero.querySelector('.hero__progress i');
  var num = hero.querySelector('.hero__num--current');
  var toggle = hero.querySelector('[data-hero="toggle"]');
  var DURATION = 7500;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var index = 0, elapsed = 0, last = 0, raf = 0;
  var paused = reduce, visible = true;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function go(next) {
    next = (next + slides.length) % slides.length;
    if (next === index) return;
    slides[index].classList.remove('is-active');
    slides[index].setAttribute('aria-hidden', 'true');
    index = next;
    var s = slides[index];
    s.removeAttribute('aria-hidden');
    // 다음 슬라이드 이미지를 미리 받아 두고 켬
    s.querySelectorAll('img').forEach(function (img) { img.loading = 'eager'; });
    void s.offsetWidth; // 문구 애니메이션 다시 시작
    s.classList.add('is-active');
    controls.dataset.tone = s.dataset.tone || 'navy';
    num.textContent = pad(index + 1);
    elapsed = 0;
    draw();
  }

  function draw() { bar.style.transform = 'scaleX(' + Math.min(1, elapsed / DURATION).toFixed(4) + ')'; }

  function tick(t) {
    raf = requestAnimationFrame(tick);
    var dt = last ? t - last : 0;
    last = t;
    if (paused || !visible || document.hidden) return;
    elapsed += Math.min(dt, 100);
    if (elapsed >= DURATION) go(index + 1);
    draw();
  }

  function setPaused(p) {
    paused = p;
    hero.classList.toggle('is-paused', p);
    toggle.setAttribute('aria-pressed', String(p));
    toggle.setAttribute('aria-label', p ? '자동 재생 시작' : '자동 재생 일시정지');
  }

  hero.querySelector('[data-hero="prev"]').addEventListener('click', function () { go(index - 1); });
  hero.querySelector('[data-hero="next"]').addEventListener('click', function () { go(index + 1); });
  toggle.addEventListener('click', function () { setPaused(!paused); });

  // 스와이프 (가로 45px 이상)
  var sx = 0, sy = 0, tracking = false;
  hero.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' || e.target.closest('.hero__controls')) return;
    tracking = true; sx = e.clientX; sy = e.clientY;
  });
  hero.addEventListener('pointerup', function (e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
  });
  hero.addEventListener('pointercancel', function () { tracking = false; });

  // 화면 밖에서는 멈춤
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.15 }).observe(hero);

  // 첫 화면: 한 프레임 뒤 켜서 배경 확대→축소와 문구 상승이 처음부터 부드럽게 재생
  slides.forEach(function (s, i) { if (i) s.setAttribute('aria-hidden', 'true'); });
  controls.dataset.tone = slides[0].dataset.tone;
  setPaused(paused);
  requestAnimationFrame(function () { requestAnimationFrame(function () { slides[0].classList.add('is-active'); }); });
  raf = requestAnimationFrame(tick);

  // 첫 화면이 다 뜬 뒤 나머지 배너 이미지 미리 받기
  window.addEventListener('load', function () {
    hero.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; });
  });
})();
