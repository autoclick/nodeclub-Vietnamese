$(document).ready(function () {
  var $responsiveBtn = $('#responsive-sidebar-trigger'),
    $sidebarMask = $('#sidebar-mask'),
    $sidebar = $('#sidebar'),
    $main = $('#main'),
    winWidth = $(window).width(),
    startX = 0,
    startY = 0,
    delta = {
      x: 0,
      y: 0
    },
    swipeThreshold = winWidth / 3,
    toggleSideBar = function () {
      var isShow = $responsiveBtn.data('is-show'),
        mainHeight = $main.height(),
        sidebarHeight = $sidebar.outerHeight();
      $sidebar.css({right: isShow ? -300 : 0});
      $responsiveBtn.data('is-show', !isShow);
      if (!isShow && mainHeight < sidebarHeight) {
        $main.height(sidebarHeight);
      }
      $sidebarMask[isShow ? 'fadeOut' : 'fadeIn']().height($('body').height());
    },
    touchstart = function (e) {
      var touchs = e.targetTouches;
      startX = +touchs[0].pageX;
      startY = +touchs[0].pageY;
      delta.x = delta.y = 0;
      document.body.addEventListener('touchmove', touchmove, false);
      document.body.addEventListener('touchend', touchend, false);
    },
    touchmove = function (e) {
      var touchs = e.changedTouches;
      delta.x = +touchs[0].pageX - startX;
      delta.y = +touchs[0].pageY - startY;
      // Khi khoảng cách ngang lớn hơn khoảng cách thẳng đứng ， Được coi là một người dùng muốn mở thanh trượt bên phải 
      if (Math.abs(delta.x) > Math.abs(delta.y)) {
        e.preventDefault();
      }
    },
    touchend = function (e) {
      var touchs = e.changedTouches,
        isShow = $responsiveBtn.data('is-show');
      delta.x = +touchs[0].pageX - startX;
      // Cột bên tay phải không được hiển thị && Người sử dụng touch Point ở phía bên phải của màn hình 1/4 Vùng &&move Khi khoảng cách là lớn hơn ngưỡng ， Mở cột bên tay phải 
      if (!isShow && (startX > winWidth * 3 / 4) && Math.abs(delta.x) > swipeThreshold) {
        $responsiveBtn.trigger('click');
      }
      // Hiển thị bên phải && Người sử dụng touch Point ở phía bên trái của màn hình 1/4 Vùng &&move Khi khoảng cách là lớn hơn ngưỡng ， Đóng thanh bên phải 
      if (isShow && (startX < winWidth * 1 / 4) && Math.abs(delta.x) > swipeThreshold) {
        $responsiveBtn.trigger('click');
      }
      startX = startY = 0;
      delta.x = delta.y = 0;
      document.body.removeEventListener('touchmove', touchmove, false);
      document.body.removeEventListener('touchend', touchend, false);
    };

  if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
    document.body.addEventListener('touchstart', touchstart);
  }

  $responsiveBtn.on('click', toggleSideBar);

  $sidebarMask.on('click', function () {
    $responsiveBtn.trigger('click');
  });

});