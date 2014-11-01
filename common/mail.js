var mailer = require('nodemailer');
var config = require('../config');
var util = require('util');

var transport = mailer.createTransport('SMTP', config.mail_opts);
var SITE_ROOT_URL = 'http://' + config.host;

/**
 * Send an email
 * @param {Object} data  Các đối tượng mail 
 */
var sendMail = function (data) {
  if (config.debug) {
    return;
  }
  //  Thư mảng traversal ， Gửi mỗi tin nhắn ， Nếu bạn đã không gửi ， Sau đó nhấn vào một mảng ， Trong khi đó kích hoạt mailEvent Biến cố 
  transport.sendMail(data, function (err) {
    if (err) {
      //  Viết để đăng nhập 
      console.log(err);
    }
  });
};
exports.sendMail = sendMail;

/**
 *  Gửi e-mail để kích hoạt thông báo 
 * @param {String} who  Địa chỉ e-mail của người nhận 
 * @param {String} token  Reset token Chuỗi 
 * @param {String} name  Tên của người nhận 
 */
exports.sendActiveMail = function (who, token, name) {
  var from = util.format('%s <%s>', config.name, config.mail_opts.auth.user);
  var to = who;
  var subject = config.name + ' Kích hoạt tài khoản cộng đồng ';
  var html = '<p> Xin chào ：' + name + '</p>' +
    '<p> Chúng tôi nhận được bạn ' + config.name + ' Thông tin đăng ký Cộng đồng ， Vui lòng click vào liên kết sau để kích hoạt tài khoản của bạn ：</p>' +
    '<a href="' + SITE_ROOT_URL + '/active_account?key=' + token + '&name=' + name + '"> Kích hoạt liên kết </a>' +
    '<p> Nếu bạn không ' + config.name + ' Cộng đồng điền thông tin đăng ký ， Mô tả lạm dụng e-mail của bạn ， Xin hãy xóa tin nhắn này ， Chúng tôi làm phiền gây ra cho bạn để cảm thấy tiếc cho 。</p>' +
    '<p>' + config.name + ' Cộng đồng   Của anh 。</p>';

  exports.sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html
  });
};

/**
 *  Gửi mật khẩu email thông báo thiết lập lại 
 * @param {String} who  Địa chỉ e-mail của người nhận 
 * @param {String} token  Reset token Chuỗi 
 * @param {String} name  Tên của người nhận 
 */
exports.sendResetPassMail = function (who, token, name) {
  var from = util.format('%s <%s>', config.name, config.mail_opts.auth.user);
  var to = who;
  var subject = config.name + ' Cộng đồng  Đặt lại mật khẩu ';
  var html = '<p> Xin chào ：' + name + '</p>' +
    '<p> Chúng tôi nhận được bạn ' + config.name + ' Cộng đồng  Yêu cầu đặt lại mật khẩu của bạn ， Xin vui lòng 24 Nhấp vào liên kết dưới đây để đặt lại mật khẩu của bạn trong vòng vài giờ ：</p>' +
    '<a href="' + SITE_ROOT_URL + '/reset_pass?key=' + token + '&name=' + name + '"> Liên kết đặt lại mật khẩu </a>' +
    '<p> Nếu bạn không ' + config.name + ' Cộng đồng điền thông tin đăng ký ， Mô tả lạm dụng e-mail của bạn ， Xin hãy xóa tin nhắn này ， Chúng tôi làm phiền gây ra cho bạn để cảm thấy tiếc cho 。</p>' +
    '<p>' + config.name + ' Cộng đồng   Của anh 。</p>';

  exports.sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html
  });
};
