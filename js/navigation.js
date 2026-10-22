/* =========================================================
   GLOBAL NAVIGATION — 스티키 헤더 + 드롭다운 + 모바일 아코디언 메뉴
   - 첫 화면(배너 위): 투명. 배너가 어두우면 흰 글자·흰 로고 (hero.js 가 data-tone 지정)
   - 10px 이상 스크롤 · 헤더에 마우스/포커스 · 드롭다운 열림 → 흰 배경
   - 1Depth 에 마우스를 올리면 드롭다운 (열 때 90ms, 닫을 때 220ms 지연으로 끊김 없이 이동)
   - 키보드: 포커스 시 열림, ↓ 로 하위 메뉴, Esc 로 닫기 / 터치: 첫 탭에 열고 두 번째 탭에 이동
   ========================================================= */
(function () {
  'use strict';

  var gnb = document.getElementById('gnb');
  if (!gnb) return;
  var items = Array.from(gnb.querySelectorAll('.gnb__item'));
  var OFFSET = 10;
  var hovering = false, focused = false, openItem = null, openT = 0, closeT = 0, ticking = false;

  function render() {
    var past = window.scrollY > OFFSET;
    gnb.classList.toggle('is-solid', past || hovering || focused || !!openItem || gnb.classList.contains('is-menu'));
  }
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { render(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', render, { passive: true });
  render();

  /* ----- 드롭다운 ----- */
  function setOpen(item) {
    if (item === openItem) return;
    if (openItem) {
      openItem.classList.remove('is-open');
      openItem.querySelector('.gnb__link').setAttribute('aria-expanded', 'false');
    }
    openItem = item;
    if (item) {
      item.classList.add('is-open');
      item.querySelector('.gnb__link').setAttribute('aria-expanded', 'true');
    }
    render();
  }
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

  items.forEach(function (item) {
    var link = item.querySelector('.gnb__link');
    item.addEventListener('mouseenter', function () {
      if (!canHover.matches) return;
      clearTimeout(closeT); clearTimeout(openT);
      // 이미 다른 메뉴가 열려 있으면 바로 전환, 처음이면 살짝 기다렸다 열기(스쳐 지나갈 때 깜빡임 방지)
      if (openItem) setOpen(item); else openT = setTimeout(function () { setOpen(item); }, 90);
    });
    item.addEventListener('mouseleave', function () {
      if (!canHover.matches) return;
      clearTimeout(openT);
      closeT = setTimeout(function () { if (openItem === item) setOpen(null); }, 220);
    });
    // 터치(태블릿 가로 등): 첫 탭은 열기만
    link.addEventListener('click', function (e) {
      if (canHover.matches) return;
      if (openItem !== item) { e.preventDefault(); setOpen(item); }
    });
    link.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' && openItem !== item) {
        if (e.key === 'ArrowDown') e.preventDefault();
        setOpen(item);
        if (e.key === 'ArrowDown') { var first = item.querySelector('.gnb__drop a'); if (first) first.focus(); }
      }
    });
    item.addEventListener('focusin', function () { clearTimeout(closeT); setOpen(item); });
    item.querySelectorAll('.gnb__drop a').forEach(function (a, i, all) {
      a.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); (all[i + 1] || all[0]).focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); (all[i - 1] || link).focus(); }
      });
    });
  });
  gnb.addEventListener('mouseenter', function () { hovering = true; render(); });
  gnb.addEventListener('mouseleave', function () { hovering = false; render(); });
  gnb.addEventListener('focusin', function () { focused = true; render(); });
  gnb.addEventListener('focusout', function (e) {
    if (!gnb.contains(e.relatedTarget)) { focused = false; setOpen(null); render(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (openItem) { var l = openItem.querySelector('.gnb__link'); setOpen(null); l.focus(); }
    if (menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
  });
  document.addEventListener('pointerdown', function (e) { if (openItem && !gnb.contains(e.target)) setOpen(null); });

  /* ----- 모바일 전체 메뉴 ----- */
  var menuBtn = gnb.querySelector('.gnb__menu');
  var drawer = document.getElementById('drawer');
  var root = document.documentElement;
  var pushed = false;
  function lenis() { return window.SS && window.SS.lenis; }
  function setMenu(open, fromHistory) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    gnb.classList.toggle('is-menu', open);
    root.classList.toggle('is-locked', open);   // 배경 스크롤 막기
    if (open) {
      drawer.hidden = false;
      requestAnimationFrame(function () { drawer.classList.add('is-open'); });
      if (lenis()) lenis().stop();
      // 휴대폰 '뒤로 가기'로 메뉴만 닫히도록
      if (!fromHistory) { history.pushState({ ssMenu: 1 }, ''); pushed = true; }
    } else {
      drawer.classList.remove('is-open');
      setTimeout(function () { if (!drawer.classList.contains('is-open')) drawer.hidden = true; }, 420);
      if (lenis()) lenis().start();
      if (pushed && !fromHistory) { pushed = false; history.back(); }
    }
    render();
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  window.addEventListener('popstate', function () {
    if (menuBtn.getAttribute('aria-expanded') === 'true') { pushed = false; setMenu(false, true); }
  });
  drawer.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (a && pushed) { pushed = false; } // 페이지 이동: 기록 정리 없이 이동
  });

  // 아코디언: 한 번에 하나만 펼침, 높이를 부드럽게
  var toggles = Array.from(drawer.querySelectorAll('.drawer__toggle'));
  function setSub(btn, open) {
    var sub = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', String(open));
    if (open) {
      sub.hidden = false;
      var h = sub.scrollHeight;
      sub.style.height = '0px';
      requestAnimationFrame(function () { sub.style.height = h + 'px'; });
      sub.addEventListener('transitionend', function te() { sub.style.height = ''; sub.removeEventListener('transitionend', te); });
    } else {
      sub.style.height = sub.scrollHeight + 'px';
      requestAnimationFrame(function () { sub.style.height = '0px'; });
      sub.addEventListener('transitionend', function te() { if (btn.getAttribute('aria-expanded') === 'false') sub.hidden = true; sub.style.height = ''; sub.removeEventListener('transitionend', te); });
    }
  }
  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      toggles.forEach(function (b) { if (b !== btn && b.getAttribute('aria-expanded') === 'true') setSub(b, false); });
      setSub(btn, open);
    });
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1024 && menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false); });

  window.SSNav = { setTone: function (tone) { gnb.dataset.tone = tone; } };
})();
