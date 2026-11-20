/* =========================================================
   순수안 소식 → 프리미엄 라인업(+ 치료 프로그램): Cover Transition (2026-11-20 변경)
   참고: design.solhun.com/transitions/cover-transition — 무한 반복이 아니라 실제 스크롤 진행에 연동
   ① 순수안 소식은 제자리에 고정(sticky)되고
   ② 프리미엄 라인업 묶음이 스크롤 속도 그대로 아래에서 올라와 소식을 덮음 (소식은 밀리지 않음 = Push 아님)
   ③ 위로 스크롤하면 같은 길로 내려가 소식이 다시 보임
   - 장비 라인업 내용(제목·장비 무대)은 별도 등장 모션 없이 Figma 그대로 표시
   - 이어지는 치료 프로그램은 화면에 들어오면 제목 → 카드 등장(기존 유지)
   - prefers-reduced-motion · 모바일(≤767px): 고정 없이 일반 스크롤
   ========================================================= */
(function () {
  'use strict';

  var stack = document.getElementById('ss-stack');
  if (!stack) return;
  var under = stack.querySelector('[data-under]');
  var cover = document.getElementById('treatment-wrap');
  var gnb = document.getElementById('gnb');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobile = window.matchMedia('(max-width: 767px)'); // 모바일: 커버 전환 없이 일반 스크롤 (2026-11-21)

  /* ----- ① ② Cover: 순수안 소식 고정 위치 계산 (CSS sticky — 스크롤과 1:1, 역방향 자연 복귀) ----- */
  function measure() {
    if (reduce.matches || mobile.matches) { stack.classList.remove('is-immersive'); return; }
    var vh = window.innerHeight, g = gnb ? gnb.offsetHeight : 0, nh = under.offsetHeight;
    // 소식이 화면보다 짧으면 헤더 바로 아래에, 길면 아래 끝이 화면 아래에 닿는 순간 고정
    under.style.setProperty('--under-top', Math.min(g, vh - nh) + 'px');
    stack.classList.add('is-immersive');
  }
  measure();
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure);
  if (reduce.addEventListener) { reduce.addEventListener('change', measure); mobile.addEventListener('change', measure); }
  // 소식 탭 전환 등으로 높이가 바뀌면 다시 계산
  if (window.ResizeObserver) new ResizeObserver(measure).observe(under);

  if (!window.gsap || !window.ScrollTrigger) return;

  /* ----- ③ 치료 프로그램: 제목(영문 → 한글 글자) → 카드 등장 (기존 유지, 한 번만) ----- */
  var tHead = cover.querySelector('[data-late-head]');
  var tGrid = cover.querySelector('[data-cards]');
  var tCards = tGrid ? Array.from(tGrid.children) : [];
  function split(el) {
    var label = el.textContent.trim();
    el.setAttribute('aria-label', label);
    el.innerHTML = label.split(' ').map(function (w) {
      return '<span class="mk" aria-hidden="true">' + Array.from(w).map(function (c) { return '<span class="mk__c">' + c + '</span>'; }).join('') + '</span>';
    }).join(' ');
    return el.querySelectorAll('.mk__c');
  }
  var tEyebrow = tHead && tHead.querySelector('.eyebrow, .sec-en');
  var tTitle = tHead && tHead.querySelector('.sec-title');
  var tChars = tTitle ? split(tTitle) : [];

  var mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    if (tHead) {
      gsap.set(tTitle, { opacity: 1 });
      gsap.set(tEyebrow, { y: 20, opacity: 0 });
      gsap.set(tChars, { yPercent: 110, opacity: 0 });
    }
    gsap.set(tCards, { y: window.innerWidth > 767 ? 60 : 36, opacity: 0, clipPath: 'inset(0% 0% 100% 0% round 30px)' });
    var headDone = !tHead, cardsDone = !tGrid;
    function checkT() {
      var vh = window.innerHeight;
      if (!headDone && tHead.getBoundingClientRect().top < vh * 0.85) {
        headDone = true;
        gsap.timeline()
          .to(tEyebrow, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.inOut' })
          .to(tChars, { yPercent: 0, opacity: 1, duration: 1.0, stagger: 0.03, ease: 'power3.inOut' }, 0.1);
      }
      if (!cardsDone && tGrid.getBoundingClientRect().top < vh * 0.85) {
        cardsDone = true;
        gsap.to(tCards, { y: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 30px)', duration: 1.1, stagger: 0.09, ease: 'power3.inOut', delay: 0.2, onComplete: function () { tCards.forEach(function (c) { c.style.clipPath = 'none'; }); } });
      }
      if (headDone && cardsDone) gsap.ticker.remove(checkT);
    }
    gsap.ticker.add(checkT);
    return function () { gsap.ticker.remove(checkT); };
  });
})();
