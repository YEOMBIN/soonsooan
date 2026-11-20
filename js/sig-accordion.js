/* =========================================================
   Signature Solution — 모바일(≤767px) 세로 아코디언 (2026-11-21)
   - 첫 카드 기본 펼침, 다른 카드를 누르면 기존 카드는 닫히고 그 카드가 펼쳐짐
   - 펼친 카드를 다시 누르면 닫힘 / 펼친 카드의 'view more'를 누르면 상세 페이지로 이동
   - 펼치고 닫히는 동안 누른 카드의 화면 위치를 고정해 스크롤 점프 방지
   - PC·태블릿은 기존 카드 + hover 그대로 (이 스크립트는 아무것도 하지 않음)
   ========================================================= */
(function () {
  'use strict';

  var grid = document.querySelector('#treatment .tgrid');
  if (!grid) return;
  var cards = Array.from(grid.querySelectorAll('.tgcard'));
  var mq = window.matchMedia('(max-width: 767px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var DUR = 380;

  function setOpen(card, open) {
    card.classList.toggle('is-open', open);
    card.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function apply() {
    if (mq.matches) {
      grid.classList.add('is-acc');
      var any = cards.some(function (c) { return c.classList.contains('is-open'); });
      cards.forEach(function (c, i) { setOpen(c, any ? c.classList.contains('is-open') : i === 0); });
    } else {
      grid.classList.remove('is-acc');
      cards.forEach(function (c) { c.classList.remove('is-open'); c.removeAttribute('aria-expanded'); });
    }
  }

  // 누른 카드의 위치를 전환 동안 고정 (위쪽 카드가 접히며 생기는 점프 방지)
  function hold(card) {
    if (reduce.matches) return;
    var top0 = card.getBoundingClientRect().top;
    var t0 = performance.now();
    var lenis = window.SS && window.SS.lenis;
    (function step(t) {
      var d = card.getBoundingClientRect().top - top0;
      if (Math.abs(d) > 0.5) {
        if (lenis) lenis.scrollTo(window.scrollY + d, { immediate: true, force: true });
        else window.scrollTo(0, window.scrollY + d);
      }
      if (t - t0 < DUR + 80) requestAnimationFrame(step);
    })(t0);
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (!mq.matches) return;
      var open = card.classList.contains('is-open');
      if (open && e.target.closest('.tgcard__more')) return; // 상세 페이지로 이동
      e.preventDefault();
      hold(card);
      cards.forEach(function (c) { if (c !== card) setOpen(c, false); });
      setOpen(card, !open);
    });
  });

  apply();
  if (mq.addEventListener) mq.addEventListener('change', apply);
})();
