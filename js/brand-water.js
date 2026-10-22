/* =========================================================
   05. 브랜드 인터랙션
   1) 덮기: 치료 프로그램 묶음은 멈춰 있고 브랜드 섹션이 위로 올라와 완전히 덮음
   2) 완전히 덮인 뒤 문구가 한 글자씩 부드럽게 등장
   3) 물결(윤슬): 마우스 주변 물결 + 반짝임 + 천천히 떠다니는 색 덩어리
      - 색 덩어리: 마우스 250px 안에서 반응, 5~9초마다 약 260px 범위 안을 ±15% 크기로 이동
      - 모바일: 2~4초마다 자동 물방울
      - 동작 줄이기 설정 / WebGL 미지원 시: 정지 화면
   4) 의료진 섹션으로 넘어가며 색이 밝게 바뀜 (짧은 스크롤 연동)
   ========================================================= */
(function () {
  'use strict';

  var brand = document.getElementById('brand');
  var wrap = document.querySelector('.cover-under');
  if (!brand) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var gnb = document.getElementById('gnb');

  /* ---------- 1) 덮기 ---------- */
  function setCover() {
    if (!wrap || reduce) return;
    wrap.classList.add('is-sticky');
    wrap.style.setProperty('--cover-top', Math.min(0, window.innerHeight - wrap.offsetHeight) + 'px');
  }
  setCover();
  window.addEventListener('resize', setCover);
  // 완전히 덮이면 아래 묶음은 그리지 않음 (성능)
  function checkCovered() {
    if (!wrap) return;
    var covered = brand.getBoundingClientRect().top <= 0 && wrap.classList.contains('is-sticky');
    if (covered !== wrap.classList.contains('is-covered')) {
      wrap.classList.toggle('is-covered', covered);
      wrap.style.visibility = covered ? 'hidden' : '';
    }
  }
  window.addEventListener('scroll', checkCovered, { passive: true });

  /* ---------- 2) 글자별 등장 ---------- */
  var title = brand.querySelector('.brand__title');
  var eyebrow = brand.querySelector('.brand__eyebrow');
  var label = title.textContent;
  title.setAttribute('aria-label', label);
  title.innerHTML = Array.from(label).map(function (c) { return '<span class="ch" aria-hidden="true">' + (c === ' ' ? ' ' : c) + '</span>'; }).join('');
  var chars = title.querySelectorAll('.ch');

  if (hasGsap && !reduce) {
    var tl = gsap.timeline({ paused: true });
    tl.to(eyebrow, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.inOut' })
      .to(chars, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.inOut', stagger: 0.05 }, 0.25);
    ScrollTrigger.create({
      trigger: brand,
      start: function () { return 'top ' + (gnb ? gnb.offsetHeight + 2 : 0) + 'px'; },
      once: true,
      onEnter: function () { tl.play(); }
    });

    /* ---------- 4) 의료진 섹션으로 색 전환 ---------- */
    gsap.to(brand.querySelector('.brand__fade'), {
      opacity: 1, ease: 'none',
      scrollTrigger: { trigger: brand, start: 'bottom 72%', end: 'bottom 18%', scrub: 0.6 }
    });
    gsap.to(brand.querySelector('.brand__copy'), {
      y: -40, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: brand, start: 'bottom 60%', end: 'bottom 22%', scrub: 0.6 }
    });
  } else {
    document.documentElement.classList.add('brand-static');
    [eyebrow].concat(Array.from(chars)).forEach(function (n) { n.style.opacity = 1; n.style.transform = 'none'; n.style.filter = 'none'; });
  }

  /* ---------- 3) 물결 (WebGL) ---------- */
  var canvas = brand.querySelector('.brand__canvas');
  if (reduce || !canvas) return;
  var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) { canvas.style.display = 'none'; return; }

  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var VS = 'attribute vec2 a;varying vec2 v;void main(){v=vec2(a.x*.5+.5,.5-a.y*.5);gl_Position=vec4(a,0.,1.);}';
  var FS = [
    'precision mediump float;',
    'varying vec2 v;',
    'uniform sampler2D uWave,uBg;',
    'uniform vec2 uRes;uniform float uTime,uHasBg;uniform vec4 uCover;',
    'uniform vec3 uB[4];uniform vec4 uC[4];',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',
    'void main(){',
    ' vec4 w=texture2D(uWave,v);',
    ' vec2 n=(w.rg-.5)*2.;float h=(w.b-.5)*2.;',
    ' vec2 p=v*uRes;',
    ' vec3 col=vec3(0.);float a=0.;',
    ' if(uHasBg>.5){vec2 uv=(v+n*.03)*uCover.xy+uCover.zw;col=texture2D(uBg,uv).rgb;a=1.;}',
    // 색 덩어리 (스크린 합성)
    ' for(int i=0;i<4;i++){float d=length(p-uB[i].xy)/uB[i].z;float k=exp(-d*d*1.6)*uC[i].a;col=1.-(1.-col)*(1.-uC[i].rgb*k);a=max(a,k);}',
    // 물결 면의 밝고 어두운 결
    ' vec3 N=normalize(vec3(-n*5.,1.));vec3 L=normalize(vec3(-.35,-.55,.75));',
    ' float diff=dot(N,L)-L.z;float spec=pow(max(dot(reflect(-L,N),vec3(0.,0.,1.)),0.),70.);',
    ' col+=vec3(.75,.9,1.)*diff*.35;',
    // 윤슬: 잔잔한 반짝임 (물결이 있을수록 강해짐)
    ' float t=uTime;vec2 q=p/uRes.y*120.;',
    ' float g=noise(q+vec2(t*.35,-t*.22))*noise(q*.53-vec2(t*.18,t*.27)+n*6.);',
    ' float glint=smoothstep(.62,.9,g)*(.22+min(abs(h)*6.,1.2)+spec*2.);',
    ' vec3 sparkle=vec3(.86,.96,1.)*(glint*.8+spec*.9);',
    ' col+=sparkle;a=max(a,clamp(glint*.8+spec+abs(diff)*.4,0.,1.));',
    ' gl_FragColor=uHasBg>.5?vec4(col,1.):vec4(col*a,a)*.9;',
    '}'
  ].join('\n');

  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
  } catch (err) { canvas.style.display = 'none'; return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var aLoc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['uWave', 'uBg', 'uRes', 'uTime', 'uHasBg', 'uCover', 'uB', 'uC'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
  gl.uniform1i(U.uWave, 0);
  gl.uniform1i(U.uBg, 1);

  function makeTex(unit) {
    var t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  var waveTex = makeTex(0);
  var bgTex = makeTex(1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

  // 배경 이미지: 서버로 열었을 때만 굴절에 사용 (file:// 은 보안상 불가 → 겹침 모드)
  var hasBg = 0, bgW = 1919, bgH = 523;
  var img = new Image();
  img.onload = function () {
    try {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bgTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      bgW = img.naturalWidth; bgH = img.naturalHeight; hasBg = 1;
    } catch (e) { hasBg = 0; }
  };
  if (location.protocol !== 'file:') img.src = 'assets/img/section/branding-bg.webp';

  /* 물결 높이: 작은 격자에서 계산 (CPU) → 텍스처로 올림 */
  var GW = 0, GH = 0, cur, prev, pix;
  var W = 0, H = 0, quality = coarse ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);

  function resize() {
    var r = brand.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * quality);
    canvas.height = Math.round(H * quality);
    gl.viewport(0, 0, canvas.width, canvas.height);
    var gw = coarse ? 120 : 220;
    if (gw !== GW || Math.round(gw * H / W) !== GH) {
      GW = gw; GH = Math.max(40, Math.round(gw * H / W));
      cur = new Float32Array(GW * GH); prev = new Float32Array(GW * GH); pix = new Uint8Array(GW * GH * 4);
    }
    placeBlobs();
  }

  function drop(px, py, strength, radius) {
    var gx = px / W * GW, gy = py / H * GH, r = radius || 3;
    for (var y = Math.max(1, Math.floor(gy - r)); y < Math.min(GH - 1, Math.ceil(gy + r)); y++) {
      for (var x = Math.max(1, Math.floor(gx - r)); x < Math.min(GW - 1, Math.ceil(gx + r)); x++) {
        var d = Math.hypot(x - gx, y - gy) / r;
        if (d < 1) cur[y * GW + x] += strength * (Math.cos(d * Math.PI) * 0.5 + 0.5);
      }
    }
  }

  function step() {
    var damp = 0.982;
    for (var y = 1; y < GH - 1; y++) {
      for (var x = 1, i = y * GW + 1; x < GW - 1; x++, i++) {
        var nv = (cur[i - 1] + cur[i + 1] + cur[i - GW] + cur[i + GW]) * 0.5 - prev[i];
        prev[i] = nv * damp;
      }
    }
    var t = prev; prev = cur; cur = t;
  }

  function upload() {
    for (var y = 0; y < GH; y++) {
      for (var x = 0; x < GW; x++) {
        var i = y * GW + x, o = i * 4;
        var dx = (x > 0 && x < GW - 1) ? cur[i + 1] - cur[i - 1] : 0;
        var dy = (y > 0 && y < GH - 1) ? cur[i + GW] - cur[i - GW] : 0;
        pix[o] = 128 + Math.max(-127, Math.min(127, dx * 90));
        pix[o + 1] = 128 + Math.max(-127, Math.min(127, dy * 90));
        pix[o + 2] = 128 + Math.max(-127, Math.min(127, cur[i] * 90));
        pix[o + 3] = 255;
      }
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, waveTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GW, GH, 0, gl.RGBA, gl.UNSIGNED_BYTE, pix);
  }

  /* 색 덩어리 */
  var COLORS = [[0.47, 0.76, 0.90, 0.34], [0.78, 0.92, 1.00, 0.20], [0.00, 0.56, 0.85, 0.38], [0.37, 0.82, 1.00, 0.24]];
  var BASE = [[0.22, 0.38, 0.34], [0.74, 0.30, 0.30], [0.62, 0.74, 0.38], [0.30, 0.78, 0.28]]; // x, y(비율), 반지름(화면 폭 비율)
  var blobs = BASE.map(function (b, i) { return { bx: b[0], by: b[1], rr: b[2], x: 0, y: 0, fx: 0, fy: 0, tx: 0, ty: 0, s: 1, fs: 1, ts: 1, t0: 0, dur: 1, mx: 0, my: 0, ms: 0, col: COLORS[i] }; });
  function range() { return 260 * Math.max(0.45, Math.min(1, W / 1440)); }
  function pickTarget(b, now) {
    var ang = Math.random() * Math.PI * 2, dist = Math.random() * range();
    b.fx = b.x; b.fy = b.y; b.fs = b.s;
    b.tx = b.bx * W + Math.cos(ang) * dist;
    b.ty = b.by * H + Math.sin(ang) * dist * 0.7;
    b.ts = 0.85 + Math.random() * 0.3;
    b.t0 = now; b.dur = 5000 + Math.random() * 4000;
  }
  function placeBlobs() {
    var now = performance.now();
    blobs.forEach(function (b) { b.x = b.bx * W; b.y = b.by * H; pickTarget(b, now - Math.random() * 3000); });
  }
  function ease(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

  /* 입력 */
  var mouse = { x: -9999, y: -9999, on: false }, lastDrop = { x: 0, y: 0 };
  brand.addEventListener('pointermove', function (e) {
    var r = brand.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    mouse.x = x; mouse.y = y; mouse.on = true;
    var d = Math.hypot(x - lastDrop.x, y - lastDrop.y);
    if (d > 14) {
      drop(x, y, Math.min(1.4, 0.35 + d / 60), coarse ? 2.4 : 3.2);
      lastDrop.x = x; lastDrop.y = y;
    }
  }, { passive: true });
  brand.addEventListener('pointerleave', function () { mouse.on = false; });
  brand.addEventListener('pointerdown', function (e) {
    var r = brand.getBoundingClientRect();
    drop(e.clientX - r.left, e.clientY - r.top, 2.2, 4.5);
  });

  var nextAuto = 0;
  function autoDrop(now) {
    if (now < nextAuto) return;
    nextAuto = now + (coarse ? 2000 + Math.random() * 2000 : 3000 + Math.random() * 3000);
    drop(W * (0.1 + Math.random() * 0.8), H * (0.15 + Math.random() * 0.7), coarse ? 2.4 : 1.2, coarse ? 3.6 : 3.2);
  }

  /* 그리기 */
  var running = false, visible = false, raf = 0, acc = 0, lastT = 0, slow = 0, frames = 0;
  var bArr = new Float32Array(12), cArr = new Float32Array(16);

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) { running = false; return; }
    raf = requestAnimationFrame(frame);
    var dt = lastT ? Math.min(now - lastT, 64) : 16;
    lastT = now;

    // 느린 기기면 해상도를 낮춤
    frames++; if (dt > 24) slow++;
    if (frames >= 90) { if (slow > 40 && quality > 0.55) { quality *= 0.8; resize(); } frames = 0; slow = 0; }

    autoDrop(now);
    acc += dt;
    var n = 0;
    while (acc >= 16 && n < 3) { step(); acc -= 16; n++; }
    upload();

    var R = range();
    blobs.forEach(function (b, i) {
      var p = (now - b.t0) / b.dur;
      if (p >= 1) { b.x = b.tx; b.y = b.ty; b.s = b.ts; pickTarget(b, now); p = 0; }
      var e = ease(Math.max(0, p));
      b.x = b.fx + (b.tx - b.fx) * e; b.y = b.fy + (b.ty - b.fy) * e; b.s = b.fs + (b.ts - b.fs) * e;
      // 마우스 250px 안: 살짝 끌려오고 커짐 (부드럽게 따라감)
      var gx = 0, gy = 0, gs = 0;
      if (mouse.on) {
        var dx = mouse.x - b.x, dy = mouse.y - b.y, d = Math.hypot(dx, dy);
        if (d < 250) { var k = Math.pow(1 - d / 250, 2); gx = dx * k * 0.35; gy = dy * k * 0.35; gs = k * 0.08; }
      }
      b.mx += (gx - b.mx) * 0.05; b.my += (gy - b.my) * 0.05; b.ms += (gs - b.ms) * 0.05;
      bArr[i * 3] = b.x + b.mx; bArr[i * 3 + 1] = b.y + b.my; bArr[i * 3 + 2] = b.rr * Math.max(W, 600) * (b.s + b.ms);
      cArr.set(b.col, i * 4);
      void R;
    });

    gl.uniform2f(U.uRes, W, H);
    gl.uniform1f(U.uTime, now / 1000);
    gl.uniform1f(U.uHasBg, hasBg);
    // 배경 cover 맞춤
    var ca = W / H, ia = bgW / bgH, sx = 1, sy = 1;
    if (ca > ia) sy = ia / ca; else sx = ca / ia;
    gl.uniform4f(U.uCover, sx, sy, (1 - sx) / 2, (1 - sy) / 2);
    gl.uniform3fv(U.uB, bArr);
    gl.uniform4fv(U.uC, cArr);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function start() { if (running) return; running = true; lastT = 0; raf = requestAnimationFrame(frame); }

  resize();
  window.addEventListener('resize', function () { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }, { rootMargin: '80px 0px' }).observe(brand);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && visible) start(); });
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); visible = false; canvas.style.display = 'none'; });
})();
