/* =========================================================
   GLOBAL MOTION — 청라빛안과 퍼블리싱 방식을 참고한 공통 등장 모션
   (청라빛안과 확인 결과: AOS fade-up/left/right 1000ms ease-out-cubic, GSAP 3.10 + ScrollTrigger, SplitType, Lenis 1.0)
   여기서는 같은 결을 GSAP 하나로 구현 — 요소 중요도에 따라 모션을 다르게
   - 섹션 제목(.sec-head[data-reveal]): 영문 → 한글 제목 글자 마스크 상승 → 설명 순서
   - [data-reveal]        : 아래에서 떠오름 (1.0s)
   - [data-reveal="clip"] : 이미지가 아래에서 위로 열리며 살짝 축소 (1.3s)
   - [data-reveal-group]  : 자식 요소가 0.1s 간격으로 떠오름
   이징은 모두 power3.out (= ease-out-cubic)
   ========================================================= */
(function () {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger || (window.SS && window.SS.reduce)) return;
  var EASE = 'power3.out';

  function split(el) {
    if (el.dataset.split) return el.querySelectorAll('.mk__c');
    el.dataset.split = '1';
    var label = el.textContent.trim();
    el.setAttribute('aria-label', label);
    el.innerHTML = label.split(' ').map(function (w) {
      return '<span class="mk" aria-hidden="true">' + Array.from(w).map(function (c) { return '<span class="mk__c">' + c + '</span>'; }).join('') + '</span>';
    }).join(' ');
    return el.querySelectorAll('.mk__c');
  }
  function onEnter(el, start, fn) { ScrollTrigger.create({ trigger: el, start: start, once: true, onEnter: fn }); }

  // 섹션 제목
  document.querySelectorAll('.sec-head[data-reveal]').forEach(function (head) {
    var eyebrow = head.querySelector('.eyebrow');
    var title = head.querySelector('.sec-title');
    var desc = head.querySelector('.sec-desc');
    var chars = title ? split(title) : [];
    gsap.set(head, { opacity: 1, y: 0 });
    if (title) gsap.set(title, { opacity: 1 });
    if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 20 });
    gsap.set(chars, { yPercent: 110, opacity: 0 });
    if (desc) gsap.set(desc, { opacity: 0, y: 20 });
    var tl = gsap.timeline({ paused: true });
    if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.8, ease: EASE });
    tl.to(chars, { yPercent: 0, opacity: 1, duration: 1.0, stagger: 0.03, ease: EASE }, 0.1);
    if (desc) tl.to(desc, { opacity: 1, y: 0, duration: 0.9, ease: EASE }, 0.45);
    onEnter(head, 'top 85%', function () { tl.play(); });
  });

  // 이미지 열림
  document.querySelectorAll('[data-reveal="clip"]').forEach(function (el) {
    var img = el.querySelector('img');
    gsap.set(el, { opacity: 1, y: 0, clipPath: 'inset(100% 0% 0% 0%)' });
    if (img) gsap.set(img, { scale: 1.08 });
    onEnter(el, 'top 85%', function () {
      gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power3.inOut', clearProps: 'clipPath' });
      if (img) gsap.to(img, { scale: 1, duration: 1.6, ease: EASE });
    });
  });

  // 일반 요소
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    if (el.classList.contains('sec-head') || el.dataset.reveal === 'clip') return;
    onEnter(el, 'top 88%', function () { gsap.to(el, { opacity: 1, y: 0, duration: 1.0, ease: EASE }); });
  });

  // 묶음
  gsap.utils.toArray('[data-reveal-group]').forEach(function (group) {
    onEnter(group, 'top 85%', function () { gsap.to(group.children, { opacity: 1, y: 0, duration: 1.0, ease: EASE, stagger: 0.1 }); });
  });
})();
