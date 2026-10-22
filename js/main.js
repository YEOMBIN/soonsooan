/* =========================================================
   공통: 부드러운 스크롤(Lenis) · 앵커 이동
   헤더·메뉴는 js/navigation.js, 스크롤 등장은 js/animations.js
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  // 라이브러리를 못 불러와도 내용은 보이도록
  if (!hasGsap) { root.classList.remove('js-on'); }
  else { gsap.registerPlugin(ScrollTrigger); }

  /* ----- 부드러운 스크롤: 마우스 휠 기기만 (터치는 기본 스크롤) ----- */
  var lenis = null;
  if (hasGsap && window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.1, easing: function (t) { return 1 - Math.pow(1 - t, 3); }, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  window.SS = { lenis: lenis, reduce: reduce, hasGsap: hasGsap, autoScrolling: false };

  /* ----- 페이지 안 앵커 이동 (배너 버튼 등) ----- */
  var gnb = document.getElementById('gnb');
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    var y = id === 'top' ? 0 : target.getBoundingClientRect().top + window.scrollY - gnb.offsetHeight;
    window.SS.autoScrolling = true;   // 이동 중에는 자동 덮기(cover-reveal)가 끼어들지 않게
    var done = function () { window.SS.autoScrolling = false; };
    if (lenis) lenis.scrollTo(y, { duration: 1.4, onComplete: done });
    else { window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); setTimeout(done, 1200); }
    if (id !== 'top') { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  });

  window.addEventListener('load', function () { if (hasGsap) ScrollTrigger.refresh(); });
})();
