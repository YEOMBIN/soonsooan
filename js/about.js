/* =========================================================
   07. ABOUT — card-accordion 모듈 (항상 카드 1개만 펼침)
   PC: 호버 120ms 후 펼침 · 5초 자동 재생 (호버/포커스/화면 밖이면 멈춤)
   태블릿·모바일: 탭으로 펼침 (세로 아코디언)
   ========================================================= */
(function (global) {
  'use strict';

  var DEFAULTS = { selector: '.ca', hover: true, hoverDelay: 120, autoplay: true, interval: 5000, resumeDelay: 1500 };

  function setup(root, opts) {
    var inputs = Array.from(root.querySelectorAll('input[type="radio"]'));
    if (!inputs.length) return function () {};

    var canHover = global.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var reduce = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timer = null, hoverTimer = null, resumeTimer = null;
    var hovering = false, focused = false, visible = true;

    function current() { var i = inputs.findIndex(function (el) { return el.checked; }); return i < 0 ? 0 : i; }
    function open(i) { inputs[(i + inputs.length) % inputs.length].checked = true; }
    function stop() { clearTimeout(timer); timer = null; }
    function schedule() {
      stop();
      if (!opts.autoplay || reduce || hovering || focused || !visible || document.hidden) return;
      timer = setTimeout(function () { open(current() + 1); schedule(); }, opts.interval);
    }

    inputs.forEach(function (input) { input.addEventListener('change', schedule); });

    var cards = inputs.map(function (input) { return root.querySelector('label[for="' + input.id + '"]'); });
    if (opts.hover && canHover) {
      cards.forEach(function (card, i) {
        if (!card) return;
        card.addEventListener('mouseenter', function () {
          if (global.innerWidth <= 1024) return;
          clearTimeout(hoverTimer);
          hoverTimer = setTimeout(function () { open(i); }, opts.hoverDelay);
        });
        card.addEventListener('mouseleave', function () { clearTimeout(hoverTimer); });
      });
    }

    root.addEventListener('mouseenter', function () { hovering = true; clearTimeout(resumeTimer); stop(); });
    root.addEventListener('mouseleave', function () { hovering = false; clearTimeout(resumeTimer); resumeTimer = setTimeout(schedule, opts.resumeDelay); });
    root.addEventListener('focusin', function () { focused = true; stop(); });
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) { focused = false; schedule(); } });
    // 터치: 손가락이 닿으면 잠시 멈췄다가 다시 재생
    root.addEventListener('touchstart', function () { stop(); clearTimeout(resumeTimer); resumeTimer = setTimeout(schedule, opts.interval); }, { passive: true });

    var io = new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; visible ? schedule() : stop(); }, { threshold: 0.3 });
    io.observe(root);
    function onVisibility() { document.hidden ? stop() : schedule(); }
    document.addEventListener('visibilitychange', onVisibility);
    schedule();

    return function destroy() {
      stop(); clearTimeout(hoverTimer); clearTimeout(resumeTimer);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }

  function init(options) {
    var opts = Object.assign({}, DEFAULTS, options || {});
    var list = Array.from(document.querySelectorAll(opts.selector)).map(function (root) { return setup(root, opts); });
    return { destroy: function () { list.forEach(function (d) { d(); }); } };
  }

  global.CardAccordion = { init: init };
  init({ selector: '.about-ca' });
})(window);
