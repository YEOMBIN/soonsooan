/* =========================================================
   우측 퀵 메뉴 — TOP 버튼: 맨 위로 부드럽게 이동
   (이동 중에는 자동 덮기(cover-reveal)가 끼어들지 않게 SS.autoScrolling 표시)
   ========================================================= */
(function () {
  'use strict';

  var quick = document.querySelector('.quick');
  if (!quick) return;
  var top = quick.querySelector('.quick__top');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  top.addEventListener('click', function () {
    var lenis = window.SS && window.SS.lenis;
    if (window.SS) window.SS.autoScrolling = true;
    var done = function () { if (window.SS) window.SS.autoScrolling = false; };
    if (lenis) lenis.scrollTo(0, { duration: 1.4, onComplete: done });
    else { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); setTimeout(done, 1200); }
    var skip = document.querySelector('.gnb__logo');
    if (skip) skip.focus({ preventScroll: true });
  });

  // 모바일(≤767px): 우측 하단 + 버튼 → 5개 메뉴가 위로 펼쳐짐 (2026-11-21)
  var fab = quick.querySelector('.quick__fab');
  if (fab) {
    var setFab = function (open) {
      quick.classList.toggle('is-open', open);
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      fab.setAttribute('aria-label', open ? '빠른 메뉴 닫기' : '빠른 메뉴 열기');
    };
    fab.addEventListener('click', function () {
      var open = !quick.classList.contains('is-open');
      setFab(open);
      if (open) { var first = quick.querySelector('.quick__item'); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60); }
    });
    document.addEventListener('click', function (e) { if (quick.classList.contains('is-open') && !quick.contains(e.target)) setFab(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && quick.classList.contains('is-open')) { setFab(false); fab.focus(); } });
    quick.querySelectorAll('.quick__item').forEach(function (a) { a.addEventListener('click', function () { setTimeout(function () { setFab(false); }, 150); }); });
    var mqm = window.matchMedia('(max-width: 767px)');
    if (mqm.addEventListener) mqm.addEventListener('change', function () { setFab(false); });
  }

  // 모바일: 조금 내려온 뒤에만 TOP 버튼 표시
  function onScroll() { quick.classList.toggle('is-scrolled', window.scrollY > 300); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
