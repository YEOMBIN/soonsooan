/* =========================================================
   02. 순수안 소식 — 청라빛안과 공지사항 방식
   탭(공지사항/유튜브/블로그) + 드래그 카드 슬라이드 + 진행 바 + DRAG 커서
   데이터: data/feeds.js (window.SS_FEEDS, 수동 갱신)
   ========================================================= */
(function () {
  'use strict';

  var section = document.getElementById('news');
  var feeds = window.SS_FEEDS && window.SS_FEEDS.categories;
  if (!section || !feeds || !window.Swiper) return;

  var body = section.querySelector('.news__body');
  var el = section.querySelector('.news__swiper');
  var tabs = Array.from(section.querySelectorAll('[role="tab"]'));
  var MAX = 5;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function slidesFor(key) {
    var cat = feeds[key];
    var html = cat.items.slice(0, MAX).map(function (it) {
      return '<div class="swiper-slide"><a class="ncard ncard--' + key + '" href="' + esc(it.url) + '"' + (/^https?:/.test(it.url) ? ' target="_blank" rel="noopener"' : '') + '>' +
        '<span class="ncard__thumb"><img src="' + esc(it.thumb) + '" alt="" loading="lazy" draggable="false"></span>' +
        '<span class="ncard__title">' + esc(it.title) + '</span>' +
        (it.date ? '<span class="ncard__date">' + esc(it.date) + '</span>' : '') +
        '</a></div>';
    });
    html.push('<div class="swiper-slide ncard-more-slide"><a class="ncard-more" href="' + esc(cat.more) + '"' + (/^https?:/.test(cat.more) ? ' target="_blank" rel="noopener"' : '') + '><span>' +
      esc(cat.moreLabel || (cat.label + ' 더보기')).replace(' 더보기', '<b>더보기 ⟶</b>') + '</span></a></div>');
    return html;
  }

  var bar = section.querySelector('.news__bar');
  function dragSize() { return window.innerWidth > 1024 ? Math.round(200 * Math.min(1, window.innerWidth / 1920)) : 'auto'; }

  // PC 4개 · 태블릿 3개 · 모바일 2개가 보이고, 나머지 카드와 '더보기'는 끌어서(드래그·스크롤바·트랙패드 가로 스크롤) 확인
  var swiper = new Swiper(el, {
    slidesPerView: 2,
    spaceBetween: 12,
    speed: 700,
    grabCursor: false,
    watchOverflow: true,
    mousewheel: { forceToAxis: true, releaseOnEdges: true },
    scrollbar: { el: bar, draggable: true, dragSize: dragSize(), snapOnRelease: true },
    breakpoints: {
      768: { slidesPerView: 3, spaceBetween: 20 },
      1025: { slidesPerView: 4, spaceBetween: Math.round(40 * Math.min(1, window.innerWidth / 1920)) }
    },
    on: {
      resize: function (s) { s.params.scrollbar.dragSize = dragSize(); if (s.scrollbar) s.scrollbar.updateSize(); },
      touchStart: function () { el.classList.add('is-grabbing'); },
      touchEnd: function () { el.classList.remove('is-grabbing'); }
    }
  });
  el.classList.add('is-grab');

  function fill(key, animate) {
    // 유튜브는 세로 카드(피그마 284×411)라 섹션 높이가 1103으로 늘어남 → 고정·덮기 위치 다시 계산
    var tall = key === 'youtube';
    if (section.classList.contains('is-youtube') !== tall) {
      section.classList.toggle('is-youtube', tall);
      requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
    }
    swiper.removeAllSlides();
    swiper.appendSlide(slidesFor(key));
    swiper.slides.forEach(function (s, i) { s.style.transitionDelay = animate ? (i * 0.08) + 's' : '0s'; });
    swiper.update();
    swiper.slideTo(0, 0);
    if (swiper.scrollbar) { swiper.scrollbar.updateSize(); swiper.scrollbar.setTranslate(); }
  }

  var current = 'notice', busy = false;
  function select(tab, focus) {
    var key = tab.dataset.tab;
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    body.setAttribute('aria-labelledby', tab.id);
    if (focus) tab.focus();
    if (key === current || busy) return;
    current = key; busy = true;
    el.classList.add('is-switching');
    setTimeout(function () {
      fill(key, true);
      requestAnimationFrame(function () { el.classList.remove('is-switching'); busy = false; });
    }, 380);
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });

  fill('notice', false);

  /* ----- DRAG 커서 (마우스 기기 PC) ----- */
  var cursor = section.querySelector('.drag-cursor');
  document.body.appendChild(cursor); // 등장 모션(transform)이 걸린 부모 안에 있으면 fixed 위치가 어긋나므로 body로 옮김
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && window.innerWidth > 1024) {
    var cx = 0, cy = 0, tx = 0, ty = 0, on = false, raf = 0;
    function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cursor.style.left = cx + 'px'; cursor.style.top = cy + 'px';
      raf = on || Math.abs(tx - cx) > 0.5 ? requestAnimationFrame(loop) : 0;
    }
    el.addEventListener('mousemove', function (e) {
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
