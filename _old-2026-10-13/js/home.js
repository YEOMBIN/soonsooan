(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- ≥1280: Figma 1920 좌표를 화면 폭 비율로 축소 ---------- */
  function setZoom() {
    var w = window.innerWidth;
    var z = w >= 1280 ? Math.min(1, w / 1920) : 1;
    root.style.setProperty('--z', z.toFixed(4));
  }
  setZoom();
  window.addEventListener('resize', setZoom);

  /* ---------- 3장 순환 캐러셀 (장비 · 인사말) ---------- */
  function carousel(stage, cards, start, onChange) {
    var n = cards.length;
    var active = start;
    var prevPos = [];

    function render() {
      cards.forEach(function (card, i) {
        var pos = ((i - active + 1 + n) % n) - 1;          // -1, 0, 1
        if (prevPos[i] !== undefined && Math.abs(pos - prevPos[i]) > 1) {
          // 반대편으로 넘어가는 카드는 순간 이동
          card.style.transition = 'none';
          card.setAttribute('data-pos', pos);
          void card.offsetWidth;
          card.style.transition = '';
        } else {
          card.setAttribute('data-pos', pos);
        }
        card.setAttribute('aria-hidden', pos !== 0 ? 'true' : 'false');
        prevPos[i] = pos;
      });
      if (onChange) onChange(cards[active]);
    }
    stage.querySelector('.car-btn.prev').addEventListener('click', function () { active = (active - 1 + n) % n; render(); });
    stage.querySelector('.car-btn.next').addEventListener('click', function () { active = (active + 1) % n; render(); });

    // 스와이프
    var sx = null;
    stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) { active = (active + (dx < 0 ? 1 : -1) + n) % n; render(); }
      sx = null;
    });
    render();
  }

  var eqStage = document.querySelector('.equip-stage');
  if (eqStage) {
    var cap = document.querySelector('.equip-cap');
    var capH = cap.querySelector('h3'), capP = cap.querySelector('p');
    var first = true;
    carousel(eqStage, Array.prototype.slice.call(eqStage.querySelectorAll('.eq-card')), 1, function (card) {
      var set = function () { capH.textContent = card.dataset.title; capP.textContent = card.dataset.desc || ' '; };
      if (first) { set(); first = false; return; }
      cap.classList.add('fade');
      setTimeout(function () { set(); cap.classList.remove('fade'); }, 450);
    });
  }

  var grStage = document.querySelector('.greet-stage');
  if (grStage) carousel(grStage, Array.prototype.slice.call(grStage.querySelectorAll('.gr-card')), 0);

  /* ---------- 순수안 소식: 탭 · 진행 막대 ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.news-tabs button'));
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (o) { o.setAttribute('aria-selected', String(o === t)); });
    });
  });
  var list = document.querySelector('.news-list');
  var thumb = document.querySelector('.news-bar i');
  function updateBar() {
    if (!list || !thumb) return;
    var max = list.scrollWidth - list.clientWidth;
    var bar = thumb.parentNode.clientWidth - thumb.clientWidth;
    thumb.style.transform = 'translateX(' + (max > 0 ? (list.scrollLeft / max) * bar : 0) + 'px)';
  }
  if (list) { list.addEventListener('scroll', updateBar, { passive: true }); window.addEventListener('resize', updateBar); }

  /* ---------- 빠른상담신청 ---------- */
  var form = document.querySelector('.contact-form');
  if (form) {
    var msg = form.querySelector('.ct-msg');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('#ct-name'), tel = form.querySelector('#ct-tel'), agree = form.querySelector('#ct-agree');
      var bad = [];
      name.setAttribute('aria-invalid', String(!name.value.trim()));
      if (!name.value.trim()) bad.push('이름');
      var telOk = /^[0-9\-\s]{9,}$/.test(tel.value.trim());
      tel.setAttribute('aria-invalid', String(!telOk));
      if (!telOk) bad.push('연락처');
      if (bad.length) { msg.textContent = bad.join(', ') + '을(를) 확인해주세요.'; return; }
      if (!agree.checked) { msg.textContent = '개인정보수집에 동의해주세요.'; return; }
      msg.textContent = '입력이 완료되었습니다. 전송 기능은 서버 연결 후 동작합니다.';
    });
  }
})();
