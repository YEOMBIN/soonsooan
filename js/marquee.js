/* =========================================================
   흐르는 영문 'SOONSOOAN DERMATOLOGY' (의료진 소개 ↔ ABOUT 사이)
   끊김 없이 오른쪽으로 천천히 흐름. 화면 밖이거나 동작 줄이기 설정이면 멈춤
   ========================================================= */
(function () {
  'use strict';

  var track = document.querySelector('.doc-marquee__track');
  if (!track) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 같은 묶음을 한 번 더 이어 붙여 끊김 없이 반복 (복제본은 보조기기에서 제외)
  Array.from(track.children).forEach(function (n) { var c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });

  var w = 0, x = 0, last = 0, visible = false;
  function measure() { w = track.scrollWidth / 2; if (x <= -w || x > 0) x = -w / 2; }
  measure();
  x = -w / 2;
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  function speed() { return (70 * Math.min(1, window.innerWidth / 1920) + 18) * 0.6; } // px/s

  function frame(t) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    if (!visible || document.hidden || reduce || !w) return;
    x += speed() * dt;
    if (x >= 0) x -= w;
    track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
  }
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { rootMargin: '100px 0px' }).observe(track.parentNode);
  if (!reduce) track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
  requestAnimationFrame(frame);
})();
