/* =========================================================
   09. 오시는 길 — 약도 위에 마우스를 올리면 실제 구글 지도로 부드럽게 전환
   - 구글 지도는 외부 서버 요청이므로 자동으로 불러오지 않음: 처음 한 번은 약도를 눌러야 불러옴
     (불러온 뒤에는 마우스를 올리면 약도 ↔ 지도가 부드럽게 전환)
   - 지도를 조작하는 동안(클릭·드래그)은 닫히지 않음, 바깥을 누르거나 × 로 닫음
   - 터치 기기: 탭하면 열림
   ========================================================= */
(function () {
  'use strict';

  var map = document.querySelector('.map');
  if (!map) return;
  var live = map.querySelector('.map__live');
  var hint = map.querySelector('.map__hint');
  var SRC = 'https://maps.google.com/maps?q=' + encodeURIComponent('순수안피부과의원 서울 서초구 사임당로 157') + '&z=17&hl=ko&output=embed';
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var iframe = null, openT = 0, closeT = 0, inUse = false;

  var ASK = '약도를 누르면 실제 구글 지도를 불러옵니다 (외부 연결)';
  hint.textContent = ASK;
  map.setAttribute('role', 'button');
  map.setAttribute('tabindex', '0');
  map.setAttribute('aria-label', '실제 구글 지도 보기');

  var closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'map__close';
  closeBtn.setAttribute('aria-label', '약도로 돌아가기');
  closeBtn.textContent = '×';
  map.appendChild(closeBtn);

  function ensure() {
    if (iframe) return;
    iframe = document.createElement('iframe');
    iframe.src = SRC;
    iframe.title = '순수안피부과 위치 (구글 지도)';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    live.appendChild(iframe);
    hint.textContent = canHover ? '마우스를 올리면 실제 지도로 바뀝니다' : '약도를 누르면 실제 지도를 볼 수 있어요';
  }
  function open() {
    clearTimeout(closeT);
    ensure();
    map.classList.add('is-live');
    map.removeAttribute('role');
    map.removeAttribute('aria-label');
    map.tabIndex = -1;
  }
  function close() {
    inUse = false;
    map.classList.remove('is-live');
    map.setAttribute('role', 'button');
    map.setAttribute('aria-label', '실제 구글 지도 보기');
    map.tabIndex = 0;
  }

  if (canHover) {
    map.addEventListener('mouseenter', function () {
      clearTimeout(closeT);
      if (!iframe) { map.classList.add('is-ask'); return; }   // 아직 불러오지 않았으면 안내만
      openT = setTimeout(open, 160);
    });
    map.addEventListener('mouseleave', function () {
      clearTimeout(openT);
      map.classList.remove('is-ask');
      if (inUse) return; // 지도를 누른 뒤에는 바깥을 클릭해야 닫힘
      closeT = setTimeout(close, 700);
    });
  }
  map.addEventListener('click', function (e) { if (e.target === closeBtn) return; if (!map.classList.contains('is-live')) open(); });
  map.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !map.classList.contains('is-live')) { e.preventDefault(); open(); closeBtn.focus(); } });
  closeBtn.addEventListener('click', function (e) { e.stopPropagation(); close(); map.focus(); });

  // 지도(iframe)를 클릭하면 창의 포커스가 iframe 으로 이동 → 사용 중으로 표시
  window.addEventListener('blur', function () { setTimeout(function () { if (iframe && document.activeElement === iframe) inUse = true; }, 0); });
  document.addEventListener('pointerdown', function (e) { if (map.classList.contains('is-live') && !map.contains(e.target)) close(); });
})();
