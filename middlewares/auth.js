
var mongoose = require('mongoose');
var UserModel = mongoose.model('User');
var Message = require('../proxy').Message;
var config = require('../config');
var eventproxy = require('eventproxy');
var UserProxy = require('../proxy').User;
var crypto = require('crypto');

/**
 *  Quyền quản trị được yêu cầu 
 */
exports.adminRequired = function (req, res, next) {
  if (!req.session.user) {
    return res.render('notify/notify', {error: ' Bạn chưa đăng nhập 。'});
  }
  if (!req.session.user.is_admin) {
    return res.render('notify/notify', {error: ' Quyền quản trị được yêu cầu 。'});
  }
  next();
};

/**
 *  Yêu cầu đăng nhập 
 */
exports.userRequired = function (req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(403).send('forbidden!');
  }
  next();
};

exports.blockUser = function () {
  return function (req, res, next) {
    if (req.session.user && req.session.user.is_block && req.method !== 'GET') {
      return res.status(403).send(' Bạn đã bị chặn quản trị 。 Có thắc mắc, xin vui lòng liên hệ  @alsotang。');
    }
    next();
  };
};


function gen_session(user, res) {
  var auth_token = user._id + '$$$$'; //  Thêm thông tin có thể được lưu trữ sau khi ， Dùng  $$$$  Để tách 
  res.cookie(config.auth_cookie_name, auth_token,
    {path: '/', maxAge: 1000 * 60 * 60 * 24 * 30, signed: true, httpOnly: true}); //cookie  Hiệu lực 30 Ngày 
}

exports.gen_session = gen_session;

//  Xác minh  Dùng  Người dùng được đăng nhập vào 
exports.authUser = function (req, res, next) {
  var ep = new eventproxy();
  ep.fail(next);

  if (config.debug && req.cookies['mock_user']) {
    var mockUser = JSON.parse(req.cookies['mock_user']);
    req.session.user = new UserModel(mockUser);
    if (mockUser.is_admin) {
      req.session.user.is_admin = true;
    }
    return next();
  }

  ep.all('get_user', function (user) {
    if (!user) {
      return next();
    }
    user = res.locals.current_user = req.session.user = new UserModel(user);

    if (config.admins.hasOwnProperty(user.loginname)) {
      user.is_admin = true;
    }
    Message.getMessagesCount(user._id, ep.done(function (count) {
      user.messages_count = count;
      next();
    }));

  });

  if (req.session.user) {
    ep.emit('get_user', req.session.user);
  } else {
    var auth_token = req.signedCookies[config.auth_cookie_name];
    if (!auth_token) {
      return next();
    }

    var auth = auth_token.split('$$$$');
    var user_id = auth[0];
    UserProxy.getUserById(user_id, ep.done('get_user'));
  }
};
