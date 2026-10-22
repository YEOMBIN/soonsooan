/* =========================================================
   가시안 보호 스크립트 (기존 페이지 복제본 전용)
   - 운영 서버·외부 서버로 데이터가 나가지 않도록 요청 차단
   - 입력 폼 전송 차단 → 안내 문구
   - 복제 범위 밖 링크(data-pv-blocked)는 이동하지 않고 안내
   ========================================================= */
(function () {
  'use strict';

  function isLocal(url) {
    try {
      var u = new URL(url, location.href);
      if (u.protocol === 'file:') return true;
      return u.origin === location.origin && !/index\.php|[?&]act=|procMember|procBoard|exec_/i.test(u.pathname + u.search);
    } catch (e) { return false; }
  }

  // 데이터 요청 차단 (XE의 ajax·통계 요청 등)
  var _fetch = window.fetch;
  if (_fetch) window.fetch = function (input) {
    var url = typeof input === 'string' ? input : input && input.url;
    if (!isLocal(url)) return Promise.reject(new TypeError('가시안: 외부 요청 차단 ' + url));
    return _fetch.apply(this, arguments);
  };
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__pvBlocked = !isLocal(url);
    return _open.apply(this, arguments);
  };
  var _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    if (this.__pvBlocked) { try { this.abort(); } catch (e) {} return; }
    return _send.apply(this, arguments);
  };
  if (navigator.sendBeacon) navigator.sendBeacon = function () { return false; };
  var _wopen = window.open;
  window.open = function (url) {
    if (url && /soonsooan\.co\.kr/i.test(String(url))) { toast('가시안에서는 운영 홈페이지로 이동하지 않습니다.'); return null; }
    return _wopen.apply(window, arguments);
  };

  var timer;
  function toast(msg) {
    var el = document.querySelector('.pv-toast');
    if (!el) { el = document.createElement('div'); el.className = 'pv-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(timer);
    timer = setTimeout(function () { el.classList.remove('is-on'); }, 2600);
  }

  // 폼 전송 차단
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    toast('가시안에서는 입력 내용이 전송되지 않습니다.');
  }, true);

  // 복제 범위 밖 링크 · 운영 홈페이지 링크
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    if (a.hasAttribute('data-pv-blocked')) {
      e.preventDefault();
      toast('가시안에 포함되지 않은 페이지입니다.');
      return;
    }
    var href = a.getAttribute('href') || '';
    if (/soonsooan\.co\.kr/i.test(href)) { e.preventDefault(); toast('가시안에서는 운영 홈페이지로 이동하지 않습니다.'); }
  }, true);
})();
