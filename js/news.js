/* =========================================================
   02. 순수안 소식 (Figma V2 · 2026-11-20 최종)
   탭: 공지사항 / 치료후기 / 칼럼
   PC·태블릿: 가로 스크롤(드래그·휠·스크롤바) + 맨 끝 '자세히 보기' 카드
   모바일(≤767): 2열 카드 4개 + 하단 '자세히 보기' 버튼만
   썸네일: 정사각형 칸 안에 원본 비율 그대로(높이 기준, 크롭·변형 없음)
   데이터: data/feeds.js (window.SS_FEEDS, 수동 갱신)
   ========================================================= */
(function () {
  'use strict';

  var section = document.getElementById('news');
  var feeds = window.SS_FEEDS && window.SS_FEEDS.categories;
  if (!section || !feeds) return;

  var body = section.querySelector('.news__body');
  var el = section.querySelector('.news__swiper');
  var wrap = el.querySelector('.swiper-wrapper');
  var bar = section.querySelector('.news__bar');
  var moreBtn = section.querySelector('.news__more');
  var tabs = Array.from(section.querySelectorAll('[role="tab"]'));
  var mq = window.matchMedia('(max-width: 767px)');
  var MAX = 6, MAX_M = 4;
  var swiper = null, current = 'notice', busy = false;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ext(url) { return /^https?:/.test(url) ? ' target="_blank" rel="noopener"' : ''; }

  function card(key, it) {
    return '<a class="ncard ncard--' + key + '" href="' + esc(it.url) + '"' + ext(it.url) + '>' +
      '<span class="ncard__thumb"><img src="' + esc(it.thumb + (window.SS_FEEDS.version ? '?v=' + window.SS_FEEDS.version : '')) + '" alt="" loading="lazy" draggable="false"></span>' +
      '<span class="ncard__title">' + esc(it.title) + '</span>' +
      (it.date ? '<span class="ncard__date">' + esc(it.date) + '</span>' : '') + '</a>';
  }
  function moreTile(cat) {
    var label = cat.items.length ? '자세히 보기' : (cat.label + ' 게시판 바로가기');
    return '<a class="ncard-more" href="' + esc(cat.more) + '"' + ext(cat.more) + '>' +
      '<span class="ncard-more__arrow" aria-hidden="true"><svg viewBox="0 0 28 28"><path d="M6 14h16M15 7l7 7-7 7"/></svg></span>' +
      '<span class="ncard-more__label">' + esc(label) + '</span>' +
      (cat.empty ? '<span class="ncard-more__note">' + esc(cat.empty) + '</span>' : '') + '</a>';
  }

  function render(key) {
    var cat = feeds[key];
    var mobile = mq.matches;
    var items = cat.items.slice(0, mobile ? MAX_M : MAX);
    var html = items.map(function (it) { return '<div class="swiper-slide">' + card(key, it) + '</div>'; });
    if (!mobile || !items.length) html.push('<div class="swiper-slide ncard-more-slide">' + moreTile(cat) + '</div>');
    wrap.innerHTML = html.join('');
    if (moreBtn) { moreBtn.href = cat.more; moreBtn.hidden = !mobile || !items.length; }
    Array.from(wrap.children).forEach(function (s, i) { s.style.transitionDelay = (i * 0.08) + 's'; });
  }

  function dragSize() { return window.innerWidth > 1024 ? Math.round(240 * Math.min(1, window.innerWidth / 1920)) : 'auto'; }
  function setup() {
    var mobile = mq.matches;
    if (swiper) { swiper.destroy(true, true); swiper = null; }
    section.classList.toggle('is-grid', mobile);
    render(current);
    if (mobile || !window.Swiper) return;
    swiper = new Swiper(el, {
      slidesPerView: 2.2,
      spaceBetween: 20,
      speed: 700,
      watchOverflow: true,
      mousewheel: { forceToAxis: true, releaseOnEdges: true },
      scrollbar: { el: bar, draggable: true, dragSize: dragSize(), snapOnRelease: true },
      breakpoints: { 1025: { slidesPerView: 4, spaceBetween: 22 } },
      on: {
        resize: function (s) { s.params.scrollbar.dragSize = dragSize(); if (s.scrollbar) s.scrollbar.updateSize(); },
        touchStart: function () { el.classList.add('is-grabbing'); },
        touchEnd: function () { el.classList.remove('is-grabbing'); }
      }
    });
    el.classList.add('is-grab');
  }

  function select(tab, focus) {
    var key = tab.dataset.tab;
    tabs.forEach(function (t) { var on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    body.setAttribute('aria-labelledby', tab.id);
    if (focus) tab.focus();
    if (key === current || busy) return;
    current = key; busy = true;
    el.classList.add('is-switching');
    setTimeout(function () {
      if (swiper) { render(key); swiper.update(); swiper.slideTo(0, 0); if (swiper.scrollbar) { swiper.scrollbar.updateSize(); swiper.scrollbar.setTranslate(); } }
      else render(key);
      requestAnimationFrame(function () { el.classList.remove('is-switching'); busy = false; if (window.ScrollTrigger) ScrollTrigger.refresh(); });
    }, 380);
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });

  setup();
  (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function () { setup(); if (window.ScrollTrigger) ScrollTrigger.refresh(); });

  /* ----- DRAG 커서 (마우스 기기 PC) ----- */
  var cursor = section.querySelector('.drag-cursor');
  if (!cursor) return;
  document.body.appendChild(cursor);
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && window.innerWidth > 1024) {
    var cx = 0, cy = 0, tx = 0, ty = 0, on = false, raf = 0;
    function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cursor.style.left = cx + 'px'; cursor.style.top = cy + 'px';
      raf = on || Math.abs(tx - cx) > 0.5 ? requestAnimationFrame(loop) : 0;
    }
    el.addEventListener('mousemove', function (e) {
      if (e.target.closest('.ncard-more')) { if (on) { on = false; cursor.classList.remove('is-on'); } return; }
      tx = e.clientX; ty = e.clientY;
      if (!on) { on = true; cx = tx; cy = ty; cursor.classList.add('is-on'); }
      if (!raf) raf = requestAnimationFrame(loop);
    });
    el.addEventListener('mouseleave', function () { on = false; cursor.classList.remove('is-on', 'is-down'); });
    el.addEventListener('mousedown', function () { cursor.classList.add('is-down'); });
    window.addEventListener('mouseup', function () { cursor.classList.remove('is-down'); });
    window.addEventListener('scroll', function () { if (on) { on = false; cursor.classList.remove('is-on'); } }, { passive: true });
  }
})();
