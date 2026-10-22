/* =========================================================
   05. 브랜드 문장 — 은은하게
   - 배경: gradient-hero 모듈 (색 덩어리 자동 흐름 + 마우스 물결·윤슬, 모바일은 2~4초마다 아주 옅은 물방울)
     물결·윤슬 세기는 이전보다 낮춤 (눈부심 방지)
   - 문구: 섹션이 보이면 천천히 떠오름 (1.4s)
   - 의료진 섹션으로 넘어가며 밝은 색으로 이어지는 짧은 스크롤 전환
   ========================================================= */
(function () {
  'use strict';

  var brand = document.getElementById('brand');
  if (!brand) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.GradientHero && !reduce) {
    GradientHero.init({
      selector: '#brand',
      strength: 90,        // 마우스 방향으로 덩어리가 따라오는 거리 (기본 160 → 은은하게)
      ease: 0.045,
      drift: 200,
      driftSpeed: 0.7,
      rippleStrength: 0.28, // 물결 진하기 (기본 0.5)
      rippleGlint: 0.35,    // 윤슬 (기본 1)
      rippleDamping: 0.975,
      rippleGap: 70,
      mobileRippleForce: 0.35,
      mobileRippleStrength: 0.5,
      mobileRippleGlint: 0.3
    });
  }

  var eyebrow = brand.querySelector('.brand__eyebrow');
  var title = brand.querySelector('.brand__title');
  if (!window.gsap || !window.ScrollTrigger || reduce) {
    [eyebrow, title].forEach(function (n) { n.style.opacity = 1; n.style.transform = 'none'; });
    return;
  }

  var tl = gsap.timeline({ paused: true })
    .to(eyebrow, { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' })
    .to(title, { opacity: 1, y: 0, duration: 1.4, ease: 'power2.out' }, 0.18);
  ScrollTrigger.create({ trigger: brand, start: 'top 72%', once: true, onEnter: function () { tl.play(); } });

  // 의료진 섹션으로 이어지는 색 전환: 섹션 가운데가 화면 위쪽 30%를 지나 헤더 아래로 빠져나가는 동안만 (보고 있는 동안은 원래 색)
  var gnb = document.getElementById('gnb');
  gsap.to(brand.querySelector('.brand__fade'), {
    opacity: 1, ease: 'none',
    scrollTrigger: { trigger: brand, start: 'center 30%', end: function () { return 'bottom ' + (gnb ? gnb.offsetHeight : 0) + 'px'; }, scrub: 0.8, invalidateOnRefresh: true }
  });
})();
