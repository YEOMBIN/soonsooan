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

  // 모바일: 조금 내려온 뒤에만 TOP 버튼 표시
  function onScroll() { quick.classList.toggle('is-scrolled', window.scrollY > 300); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
