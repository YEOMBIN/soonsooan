/* =========================================================
   04. 프리미엄 라인업 — 대형 이미지 센터 슬라이더 (Swiper)
   가운데 장비가 크게, 양옆 이전·다음 장비 일부 노출 · 무한 반복
   전환 0.9s ease-in-out · 순서(01 / 08) + 진행 바 · 키보드(←/→)·스와이프
   ========================================================= */
(function () {
  'use strict';

  var root = document.querySelector('.pslider');
  if (!root || !window.Swiper) return;
  var stage = root.closest('.premium__stage');
  var countEl = stage.querySelector('.pslider__count b');
  var bar = stage.querySelector('.pslider__progress i');
  var total = root.querySelectorAll('.swiper-slide').length;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (bar) bar.style.width = (100 / total) + '%';

  function sync(sw) {
    var i = sw.realIndex;
    if (countEl) countEl.textContent = (i < 9 ? '0' : '') + (i + 1);
    if (bar) bar.style.transform = 'translateX(' + (i * 100) + '%)';
    // 화면 밖 슬라이드 안의 링크는 탭 이동에서 제외
    sw.slides.forEach(function (s) {
      var on = s.classList.contains('swiper-slide-active');
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
      s.querySelectorAll('a').forEach(function (a) { a.tabIndex = on ? 0 : -1; });
    });
  }

  var swiper = new Swiper(root, {
    slidesPerView: 'auto',
    centeredSlides: true,
    loop: true,
    speed: reduce ? 0 : 900,
    spaceBetween: 24,
    grabCursor: true,
    slideToClickedSlide: true,
    keyboard: { enabled: true, onlyInViewport: true },
    navigation: { prevEl: stage.querySelector('.pslider__arrow--prev'), nextEl: stage.querySelector('.pslider__arrow--next') },
    breakpoints: { 768: { spaceBetween: 32 }, 1025: { spaceBetween: 48 }, 1441: { spaceBetween: Math.round(130 * Math.min(1, window.innerWidth / 1920)) } },
    on: { afterInit: function (sw) { sw.slideToLoop(0, 0, false); sync(sw); }, realIndexChange: sync }
  });

  // 양옆 장비를 누르면 해당 장비로 이동(링크로 바로 넘어가지 않게)
  root.addEventListener('click', function (e) {
    var slide = e.target.closest('.swiper-slide');
    if (slide && !slide.classList.contains('swiper-slide-active')) e.preventDefault();
  }, true);

  window.SSPremium = swiper;
})();
