/* =========================================================
   공통: 부드러운 스크롤(Lenis) · 스크롤 등장 · 헤더 · 메뉴 · 앵커 이동
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  // CDN 이 막혀도 내용은 보이도록
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
  window.SS = { lenis: lenis, reduce: reduce, hasGsap: hasGsap };

  /* ----- 스크롤 등장: 0.9s, 부드러운 시작·멈춤, 묶음은 0.12s 간격 ----- */
  if (hasGsap && !reduce) {
    var EASE = 'power2.inOut';
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      once: true,
      onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.12, overwrite: true }); }
    });
    gsap.utils.toArray('[data-reveal-group]').forEach(function (group) {
      ScrollTrigger.create({
        trigger: group, start: 'top 85%', once: true,
        onEnter: function () { gsap.to(group.children, { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.1, overwrite: true }); }
      });
    });
  }

  /* ----- 헤더: 스크롤하면 그림자 ----- */
  var gnb = document.getElementById('gnb');
  function onScroll() { gnb.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----- 모바일 메뉴 ----- */
  var menuBtn = document.querySelector('.gnb__menu');
  var drawer = document.getElementById('drawer');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    if (open) {
      drawer.hidden = false;
      requestAnimationFrame(function () { drawer.classList.add('is-open'); });
      if (lenis) lenis.stop();
    } else {
      drawer.classList.remove('is-open');
      setTimeout(function () { if (!drawer.classList.contains('is-open')) drawer.hidden = true; }, 400);
      if (lenis) lenis.start();
    }
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); } });

  /* ----- 앵커 이동: 고정된(덮이는) 섹션 안쪽도 원래 위치로 계산 ----- */
  function docTop(el) {
    var wrap = el.closest('.cover-under');
    if (wrap && wrap.classList.contains('is-sticky')) {
      var prev = wrap.previousElementSibling;
      var base = prev ? prev.getBoundingClientRect().bottom + window.scrollY : 0;
      // 덮이기 시작하는 지점(묶음 아래 끝이 화면 아래에 닿는 순간)을 넘지 않게
      var stick = base + wrap.offsetHeight - window.innerHeight + gnb.offsetHeight;
      return Math.min(base + (el.getBoundingClientRect().top - wrap.getBoundingClientRect().top), stick);
    }
    return el.getBoundingClientRect().top + window.scrollY;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    if (menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false);
    var y = id === 'top' ? 0 : docTop(target) - gnb.offsetHeight;
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    if (id !== 'top') { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  });

  window.addEventListener('load', function () { if (hasGsap) ScrollTrigger.refresh(); });
})();
