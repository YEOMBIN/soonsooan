/* =========================================================
   Footer Reveal
   1) 본문이 위로 걷히면서 뒤에 고정된 푸터가 드러남 (CSS sticky)
   2) 드러나는 만큼 푸터 내용이 위에서 내려오며 커지고 선명해짐 (스크롤 연동)
   의존성 없음. 사용: FooterReveal.init();
   ========================================================= */
(function (global) {
  'use strict';

  var DEFAULTS = {
    main: '.fr-main',        // 푸터를 덮는 본문 묶음
    footer: '.fr-footer',    // 푸터
    minWidth: 768,           // 이 너비 이상에서만 적용 (모바일은 일반 푸터)
    fromY: -100,             // 내용 시작 위치(px). 음수 = 위에서 내려옴
    fromScale: 0.9,          // 내용 시작 크기
    fromOpacity: 0           // 내용 시작 투명도
  };

  function init(options) {
    var opts = Object.assign({}, DEFAULTS, options || {});
    var main = document.querySelector(opts.main);
    var footer = document.querySelector(opts.footer);
    if (!main || !footer) return null;

    var root = document.documentElement;
    var items = Array.from(footer.querySelectorAll('[data-fr-content]'));
    var reduce = global.matchMedia('(prefers-reduced-motion: reduce)');
    var ticking = false, active = false;

    function applyProgress(p) {
      var y = opts.fromY * (1 - p);
      var s = opts.fromScale + (1 - opts.fromScale) * p;
      var o = opts.fromOpacity + (1 - opts.fromOpacity) * p;
      items.forEach(function (el) {
        el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0) scale(' + s.toFixed(4) + ')';
        el.style.opacity = o.toFixed(3);
      });
    }

    function clearStyles() {
      items.forEach(function (el) { el.style.transform = ''; el.style.opacity = ''; });
    }

    function update() {
      ticking = false;
      if (!active) return;
      // 본문 아래 끝이 화면 아래에서 얼마나 올라갔는지 = 푸터가 드러난 비율
      var mainBottom = main.getBoundingClientRect().bottom;
      var revealed = global.innerHeight - mainBottom;
      var p = Math.min(1, Math.max(0, revealed / footer.offsetHeight));
      applyProgress(p);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      global.requestAnimationFrame(update);
    }

    function evaluate() {
      // 화면이 좁거나, 푸터가 화면보다 높으면(끝까지 볼 수 없으므로) 일반 푸터로
      var ok = !reduce.matches && global.innerWidth >= opts.minWidth && footer.offsetHeight <= global.innerHeight;
      active = ok;
      root.classList.toggle('fr-on', ok);
      if (ok) update(); else clearStyles();
    }

    global.addEventListener('scroll', onScroll, { passive: true });
    global.addEventListener('resize', evaluate, { passive: true });
    if (reduce.addEventListener) reduce.addEventListener('change', evaluate);
    evaluate();

    return {
      refresh: evaluate,
      destroy: function () {
        global.removeEventListener('scroll', onScroll);
        global.removeEventListener('resize', evaluate);
        root.classList.remove('fr-on');
        clearStyles();
      }
    };
  }

  global.FooterReveal = { init: init };
})(window);

FooterReveal.init({ main: ".fr-main", footer: ".fr-footer", minWidth: 768, fromY: -100, fromScale: 0.9, fromOpacity: 0 });
