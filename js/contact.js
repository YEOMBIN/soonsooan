/* =========================================================
   08. 빠른상담신청 — 가시안: 입력 확인만 하고 실제 전송은 하지 않음
   ========================================================= */
(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  if (!form) return;
  var notice = form.querySelector('.contact__notice');
  var agree = document.querySelector('.contact__agree');
  var agreeBox = agree.querySelector('input');
  var tel = form.querySelector('#f-tel');

  // 연락처 자동 하이픈
  tel.addEventListener('input', function () {
    var d = tel.value.replace(/\D/g, '').slice(0, 11);
    tel.value = d.length < 4 ? d : d.length < 8 ? d.slice(0, 3) + '-' + d.slice(3) : d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(-4);
  });

  form.addEventListener('input', function (e) { var f = e.target.closest('.field'); if (f) f.classList.remove('is-error'); });
  agreeBox.addEventListener('change', function () { agree.classList.remove('is-error'); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var first = null;
    form.querySelectorAll('[required]').forEach(function (el) {
      var bad = !el.value.trim() || (el === tel && el.value.replace(/\D/g, '').length < 9);
      el.closest('.field').classList.toggle('is-error', bad);
      el.setAttribute('aria-invalid', String(bad));
      if (bad && !first) first = el;
    });
    if (!agreeBox.checked) { agree.classList.add('is-error'); if (!first) first = agreeBox; }
    if (first) {
      notice.textContent = first === agreeBox ? '개인정보수집에 동의해 주세요.' : '이름, 연락처, 내용을 모두 입력해 주세요.';
      first.focus();
      return;
    }
    notice.textContent = '가시안에서는 실제로 전송되지 않습니다. (입력 확인 완료)';
  });
})();
