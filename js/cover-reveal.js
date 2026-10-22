/* =========================================================
   순수안 소식 → 피부 고민별 치료 프로그램: 스크롤 리빌 (와이어프레임 HfojThAnJysSSjGBbEMA4Z)
   ① 순수안 소식은 화면에 멈춰 있고, 스크롤을 더 내리면 치료 프로그램이 천천히 올라와 덮음 (헤더 바로 아래에 멈춤)
   ② 덮기가 끝날 즈음 제목이 한 글자씩 → 카드가 차례로 등장 (한 번만)
   ③ 위로 스크롤하면 치료 프로그램이 다시 내려가 순수안 소식이 보임
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

  var mm = gsap.matchMedia();
  mm.add({
    desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
    mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)'
  }, function (ctx) {
    var desktop = ctx.conditions.desktop;

    gsap.set(title, { opacity: 1 });
    gsap.set(eyebrow, { y: 24, opacity: 0 });
    gsap.set(chars, { yPercent: 110, opacity: 0 });
    gsap.set(cards, { y: desktop ? 60 : 36, opacity: 0, clipPath: 'inset(0% 0% 100% 0% round 30px)' });

    var tl = gsap.timeline({ paused: true })
      .to(eyebrow, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' })
      .to(chars, { yPercent: 0, opacity: 1, duration: 1.0, stagger: 0.035, ease: 'power3.out' }, 0.1)
      .to(cards, { y: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 30px)', duration: 1.1, stagger: 0.09, ease: 'power3.out', clearProps: 'clipPath' }, 0.45);
    var played = false;
    function play() { if (!played) { played = true; tl.play(); } }

    if (!desktop) {
      // 모바일: 일반 스크롤, 화면에 들어오면 등장만
      var mob = ScrollTrigger.create({ trigger: cover, start: 'top 80%', onEnter: play });
      return function () { mob.kill(); };
    }

    /* PC: 스크롤 양에 맞춰 천천히 덮기
       ① 순수안 소식이 화면에 다 보인 채 멈춤(고정) → ② 화면 높이의 35%만큼은 그대로 머묾(소식 둘러보기)
       ③ 그다음 치료 프로그램이 아래에서 올라옴: 올라오는 거리의 1.8배를 스크롤해야 헤더 아래에 닿음 (스크롤보다 느리게)
       ④ 위로 스크롤하면 같은 길을 되돌아 내려감. 움직임은 부드럽게 따라옴(약 0.7초) */
    stack.classList.add('is-immersive');
    var geo = { P0: 0, S: 1, R: 1, y0: 0 };
    function measure() {
      var vh = window.innerHeight, g = gnbH(), nh = under.offsetHeight;
      var U = Math.min(g, vh - nh);                 // 소식이 멈추는 위치 (아래 끝이 화면 아래에 닿을 때)
      under.style.setProperty('--under-top', U + 'px');
      var N0 = nh + U;                              // 멈춘 순간, 치료 프로그램 윗변의 원래 화면 위치
      var S = Math.round(vh * 0.35);                // 머무는 구간 (화면 높이의 35%)
      var R = Math.round((vh - g) * 1.8);           // 올라오는 구간 (이동 거리 × 1.8)
      var M = Math.max(0, S + R + g - N0);          // 그만큼 스크롤 길이를 늘림
      cover.style.marginTop = M + 'px';
      geo = { P0: stack.getBoundingClientRect().top + window.scrollY - U, S: S, R: R, y0: vh - N0 - M };
    }
    function offset(p) {
      var t = p * (geo.S + geo.R);
      return t < geo.S ? geo.y0 + t : (geo.y0 + geo.S) * (1 - (t - geo.S) / geo.R);
    }
    var follow = gsap.quickTo(cover, 'y', { duration: 0.7, ease: 'power3.out' });
    measure();
    gsap.set(cover, { y: geo.y0 });
    ScrollTrigger.addEventListener('refreshInit', measure);
    var rise = ScrollTrigger.create({
      start: function () { return geo.P0; },
      end: function () { return geo.P0 + geo.S + geo.R; },
      invalidateOnRefresh: true,
      onUpdate: function (self) { follow(offset(self.progress)); if (self.progress > 0.9) play(); },
      onLeave: function () { follow(0); play(); },
      onLeaveBack: function () { follow(geo.y0); },
      onRefresh: function (self) { gsap.set(cover, { y: offset(self.progress) }); }
    });

    return function () {
      stack.classList.remove('is-immersive');
      ScrollTrigger.removeEventListener('refreshInit', measure);
      rise.kill();
      gsap.set(cover, { clearProps: 'transform' });
      cover.style.marginTop = '';
    };
  });
})();
