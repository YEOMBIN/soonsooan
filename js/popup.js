/* =========================================================
   메인 팝업 — 설정은 data/popups.js (켜기/끄기, 이미지·링크 추가·삭제)
   - 한 화면에 PC 최대 3개 · 태블릿 2개 · 모바일 1개(+다음 팝업 살짝 보임). 그보다 많으면 가로 캐러셀
     (scroll-snap · 마우스 드래그 · 트랙패드/휠 · 터치 스와이프 · 좌우 버튼 · 인디케이터)
   - 전체 닫기(X)·바깥 어두운 영역·Esc: 닫기 (다음 방문 때 다시 표시)
   - '오늘 열지 않기' 체크: 이 브라우저에서 오늘(현지 날짜) 하루 동안 표시 안 함 → 바로 닫힘
   - 열려 있는 동안 뒤 페이지 스크롤 멈춤, 키보드 포커스는 팝업 안에서만 이동
   ========================================================= */
(function () {
  'use strict';

  var cfg = window.SS_POPUPS;
  if (!cfg || !cfg.enabled || !cfg.items || !cfg.items.length) return;

  var KEY = 'ss-popup-hide-' + (cfg.version || '1');
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  try { if (window.localStorage.getItem(KEY) === today()) return; } catch (e) { /* 저장소를 못 쓰면 매번 표시 */ }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GAP_PC = 18, BASE_H = 572;

  var items = cfg.items.map(function (it, i) {
    var w = +it.width || 400, h = +it.height || 572;
    var img = '<img src="' + esc(it.image) + '" alt="' + esc(it.alt) + '" width="' + w + '" height="' + h + '" draggable="false">';
    var media = it.link
      ? '<a class="pop__link" href="' + esc(it.link) + '"' + (it.newTab ? ' target="_blank" rel="noopener"' : '') + ' draggable="false">' + img + '</a>'
      : '<div class="pop__link">' + img + '</div>';
    return '<div class="pop__item" role="group" aria-roledescription="팝업" aria-label="' + (i + 1) + ' / ' + cfg.items.length + '" data-w="' + w + '" data-h="' + h + '">' + media + '</div>';
  }).join('');

  var pop = document.createElement('div');
  pop.className = 'pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-modal', 'true');
  pop.setAttribute('aria-label', '공지 팝업');
  pop.tabIndex = -1; // 열릴 때 팝업 자체에 포커스 (닫기 버튼에 테두리가 생기지 않게)
  pop.innerHTML =
    '<div class="pop__dim"></div>' +
    '<div class="pop__panel">' +
      '<div class="pop__bar">' +
        '<label class="pop__today"><input type="checkbox"><span>오늘 열지 않기</span></label>' +
        '<button type="button" class="pop__close" aria-label="팝업 모두 닫기"><img src="assets/img/popup/icon-close.svg" alt="" width="25" height="29"></button>' +
      '</div>' +
      '<div class="pop__stage">' +
        '<button type="button" class="pop__nav pop__nav--prev" aria-label="이전 팝업"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
        '<div class="pop__list" tabindex="-1">' + items + '</div>' +
        '<button type="button" class="pop__nav pop__nav--next" aria-label="다음 팝업"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' +
      '</div>' +
      '<div class="pop__dots" role="tablist" aria-label="팝업 위치"></div>' +
    '</div>';

  var panel = pop.querySelector('.pop__panel');
  var list = pop.querySelector('.pop__list');
  var dots = pop.querySelector('.pop__dots');
  var prev = pop.querySelector('.pop__nav--prev');
  var next = pop.querySelector('.pop__nav--next');
  var check = pop.querySelector('.pop__today input');
  var closeBtn = pop.querySelector('.pop__close');
  var lastFocus = null, closed = false;
  function lenis() { return window.SS && window.SS.lenis; }
  function els() { return Array.from(list.querySelectorAll('.pop__item:not(.is-leaving)')); }

  /* ----- 배치: 화면 크기에 맞춰 한 번에 보이는 개수(3/2/1)만큼 뷰포트 폭을 정함. 이미지 비율은 항상 원본 그대로 ----- */
  var perView = 3, overflow = false;
  function layout() {
    var vw = window.innerWidth, vh = window.innerHeight, list0 = els();
    if (!list0.length) return;
    var mobile = vw <= 767;
    perView = vw >= 1025 ? 3 : vw >= 768 ? 2 : 1;
    var n = list0.length, k = Math.min(perView, n);
    var gap = mobile ? 12 : GAP_PC;
    pop.classList.toggle('is-mobile', mobile);
    if (mobile) {
      var side = 16, peek = n > 1 ? 40 : 0;
      var maxH = Math.min(vh * 0.58, 460);
      list0.forEach(function (el) {
        var w = +el.dataset.w, h = +el.dataset.h;
        var iw = vw - side * 2 - peek, ih = iw * h / w;
        if (ih > maxH) { ih = maxH; iw = ih * w / h; }
        el.style.width = Math.round(iw) + 'px'; el.style.height = Math.round(ih) + 'px';
      });
      panel.style.width = (vw - side * 2) + 'px';
      list.style.gap = gap + 'px';
      overflow = n > 1;
    } else {
      // 처음 k개가 한 줄에 들어가도록 배율 계산 (좌우 버튼 자리 포함)
      var navW = n > k ? 64 : 0;
      var baseW = list0.slice(0, k).reduce(function (s, el) { return s + (+el.dataset.w) * (BASE_H / +el.dataset.h); }, 0) + gap * (k - 1);
      var s = Math.min(1, (vw - 48 - navW * 2) / baseW, (vh - 60 - 60 - 22 - (n > k ? 40 : 0)) / BASE_H);
      var H = Math.round(BASE_H * s);
      list0.forEach(function (el) { var w = +el.dataset.w, h = +el.dataset.h; el.style.height = H + 'px'; el.style.width = Math.round(H * w / h) + 'px'; });
      var viewW = list0.slice(0, k).reduce(function (t, el) { return t + parseFloat(el.style.width); }, 0) + gap * (k - 1);
      list.style.gap = gap + 'px';
      list.style.width = Math.round(viewW) + 'px';
      panel.style.width = Math.round(viewW + navW * 2) + 'px';
      panel.style.setProperty('--pop-s', s);
      overflow = n > k;
    }
    if (mobile) list.style.width = '';
    pop.classList.toggle('has-overflow', overflow);
    // 세로 위치: 1920×1080 기준 위 160px, 낮은 화면은 가운데
    var ph = panel.offsetHeight;
    panel.style.top = Math.max(mobile ? 0 : 24, Math.min(mobile ? 9999 : 160, (vh - ph) / 2)) + 'px';
    if (mobile) panel.style.top = '';
    buildDots();
    update();
  }

  /* ----- 인디케이터·좌우 버튼: 팝업 개수와 현재 위치에 맞춰 자동 갱신 ----- */
  function pages() { var n = els().length; return overflow ? Math.max(1, n - (pop.classList.contains('is-mobile') ? 1 : perView) + 1) : 1; }
  function buildDots() {
    var p = pages();
    dots.innerHTML = '';
    if (p < 2) return;
    for (var i = 0; i < p; i++) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pop__dot'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', (i + 1) + '번째 위치로 이동');
      b.dataset.i = i;
      dots.appendChild(b);
    }
  }
  function current() {
    var l = list.scrollLeft, best = 0, d = Infinity;
    els().forEach(function (el, i) { var x = Math.abs(el.offsetLeft - list.offsetLeft - l); if (x < d) { d = x; best = i; } });
    if (list.scrollLeft + list.clientWidth >= list.scrollWidth - 2) best = pages() - 1;
    return Math.min(best, pages() - 1);
  }
  function update() {
    var c = current(), p = pages();
    Array.from(dots.children).forEach(function (b, i) { b.classList.toggle('is-active', i === c); b.setAttribute('aria-selected', i === c ? 'true' : 'false'); });
    prev.disabled = !overflow || list.scrollLeft <= 2;
    next.disabled = !overflow || list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
    void p;
  }
  function goTo(i) {
    var e = els()[Math.max(0, Math.min(i, els().length - 1))];
    if (e) list.scrollTo({ left: e.offsetLeft - list.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
  }
  dots.addEventListener('click', function (e) { var b = e.target.closest('.pop__dot'); if (b) goTo(+b.dataset.i); });
  prev.addEventListener('click', function () { goTo(current() - 1); });
  next.addEventListener('click', function () { goTo(current() + 1); });
  var raf = 0;
  list.addEventListener('scroll', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });

  /* ----- 마우스 드래그로 넘기기 (놓으면 가장 가까운 팝업에 스냅). 드래그 후에는 링크가 열리지 않게 ----- */
  var drag = null, moved = false;
  list.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !overflow || e.target.closest('.pop__x')) return;
    drag = { x: e.clientX, l: list.scrollLeft }; moved = false;
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!moved && Math.abs(dx) > 5) { moved = true; list.classList.add('is-dragging'); }
    if (moved) list.scrollLeft = drag.l - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!drag) return;
    drag = null;
    if (moved) { list.classList.remove('is-dragging'); goTo(current()); }
  });
  list.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  /* ----- 개별 닫기: 목록에서 바로 빼고 남은 팝업 재정렬 ----- */
  list.addEventListener('click', function (e) {
    var x = e.target.closest('.pop__x');
    if (!x) return;
    e.preventDefault();
    var item = x.closest('.pop__item');
    var idx = els().indexOf(item);
    item.classList.add('is-leaving');
    var finish = function () {
      item.remove();
      if (!els().length) { close(check.checked); return; }
      layout();
      var rest = els();
      // 남은 팝업 기준으로 위치 다시 맞춤 (끝을 넘지 않게, 가장 가까운 팝업에 스냅)
      var to = rest[Math.min(Math.max(0, idx - (idx >= rest.length ? 1 : 0)), Math.max(0, pages() - 1))];
      if (to) list.scrollTo({ left: Math.min(to.offsetLeft - list.offsetLeft, list.scrollWidth - list.clientWidth), behavior: 'auto' });
      update();
      var f = rest[Math.min(idx, rest.length - 1)].querySelector('.pop__x');
      if (f) f.focus({ preventScroll: true });
    };
    if (reduce) finish(); else setTimeout(finish, 260);
  });

  function open() {
    document.body.appendChild(pop);
    lastFocus = document.activeElement;
    if (lenis()) lenis().stop();
    layout();
    requestAnimationFrame(function () { requestAnimationFrame(function () { pop.classList.add('is-open'); pop.focus({ preventScroll: true }); }); });
  }
  function close(hideToday) {
    if (closed) return;
    closed = true;
    if (hideToday) { try { window.localStorage.setItem(KEY, today()); } catch (e) {} }
    pop.classList.remove('is-open');
    if (lenis()) lenis().start();
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', layout);
    setTimeout(function () { pop.remove(); }, 650);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function onKey(e) {
    if (e.key === 'Escape') { close(false); return; }
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && overflow && pop.contains(document.activeElement) && !e.target.matches('input')) {
      e.preventDefault(); goTo(current() + (e.key === 'ArrowRight' ? 1 : -1)); return;
    }
    if (e.key !== 'Tab') return;
    var f = Array.from(pop.querySelectorAll('a, button:not([disabled]), input')).filter(function (el) { return el.offsetParent !== null && !el.closest('.is-leaving'); });
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  // 키보드로 화면 밖 팝업에 포커스가 가면 그 팝업이 보이도록
  list.addEventListener('focusin', function (e) {
    var item = e.target.closest('.pop__item');
    if (!item || !overflow) return;
    var l = item.offsetLeft - list.offsetLeft, r = l + item.offsetWidth;
    if (l < list.scrollLeft || r > list.scrollLeft + list.clientWidth) goTo(els().indexOf(item));
  });

  check.addEventListener('change', function () { if (check.checked) setTimeout(function () { close(true); }, 250); });
  closeBtn.addEventListener('click', function () { close(check.checked); });
  pop.querySelector('.pop__dim').addEventListener('click', function () { close(false); });
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', layout);
  // 터치 기기: 팝업 뒤 페이지가 스크롤되지 않게 (팝업 띠는 옆으로 넘김 가능)
  pop.addEventListener('touchmove', function (e) { if (!e.target.closest('.pop__list')) e.preventDefault(); }, { passive: false });
  // 휠: 뒤 페이지 스크롤 막기. 팝업 띠 위에서는 트랙패드 가로 스크롤·세로 휠을 가로 이동으로 사용
  var wheelLock = 0;
  pop.addEventListener('wheel', function (e) {
    if (overflow && e.target.closest('.pop__list')) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // 트랙패드 가로 스크롤은 그대로 (놓으면 스냅)
      var now = Date.now();
      if (Math.abs(e.deltaY) > 8 && now > wheelLock) { wheelLock = now + 500; goTo(current() + (e.deltaY > 0 ? 1 : -1)); }
    }
    e.preventDefault();
  }, { passive: false });

  // 메인 배너가 먼저 뜬 뒤 살짝 늦게 등장
  setTimeout(open, 500);
})();
