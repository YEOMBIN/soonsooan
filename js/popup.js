/* =========================================================
   메인 팝업 — 설정은 data/popups.js (켜기/끄기, 이미지·링크 추가·삭제)
   - 처음 들어오면 메인 배너 위에 부드럽게 나타남 (화면이 밀리지 않도록 고정 레이어)
   - X·바깥 어두운 영역·Esc: 닫기 (다음 방문 때 다시 표시)
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

  var items = cfg.items.map(function (it) {
    var style = ' style="--w:' + (+it.width || 400) + ';--h:' + (+it.height || 572) + '"';
    var img = '<img src="' + esc(it.image) + '" alt="' + esc(it.alt) + '" width="' + (+it.width || 400) + '" height="' + (+it.height || 572) + '" draggable="false">';
    if (it.link) return '<a class="pop__item" href="' + esc(it.link) + '"' + (it.newTab ? ' target="_blank" rel="noopener"' : '') + style + '>' + img + '</a>';
    return '<div class="pop__item"' + style + '>' + img + '</div>';
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
        '<button type="button" class="pop__close" aria-label="팝업 닫기"><img src="assets/img/popup/icon-close.svg" alt="" width="25" height="29"></button>' +
      '</div>' +
      '<div class="pop__list">' + items + '</div>' +
    '</div>';

  var check = pop.querySelector('.pop__today input');
  var closeBtn = pop.querySelector('.pop__close');
  var lastFocus = null, closed = false;
  function lenis() { return window.SS && window.SS.lenis; }

  function open() {
    document.body.appendChild(pop);
    lastFocus = document.activeElement;
    if (lenis()) lenis().stop();
    requestAnimationFrame(function () { requestAnimationFrame(function () { pop.classList.add('is-open'); pop.focus({ preventScroll: true }); }); });
  }
  function close(hideToday) {
    if (closed) return;
    closed = true;
    if (hideToday) { try { window.localStorage.setItem(KEY, today()); } catch (e) {} }
    pop.classList.remove('is-open');
    if (lenis()) lenis().start();
    document.removeEventListener('keydown', onKey);
    setTimeout(function () { pop.remove(); }, 650);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function onKey(e) {
    if (e.key === 'Escape') { close(false); return; }
    if (e.key !== 'Tab') return;
    var f = Array.from(pop.querySelectorAll('a, button, input'));
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  check.addEventListener('change', function () { if (check.checked) setTimeout(function () { close(true); }, 250); });
  closeBtn.addEventListener('click', function () { close(check.checked); });
  pop.querySelector('.pop__dim').addEventListener('click', function () { close(false); });
  document.addEventListener('keydown', onKey);
  // 터치 기기: 팝업 뒤 페이지가 스크롤되지 않게 (이미지 띠는 옆으로 넘김 가능)
  pop.addEventListener('touchmove', function (e) { if (!e.target.closest('.pop__list')) e.preventDefault(); }, { passive: false });
  pop.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });

  // 메인 배너가 먼저 뜬 뒤 살짝 늦게 등장
  setTimeout(open, 500);
})();
