/* =========================================================
   04. 프리미엄 라인업 — 끊김 없는 무한 흐름
   마우스를 올리면 부드럽게 멈춤 · 화살표로 한 칸씩 이동
   ========================================================= */
(function () {
  'use strict';

  var view = document.querySelector('.premium__viewport');
  if (!view) return;
  var track = view.querySelector('.premium__track');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 복제본으로 한 바퀴 더 이어 붙임 (복제본은 보조기기·탭 이동에서 제외)
  function cloneSet(parent) {
    Array.from(parent.children).forEach(function (n) {
      var c = n.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; });
      parent.appendChild(c);
    });
  }
  var count = track.children.length;
  cloneSet(track);

  var setW = 0, pitch = 0;
  function measure() {
    var first = track.children[0], firstClone = track.children[count];
    setW = firstClone.offsetLeft - first.offsetLeft;
    pitch = track.children[1].offsetLeft - first.offsetLeft;
  }
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);

  var x = 0, speed = 0, target = 1, nudge = 0, last = 0, visible = false;
  function base() { return 70 * Math.min(1, window.innerWidth / 1920) + 18; } // px/s

  function frame(t) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    if (!visible || document.hidden) return;

    // 속도는 천천히 목표치로 (멈출 때·다시 흐를 때 모두 부드럽게)
    speed += ((reduce ? 0 : target) - speed) * Math.min(1, dt * 3);
    x -= base() * speed * dt;
    // 화살표 이동분을 부드럽게 반영
    var step = nudge * Math.min(1, dt * 4.5);
    nudge -= step; x += step;
    if (setW) { x = ((x % setW) - setW) % setW; }
    track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';

  }

  view.addEventListener('mouseenter', function () { target = 0; });
  view.addEventListener('mouseleave', function () { target = 1; });
  view.addEventListener('focusin', function () { target = 0; });
  view.addEventListener('focusout', function (e) { if (!view.contains(e.relatedTarget)) target = 1; });

  // 터치: 손가락으로 끌어서 넘기기
  var dragging = false, px = 0, moved = 0;
  track.addEventListener('pointerdown', function (e) { moved = 0; if (e.pointerType === 'mouse') return; dragging = true; px = e.clientX; target = 0; });
  window.addEventListener('pointermove', function (e) { if (!dragging) return; moved += Math.abs(e.clientX - px); x += e.clientX - px; px = e.clientX; });
  window.addEventListener('pointerup', function () { if (dragging) { dragging = false; target = 1; } });
  // 끌어서 넘긴 직후의 탭은 카드 이동으로 처리하지 않음
  track.addEventListener('click', function (e) { if (moved > 8) { e.preventDefault(); e.stopPropagation(); } }, true);
  track.style.touchAction = 'pan-y';

  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { rootMargin: '100px 0px' }).observe(view);
  requestAnimationFrame(frame);
})();
