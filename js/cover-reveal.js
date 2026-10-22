/* =========================================================
   순수안 소식 → 피부 고민별 치료 프로그램: 스크롤 리빌 (와이어프레임 HfojThAnJysSSjGBbEMA4Z)
   ① 순수안 소식은 화면에 멈춰 있고, 아래로 조금만 스크롤하면 치료 프로그램이 자동으로 올라와 덮음 (헤더 바로 아래에 걸림)
   ② 덮기가 끝나면 제목이 한 글자씩 → 카드가 차례로 등장 (한 번만)
   ③ 위로 조금 스크롤하면 치료 프로그램이 자동으로 내려가 순수안 소식이 다시 보임
   PC(768 이상)만. 모바일·동작 줄이기는 일반 스크롤 + 등장만
   ========================================================= */
(function () {
  'use strict';

  var stack = document.getElementById('ss-stack');
  if (!stack || !window.gsap || !window.ScrollTrigger) return;
  var under = stack.querySelector('[data-under]');
  var cover = document.getElementById('treatment-wrap');
  var head = cover.querySelector('[data-cover-head]');
  var cards = Array.from(cover.querySelectorAll('[data-cover-cards] > li'));
  var gnb = document.getElementById('gnb');
  var eyebrow = head.querySelector('.eyebrow');
  var title = head.querySelector('.sec-title');

  // 제목 글자 나누기 (단어 단위로 감싸 줄바꿈 유지, 글자는 아래에서 올라옴)
  var label = title.textContent.trim();
  title.setAttribute('aria-label', label);
  title.innerHTML = label.split(' ').map(function (w) {
    return '<span class="mk" aria-hidden="true">' + Array.from(w).map(function (c) { return '<span class="mk__c">' + c + '</span>'; }).join('') + '</span>';
  }).join(' ');
  var chars = title.querySelectorAll('.mk__c');

  function gnbH() { return gnb ? gnb.offsetHeight : 0; }
  function coverTop() { return cover.getBoundingClientRect().top + window.scrollY; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  var mm = gsap.matchMedia();
  mm.add({
    desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
    mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)'
  }, function (ctx) {
    var desktop = ctx.conditions.desktop;

    // 순수안 소식 고정 위치: 섹션 전체가 보인 상태(아래 끝이 화면 아래)에서 멈춤
    function setUnder() { under.style.setProperty('--under-top', Math.min(gnbH(), window.innerHeight - under.offsetHeight) + 'px'); }
    if (desktop) { stack.classList.add('is-immersive'); setUnder(); window.addEventListener('resize', setUnder); }

    gsap.set(title, { opacity: 1 });
    gsap.set(eyebrow, { y: 24, opacity: 0 });
    gsap.set(chars, { yPercent: 110, opacity: 0 });
    gsap.set(cards, { y: desktop ? 60 : 36, opacity: 0, clipPath: 'inset(0% 0% 100% 0% round 30px)' });

    var tl = gsap.timeline({ paused: true })
      .to(eyebrow, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' })
      .to(chars, { yPercent: 0, opacity: 1, duration: 1.0, stagger: 0.035, ease: 'power3.out' }, 0.1)
      .to(cards, { y: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 30px)', duration: 1.1, stagger: 0.09, ease: 'power3.out', clearProps: 'clipPath' }, 0.45);

    var played = false;
    var main = ScrollTrigger.create({
      trigger: cover,
      start: function () { return desktop ? 'top ' + (gnbH() + 2) + 'px' : 'top 80%'; },
      onEnter: function () { if (!played) { played = true; tl.play(); } }
    });

    var snap = null, snapping = false;
    if (desktop) {
      // 자동 덮기·되돌리기: 아래로 조금 → 헤더 아래까지 올라옴 / 위로 조금 → 아래로 내려감
      var goTo = function (y) {
        if (snapping) return;
        snapping = true;
        var lenis = window.SS && window.SS.lenis;
        var done = function () { snapping = false; };
        if (lenis) lenis.scrollTo(y, { duration: 1.3, easing: ease, lock: true, force: true, onComplete: done });
        else { window.scrollTo({ top: y, behavior: 'smooth' }); setTimeout(done, 900); }
      };
      snap = ScrollTrigger.create({
        trigger: cover,
        start: 'top bottom',
        end: function () { return 'top ' + gnbH() + 'px'; },
        onUpdate: function (self) {
          if (snapping || (window.SS && window.SS.autoScrolling)) return;
          if (self.direction === 1 && self.progress > 0.03 && self.progress < 1) goTo(coverTop() - gnbH());
          else if (self.direction === -1 && self.progress < 0.97 && self.progress > 0) goTo(coverTop() - window.innerHeight);
        }
      });
    }

    return function () {
      stack.classList.remove('is-immersive');
      window.removeEventListener('resize', setUnder);
      main.kill(); if (snap) snap.kill();
    };
  });
})();
