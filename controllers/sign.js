
var validator = require('validator');
var eventproxy = require('eventproxy');
var config = require('../config');
var User = require('../proxy').User;
var mail = require('../common/mail');
var tools = require('../common/tools');
var utility = require('utility');
var authMiddleWare = require('../middlewares/auth');

//sign up
exports.showSignup = function (req, res) {
  res.render('sign/signup');
};

exports.signup = function (req, res, next) {
  var loginname = validator.trim(req.body.loginname).toLowerCase();
  var email = validator.trim(req.body.email).toLowerCase();
  var pass = validator.trim(req.body.pass);
  var rePass = validator.trim(req.body.re_pass);

  var ep = new eventproxy();
  ep.fail(next);
  ep.on('prop_err', function (msg) {
    res.status(422);
    res.render('sign/signup', {error: msg, loginname: loginname, email: email});
  });

  //  Xác minh tính đúng đắn của thông tin 
  if ([loginname, pass, rePass, email].some(function (item) { return item === ''; })) {
    ep.emit('prop_err', ' Thông tin không đầy đủ 。');
    return;
  }
  if (loginname.length < 5) {
    ep.emit('prop_err', ' Tên người dùng nhất 5 Nhân vật 。');
    return;
  }
  if (!tools.validateId(loginname)) {
    return ep.emit('prop_err', ' Tên sử dụng không hợp pháp 。');
  }
  if (!validator.isEmail(email)) {
    return ep.emit('prop_err', ' E-mail là không hợp pháp 。');
  }
  if (pass !== rePass) {
    return ep.emit('prop_err', ' Nhập mật khẩu hai lần không phù hợp 。');
  }
  // END  Xác minh tính đúng đắn của thông tin 


  User.getUsersByQuery({'$or': [
    {'loginname': loginname},
    {'email': email}
  ]}, {}, function (err, users) {
    if (err) {
      return next(err);
    }
    if (users.length > 0) {
      ep.emit('prop_err', ' Tên đăng nhập hoặc E-mail đã được sử dụng 。');
      return;
    }

    tools.bhash(pass, ep.done(function (passhash) {
      // create gravatar
      var avatarUrl = User.makeGravatar(email);
      User.newAndSave(loginname, loginname, passhash, email, avatarUrl, false, function (err) {
        if (err) {
          return next(err);
        }
        //  Gửi email kích hoạt 
        mail.sendActiveMail(email, utility.md5(email + passhash + config.session_secret), loginname);
        res.render('sign/signup', {
          success: ' Chào mừng bạn đến  ' + config.name + '！ Chúng ta phải cung cấp cho email đăng ký của bạn đã gửi một e-mail ， Vui lòng click vào các liên kết bên trong để kích hoạt tài khoản của bạn 。'
        });
      });

    }));
  });
};

/**
 * Show user login page.
 *
 * @param  {HttpRequest} req
 * @param  {HttpResponse} res
 */
exports.showLogin = function (req, res) {
  req.session._loginReferer = req.headers.referer;
  res.render('sign/signin');
};

/**
 * define some page when login just jump to the home page
 * @type {Array}
 */
var notJump = [
  '/active_account', //active page
  '/reset_pass',     //reset password page, avoid to reset twice
  '/signup',         //regist page
  '/search_pass'    //serch pass page
];

/**
 * Handle user login.
 *
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 * @param {Function} next
 */
exports.login = function (req, res, next) {
  var loginname = validator.trim(req.body.name).toLowerCase();
  var pass = validator.trim(req.body.pass);
  var ep = new eventproxy();
  ep.fail(next);

  if (!loginname || !pass) {
    res.status(422);
    return res.render('sign/signin', { error: ' Thông tin không đầy đủ 。' });
  }

  var getUser;
  if (loginname.indexOf('@') !== -1) {
    getUser = User.getUserByMail;
  } else {
    getUser = User.getUserByLoginName;
  }

  ep.on('login_error', function (login_error) {
    res.status(403);
    res.render('sign/signin', { error: ' Tên người dùng hoặc mật khẩu lỗi ' });
  });

  getUser(loginname, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return ep.emit('login_error');
    }
    var passhash = user.pass;
    tools.bcompare(pass, passhash, ep.done(function (bool) {
      if (!bool) {
        return ep.emit('login_error');
      }
      if (!user.active) {
        //  Một lần nữa  Gửi email kích hoạt 
        mail.sendActiveMail(user.email, utility.md5(user.email + passhash + config.session_secret), user.loginname);
        res.status(403);
        return res.render('sign/signin', { error: ' Tài khoản này chưa được kích hoạt ， Liên kết kích hoạt đã được gửi đến  ' + user.email + '  Hộp thư ， Vui lòng kiểm tra 。' });
      }
      // store session cookie
      authMiddleWare.gen_session(user, res);
      //check at some page just jump to home page
      var refer = req.session._loginReferer || '/';
      for (var i = 0, len = notJump.length; i !== len; ++i) {
        if (refer.indexOf(notJump[i]) >= 0) {
          refer = '/';
          break;
        }
      }
      res.redirect(refer);
    }));
  });
};

// sign out
exports.signout = function (req, res, next) {
  req.session.destroy();
  res.clearCookie(config.auth_cookie_name, { path: '/' });
  res.redirect('/');
};

exports.active_account = function (req, res, next) {
  var key = req.query.key;
  var name = req.query.name;

  User.getUserByLoginName(name, function (err, user) {
    if (err) {
      return next(err);
    }
    var passhash = user.pass;
    if (!user || utility.md5(user.email + passhash + config.session_secret) !== key) {
      return res.render('notify/notify', {error: ' Thông tin là không chính xác ， Tài khoản không thể được kích hoạt 。'});
    }
    if (user.active) {
      return res.render('notify/notify', {error: ' Tài khoản được kích hoạt sẵn 。'});
    }
    user.active = true;
    user.save(function (err) {
      if (err) {
        return next(err);
      }
      res.render('notify/notify', {success: ' Tài khoản đã được kích hoạt ， Vui lòng đăng nhập '});
    });
  });
};

exports.showSearchPass = function (req, res) {
  res.render('sign/search_pass');
};

function randomString(size) {
  size = size || 6;
  var code_string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var max_num = code_string.length + 1;
  var new_pass = '';
  while (size > 0) {
    new_pass += code_string.charAt(Math.floor(Math.random() * max_num));
    size--;
  }
  return new_pass;
}

exports.updateSearchPass = function (req, res, next) {
  var email = validator.trim(req.body.email).toLowerCase();
  if (!validator.isEmail(email)) {
    return res.render('sign/search_pass', {error: ' E-mail là không hợp pháp ', email: email});
  }

  //  Tạo động retrive_key Và timestamp Đến users collection, Sau khi cài đặt mật khẩu để xác thực 
  var retrieveKey = randomString(15);
  var retrieveTime = new Date().getTime();
  User.getUserByMail(email, function (err, user) {
    if (!user) {
      res.render('sign/search_pass', {error: ' Nếu không có điện tử này  Hộp thư 。', email: email});
      return;
    }
    user.retrieve_key = retrieveKey;
    user.retrieve_time = retrieveTime;
    user.save(function (err) {
      if (err) {
        return next(err);
      }
      //  Gửi e-mail để thiết lập lại mật khẩu của bạn 
      mail.sendResetPassMail(email, retrieveKey, user.loginname);
      res.render('notify/notify', {success: ' Chúng tôi đã đưa cho bạn điền vào điện tử  Hộp thư  Gửi e-mail ， Xin vui lòng 24 Click vào liên kết bên trong vòng vài giờ để thiết lập lại mật khẩu của bạn 。'});
    });
  });
};

/**
 * reset password
 * 'get' to show the page, 'post' to reset password
 * after reset password, retrieve_key&time will be destroy
 * @param  {http.req}   req
 * @param  {http.res}   res
 * @param  {Function} next
 */
exports.reset_pass = function (req, res, next) {
  var key = req.query.key;
  var name = req.query.name;
  User.getUserByNameAndKey(name, key, function (err, user) {
    if (!user) {
      res.status(403);
      return res.render('notify/notify', {error: ' Thông tin là không chính xác ， Không thể thiết lập lại mật khẩu 。'});
    }
    var now = new Date().getTime();
    var oneDay = 1000 * 60 * 60 * 24;
    if (!user.retrieve_time || now - user.retrieve_time > oneDay) {
      res.status(403);
      return res.render('notify/notify', {error: ' Các liên kết đã hết hạn ， Xin vui lòng  Một lần nữa  Shen  Xin vui lòng 。'});
    }
    return res.render('sign/reset', {name: name, key: key});
  });
};

exports.update_pass = function (req, res, next) {
  var psw = req.body.psw || '';
  var repsw = req.body.repsw || '';
  var key = req.body.key || '';
  var name = req.body.name || '';
  var ep = new eventproxy();
  ep.fail(next);

  if (psw !== repsw) {
    return res.render('sign/reset', {name: name, key: key, error: ' Nhập mật khẩu hai lần không phù hợp 。'});
  }
  User.getUserByNameAndKey(name, key, ep.done(function (user) {
    if (!user) {
      return res.render('notify/notify', {error: ' Liên kết kích hoạt sai '});
    }
    tools.bhash(psw, ep.done(function (passhash) {
      user.pass = passhash;
      user.retrieve_key = null;
      user.retrieve_time = null;
      user.active = true; //  Máy hoạt động người dùng 
      user.save(function (err) {
        if (err) {
          return next(err);
        }
        return res.render('notify/notify', {success: ' Mật khẩu của bạn đã được thiết lập lại 。'});
      });
    }));
  }));
};

