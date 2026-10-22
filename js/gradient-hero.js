/* =========================================================
   Gradient Hero
   PC(마우스): 늘 자동으로 흐르고, 마우스를 올리면 그 위에 마우스 방향 움직임 + 물결이 더해짐
   모바일(터치): 마우스가 없으므로 자동 흐름 + 2~4초마다 저절로 생기는 아주 옅은 물결·윤슬
   텍스트는 건드리지 않음. 의존성 없음. 사용: GradientHero.init();
   ========================================================= */
(function (global) {
  'use strict';

  var DEFAULTS = {
    selector: '[data-gh]',
    strength: 160,    // 마우스를 끝까지 옮겼을 때 덩어리가 움직이는 거리(px, depth 1 기준)
    ease: 0.06,       // 따라오는 속도 (작을수록 느긋하게)
    drift: 260,       // 마우스와 상관없이 자동으로 흐르는 폭(px)
    driftSpeed: 1,    // 흐르는 속도 배율
    mobileDrift: true, // 모바일에서 흐르는 움직임 사용 여부
    mobileDriftAmount: 80,  // 모바일 흐르는 폭(px). PC(drift)보다 작게
    mobileDriftSpeed: 0.6,  // 모바일 흐르는 속도 배율
    mobileBreath: 0.05,     // 모바일 크기 변화(±5%). PC는 ±15%
    ripple: true,     // 마우스가 지나간 자리에 물결 (PC만)
    rippleStrength: 0.5,  // 물결 진하기
    rippleGlint: 1,       // 윤슬(빛 반사·반짝임) 세기. 0이면 끔
    rippleDamping: 0.98,  // 파동이 유지되는 정도 (1에 가까울수록 멀리·오래 퍼짐, 0.97이면 더 금방 잦아듦)
    rippleCell: 6,    // 수면 격자 크기(px). 작을수록 촘촘하지만 무거움
    rippleRadius: 3,  // 마우스가 건드리는 반경(격자 칸 수)
    rippleGap: 60,    // 마우스가 이만큼(px) 움직일 때마다 수면을 한 번 건드림
    // 모바일(터치) 전용: 마우스가 없으므로 물방울이 떨어지듯 저절로 물결이 생김. PC에는 영향 없음
    mobileRipple: true,         // 모바일 자동 물결 사용 여부
    mobileRippleInterval: 3000, // 평균 간격(ms). 실제로는 2~4초 사이에서 무작위
    mobileRippleForce: 0.45,    // 물방울 세기 (PC 마우스는 1)
    mobileRippleStrength: 0.6,  // 물결 진하기 배율 (PC 대비)
    mobileRippleGlint: 0.5      // 윤슬 세기 배율 (PC 대비)
  };

  var reduce = global.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = global.matchMedia('(hover: hover) and (pointer: fine)');

  /* 물결: 섹션 전체를 수면 격자로 계산 (jquery.ripples와 같은 원리, 라이브러리 없음)
     - 마우스가 건드린 곳이 출렁이고, 파동이 섹션 전체로 퍼지며 가장자리에서 되튐
     - 수면의 기울기를 빛(밝게)·그늘(옅게 어둡게)로 그려 물결로 보이게 함 */
  function createRipple(section, opts) {
    var canvas = document.createElement('canvas');
    canvas.className = 'gh__ripple';
    canvas.setAttribute('aria-hidden', 'true');
    section.insertBefore(canvas, section.querySelector('.gh__content'));
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, cur, prev, img, last = null, active = false, acc = 0;
    var gainK = 1, gainG = 1;   // 진하기·윤슬 배율 (PC는 1, 모바일은 옵션 값)

    function resize() {
      W = Math.max(3, Math.ceil(section.clientWidth / opts.rippleCell));
      H = Math.max(3, Math.ceil(section.clientHeight / opts.rippleCell));
      canvas.width = W; canvas.height = H;   // 작은 캔버스를 CSS로 늘려 부드럽게 보이게 함
      cur = new Float32Array(W * H);
      prev = new Float32Array(W * H);
      img = ctx.createImageData(W, H);
      active = false;
    }
    var ro = new ResizeObserver(resize);
    ro.observe(section);
    resize();

    // (px, py) 위치의 수면을 force만큼 살짝 눌러 파동을 만듦
    function drop(px, py, force) {
      var cx = px / opts.rippleCell, cy = py / opts.rippleCell, R = opts.rippleRadius;
      for (var y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++) {
        for (var x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
          if (x < 1 || y < 1 || x > W - 2 || y > H - 2) continue;
          var d = Math.hypot(x - cx, y - cy);
          if (d <= R) cur[y * W + x] += force * (0.5 + 0.5 * Math.cos(Math.PI * d / R));
        }
      }
      active = true;
    }

    // PC: 마우스가 rippleGap만큼 움직일 때마다 한 번씩
    function add(px, py) {
      if (last && Math.hypot(px - last.x, py - last.y) < opts.rippleGap) return;
      last = { x: px, y: py };
      drop(px, py, 1);
    }

    // 파동 한 단계 계산: 이웃 칸의 높이로 다음 높이를 구함
    function step() {
      var damp = opts.rippleDamping;
      for (var y = 1; y < H - 1; y++) {
        for (var x = 1, i = y * W + 1; x < W - 1; x++, i++) {
          prev[i] = ((cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W]) * 0.5 - prev[i]) * damp;
        }
      }
      var t = cur; cur = prev; prev = t;
    }

    // 수면 기울기 → 왼쪽 위에서 빛이 비치는 것처럼 밝기/그늘로 그림
    // + 윤슬: 빛을 정면으로 받는 기울기는 강하게 반사되고, 물결 마루에서 반짝이는 점이 깜빡임
    function render() {
      var d = img.data, k = opts.rippleStrength * gainK, gl = opts.rippleGlint * gainG, peak = 0;
      for (var y = 1; y < H - 1; y++) {
        for (var x = 1, i = y * W + 1; x < W - 1; x++, i++) {
          var l = (cur[i - 1] - cur[i + 1] + cur[i - W] - cur[i + W]) * k;
          var p = i * 4, m = l < 0 ? -l : l;
          if (m > peak) peak = m;
          if (l > 0) {
            var a = Math.min(0.4, l);                                   // 은은한 빛
            if (gl && l > 0.08) {
              a = Math.min(0.6, a + Math.pow((l - 0.08) * 4, 2) * 0.35 * gl); // 빛 반사(정반사 하이라이트)
              if (Math.random() < (l - 0.08) * 1.5 * gl) a = Math.min(0.9, 0.5 + 0.4 * gl); // 반짝이는 윤슬 점 (PC 0.9, 모바일은 더 옅게)
            }
            d[p] = 255; d[p + 1] = 255; d[p + 2] = 255; d[p + 3] = a * 255;
          } else {
            d[p] = 20; d[p + 1] = 70; d[p + 2] = 160; d[p + 3] = Math.min(0.2, -l * 0.5) * 255;
          }
        }
      }
      ctx.putImageData(img, 0, 0);
      if (peak < 0.003) { active = false; ctx.clearRect(0, 0, W, H); cur.fill(0); prev.fill(0); }
    }

    // 화면 주사율과 상관없이 같은 속도로 퍼지도록 1/60초 단위로 계산
    function tick(dt) {
      if (!active) return;
      acc = Math.min(acc + dt, 50);
      var n = 0;
      while (acc >= 16.7 && n < 3) { step(); acc -= 16.7; n++; }
      if (n) render();
    }

    return {
      add: add,
      drop: drop,
      tick: tick,
      setGain: function (k, g) { gainK = k; gainG = g; },
      reset: function () { last = null; },
      destroy: function () { ro.disconnect(); canvas.remove(); }
    };
  }

  function setup(section, opts) {
    var blobs = Array.from(section.querySelectorAll('.gh__blob')).map(function (el, i) {
      return {
        el: el,
        depth: parseFloat(el.getAttribute('data-gh-depth') || '1'),
        phase: i * 1.7,
        speed: 0.0007 + i * 0.00012,
        dir: i % 2 ? -1 : 1   // 이웃 덩어리끼리 반대로 돌아 서로 엇갈리게
      };
    });
    var target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    var visible = false, raf = 0, lastT = 0, nextDrop = 0;
    var ripple = opts.ripple ? createRipple(section, opts) : null;

    function frame(t) {
      raf = 0;
      if (!visible || reduce.matches) return;
      var usePointer = finePointer.matches;
      var mobileRipple = !usePointer && ripple && opts.mobileRipple;
      if (!usePointer && !opts.mobileDrift && !mobileRipple) return;

      cur.x += (target.x - cur.x) * opts.ease;
      cur.y += (target.y - cur.y) * opts.ease;
      // PC와 모바일의 흐름 값을 따로 씀
      var sp = usePointer ? opts.driftSpeed : opts.mobileDriftSpeed;
      var dr = usePointer ? opts.drift : opts.mobileDriftAmount;
      var br = usePointer ? 0.15 : opts.mobileBreath;

      if (usePointer || opts.mobileDrift) {
        blobs.forEach(function (b) {
          var a = t * b.speed * sp + b.phase;
          var x = Math.sin(a) * dr * b.dir + (usePointer ? cur.x * opts.strength * b.depth : 0);
          var y = Math.cos(a * 0.8) * dr * 0.8 + (usePointer ? cur.y * opts.strength * b.depth : 0);
          var s = 1 + Math.sin(a * 0.6) * br;
          b.el.style.transform = 'translate(-50%,-50%) translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + s.toFixed(3) + ')';
        });
      }

      if (ripple) {
        ripple.setGain(usePointer ? 1 : opts.mobileRippleStrength, usePointer ? 1 : opts.mobileRippleGlint);
        // 모바일: 2~4초마다 섹션 아무 곳에 물방울 하나가 떨어지듯 아주 약한 물결
        if (mobileRipple) {
          if (!nextDrop) nextDrop = t + opts.mobileRippleInterval * 0.3;
          if (t >= nextDrop) {
            ripple.drop(Math.random() * section.clientWidth, Math.random() * section.clientHeight, opts.mobileRippleForce);
            nextDrop = t + opts.mobileRippleInterval * (0.67 + Math.random() * 0.66);
          }
        }
        ripple.tick(lastT ? t - lastT : 16.7);
      }
      lastT = t;
      raf = global.requestAnimationFrame(frame);
    }

    function start() { if (!raf) { lastT = 0; nextDrop = 0; raf = global.requestAnimationFrame(frame); } }

    function onMove(e) {
      var r = section.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;   // -1 ~ 1
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (ripple && e.pointerType === 'mouse' && !reduce.matches) ripple.add(e.clientX - r.left, e.clientY - r.top);
    }
    function onLeave() { target.x = 0; target.y = 0; if (ripple) ripple.reset(); }

    section.addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerleave', onLeave, { passive: true });

    var io = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    });
    io.observe(section);

    function onReduce() {
      if (reduce.matches) blobs.forEach(function (b) { b.el.style.transform = ''; });
      else start();
    }
    if (reduce.addEventListener) reduce.addEventListener('change', onReduce);

    return {
      destroy: function () {
        io.disconnect();
        section.removeEventListener('pointermove', onMove);
        section.removeEventListener('pointerleave', onLeave);
        if (raf) global.cancelAnimationFrame(raf);
        if (ripple) ripple.destroy();
        blobs.forEach(function (b) { b.el.style.transform = ''; });
      }
    };
  }

  function init(options) {
    var opts = Object.assign({}, DEFAULTS, options || {});
    return Array.from(document.querySelectorAll(opts.selector)).map(function (s) { return setup(s, opts); });
  }

  global.GradientHero = { init: init };
})(window);
