/* =========================================================
   순수안 소식 → 프리미엄 라인업(+ 치료 프로그램): 스크롤 리빌 (와이어프레임 HfojThAnJysSSjGBbEMA4Z)
   원장님 수정(2026-11): 순서가 소식 → SOONSOOAN PREMIUM → SIGNATURE SOLUTION 으로 바뀜
   ① 순수안 소식은 화면에 멈춰 있고, 스크롤을 더 내리면 프리미엄·치료 프로그램 묶음이 천천히 올라와 덮음 (헤더 바로 아래에 멈춤)
   ② 덮기가 끝날 즈음 프리미엄 제목이 한 글자씩 → 장비 카드 띠가 등장 (한 번만)
   ③ 이어지는 치료 프로그램은 화면에 들어오면 제목(js/animations.js) → 카드가 차례로 등장
   ④ 위로 스크롤하면 묶음이 다시 내려가 순수안 소식이 보임
   PC(768 이상)만. 모바일·동작 줄이기는 일반 스크롤 + 등장만
   ========================================================= */
(function () {
  'use strict';

  var stack = document.getElementById('ss-stack');
  if (!stack || !window.gsap || !window.ScrollTrigger) return;
  var under = stack.querySelector('[data-under]');
  var cover = document.getElementById('treatment-wrap');
  var head = cover.querySelector('[data-cover-head]');
  var cards = Array.from(cover.querySelectorAll('[data-cover-item]'));
  var tGrid = cover.querySelector('[data-cards]');
  var tCards = tGrid ? Array.from(tGrid.children) : [];
  var gnb = document.getElementById('gnb');
  var eyebrow = head.querySelector('.eyebrow');
  var title = head.querySelector('.sec-title');

  // 제목 글자 나누기 (단어 단위로 감싸 줄바꿈 유지, 글자는 아래에서 올라옴)
  function split(el) {
    var label = el.textContent.trim();
    el.setAttribute('aria-label', label);
    el.innerHTML = label.split(' ').map(function (w) {
      return '<span class="mk" aria-hidden="true">' + Array.from(w).map(function (c) { return '<span class="mk__c">' + c + '</span>'; }).join('') + '</span>';
    }).join(' ');
    return el.querySelectorAll('.mk__c');
  }
  var chars = split(title);
  // 치료 프로그램 제목: 묶음이 아래로 밀려 있는 동안 미리 재생되지 않도록 '실제 화면 위치'로 판단
  var tHead = cover.querySelector('[data-late-head]');
  var tEyebrow = tHead && tHead.querySelector('.eyebrow');
  var tTitle = tHead && tHead.querySelector('.sec-title');
  var tChars = tTitle ? split(tTitle) : [];

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
    gsap.set(cards, { y: desktop ? 60 : 36, opacity: 0 });

    var tl = gsap.timeline({ paused: true })
      .to(eyebrow, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' })
      .to(chars, { yPercent: 0, opacity: 1, duration: 1.0, stagger: 0.035, ease: 'power3.out' }, 0.1)
      .to(cards, { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }, 0.45);
    var played = false;
    function play() { if (!played) { played = true; tl.play(); } }

    // 치료 프로그램: 제목(영문 → 한글 글자) → 카드가 차례로 열리며 등장 (PC·모바일 공통, 한 번만)
    // 묶음이 transform 으로 움직이므로 스크롤 위치 대신 실제 화면 위치(getBoundingClientRect)로 판단
    if (tHead) {
      gsap.set(tTitle, { opacity: 1 });
      gsap.set(tEyebrow, { y: 20, opacity: 0 });
      gsap.set(tChars, { yPercent: 110, opacity: 0 });
    }
    gsap.set(tCards, { y: desktop ? 60 : 36, opacity: 0, clipPath: 'inset(0% 0% 100% 0% round 30px)' });
    var headDone = !tHead, cardsDone = !tGrid;
    function checkT() {
      var vh = window.innerHeight;
      if (!headDone && tHead.getBoundingClientRect().top < vh * 0.85) {
        headDone = true;
        gsap.timeline()
          .to(tEyebrow, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' })
          .to(tChars, { yPercent: 0, opacity: 1, duration: 1.0, stagger: 0.03, ease: 'power3.out' }, 0.1);
      }
      if (!cardsDone && tGrid.getBoundingClientRect().top < vh * 0.85) {
        cardsDone = true;
        gsap.to(tCards, { y: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 30px)', duration: 1.1, stagger: 0.09, ease: 'power3.out', delay: 0.3, onComplete: function () { tCards.forEach(function (c) { c.style.clipPath = 'none'; }); } });
      }
      if (headDone && cardsDone) gsap.ticker.remove(checkT);
    }
    gsap.ticker.add(checkT);
    function killT() { gsap.ticker.remove(checkT); }

    if (!desktop) {
      // 모바일: 일반 스크롤, 화면에 들어오면 등장만
      var mob = ScrollTrigger.create({ trigger: cover, start: 'top 80%', onEnter: play });
      return function () { mob.kill(); killT(); };
    }

    /* PC: 스크롤 양에 맞춰 천천히 덮기
       ① 순수안 소식이 화면에 다 보인 채 멈춤(고정) → ② 화면 높이의 35%만큼은 그대로 머묾(소식 둘러보기)
       ③ 그다음 치료 프로그램이 아래에서 올라옴: 올라오는 거리의 1.8배를 스크롤해야 헤더 아래에 닿음 (스크롤보다 느리게)
       ④ 헤더 아래에 닿으면 화면 높이의 45%만큼 그 자리에 걸려 있다가, 이후 평소처럼 아래로 스크롤됨
       ⑤ 위로 스크롤하면 같은 길을 되돌아 내려감. 움직임은 부드럽게 따라옴(약 0.7초) */
    stack.classList.add('is-immersive');
    var geo = { P0: 0, S: 1, R: 1, Hd: 0, y0: 0 };
    function measure() {
      var vh = window.innerHeight, g = gnbH(), nh = under.offsetHeight;
      var U = Math.min(g, vh - nh);                 // 소식이 멈추는 위치 (아래 끝이 화면 아래에 닿을 때)
      under.style.setProperty('--under-top', U + 'px');
      var N0 = nh + U;                              // 멈춘 순간, 치료 프로그램 윗변의 원래 화면 위치
      var S = Math.round(vh * 0.35);                // 머무는 구간 (화면 높이의 35%)
      var R = Math.round((vh - g) * 1.8);           // 올라오는 구간 (이동 거리 × 1.8)
      var Hd = Math.round(vh * 0.45);               // 헤더 아래에 걸려 있는 구간 (화면 높이의 45%)
      var M = Math.max(0, S + R + Hd + g - N0);     // 그만큼 스크롤 길이를 늘림
      cover.style.marginTop = M + 'px';
      geo = { P0: stack.getBoundingClientRect().top + window.scrollY - U, S: S, R: R, Hd: Hd, y0: vh - N0 - M };
    }
    // 치료 프로그램을 원래 위치에서 얼마나 옮길지 (진행 위치 t: 머묾 → 올라옴 → 걸림)
    function offset(p) {
      var total = geo.S + geo.R + geo.Hd, t = p * total;
      if (t < geo.S) return geo.y0 + t;                                   // 화면 아래에서 대기
      if (t < geo.S + geo.R) {                                            // 천천히 올라옴
        var from = geo.y0 + geo.S, to = -geo.Hd;
        return from + (to - from) * (t - geo.S) / geo.R;
      }
      return t - total;                                                   // 헤더 아래에 고정 (-Hd → 0)
    }
    function reached(p) { return p * (geo.S + geo.R + geo.Hd) >= geo.S + geo.R * 0.9; }
    var follow = gsap.quickTo(cover, 'y', { duration: 0.7, ease: 'power3.out' });
    measure();
    gsap.set(cover, { y: geo.y0 });
    ScrollTrigger.addEventListener('refreshInit', measure);
    var rise = ScrollTrigger.create({
      start: function () { return geo.P0; },
      end: function () { return geo.P0 + geo.S + geo.R + geo.Hd; },
      invalidateOnRefresh: true,
      onUpdate: function (self) { follow(offset(self.progress)); if (reached(self.progress)) play(); },
      onLeave: function () { follow(0); play(); },
      onLeaveBack: function () { follow(geo.y0); },
      onRefresh: function (self) { gsap.set(cover, { y: offset(self.progress) }); }
    });

    return function () {
      stack.classList.remove('is-immersive');
      ScrollTrigger.removeEventListener('refreshInit', measure);
      rise.kill();
      killT();
      gsap.set(cover, { clearProps: 'transform' });
      cover.style.marginTop = '';
    };
  });
})();
