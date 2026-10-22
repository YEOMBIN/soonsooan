/* =========================================================
   메인 팝업 설정 (피그마 32:132)
   - enabled: false 로 바꾸면 팝업이 나타나지 않음
   - items: 위에서부터 왼쪽→오른쪽 순서로 나란히 표시. 추가·삭제·순서 변경은 여기만 고치면 됨
       image  : 이미지 경로 (assets/img/popup/ 에 넣기)
       width / height : 이미지 원본 비율 (가로·세로 px). 피그마 크기 기준
       alt    : 이미지 설명 (보조기기용)
       link   : 누르면 이동할 주소. 확인된 곳만 넣고, 없으면 null
       newTab : 외부 주소면 true
   - '오늘 열지 않기'를 누르면 이 브라우저에서 오늘(현지 날짜) 하루 동안 다시 나타나지 않음
     팝업 내용을 바꿨다면 version 을 바꾸면 이전 '오늘 열지 않기' 기록과 상관없이 다시 표시됨
   ========================================================= */
window.SS_POPUPS = {
  enabled: true,
  version: '2026-10',
  items: [
    {
      image: 'assets/img/popup/popup-202610-schedule.webp',
      width: 405, height: 572,
      alt: '순수안피부과 10월 진료일정 — 정기휴진 매주 일요일, 10월 3일(토) 개천절 휴진, 10월 5일(월)~10월 10일(토) 휴진',
      link: 'pages/news/notice-5685.html', newTab: false
    },
    {
      image: 'assets/img/popup/popup-2026-autumn-event.webp',
      width: 403, height: 572,
      alt: '2026 가을 순수안피부과 이벤트 프로그램',
      link: 'pages/news/notice-5624.html', newTab: false
    },
    {
      image: 'assets/img/popup/popup-juvelook.webp',
      width: 572, height: 572,
      alt: '쥬베룩 붓기·뻣뻣함은 언제까지 갈까요? 시술 당일부터 한 달 뒤까지의 변화',
      link: null, newTab: false
    }
  ]
};
