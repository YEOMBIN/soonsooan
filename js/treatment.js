/* =========================================================
   03. 치료 프로그램 카드 — 마우스 기기는 CSS 호버,
   터치 기기는 첫 탭에 상세 열기 → 다시 탭하면 해당 페이지로 이동
   ========================================================= */
(function () {
  'use strict';

  var cards = Array.from(document.querySelectorAll('.tcard'));
  if (!cards.length || window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  function closeAll(except) { cards.forEach(function (c) { if (c !== except) c.classList.remove('is-open'); }); }

  cards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (!card.classList.contains('is-open')) {
        e.preventDefault();
        closeAll(card);
        card.classList.add('is-open');
      }
    });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.tcard')) closeAll(); });
})();
