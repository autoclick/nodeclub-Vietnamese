var sign = require('./sign');
var Models = require('../models');
var User = Models.User;
var utility = require('utility');
var authMiddleWare = require('../middlewares/auth');
var tools = require('../common/tools');
var eventproxy = require('eventproxy');

exports.callback = function (req, res, next) {
  var profile = req.user;
  User.findOne({githubId: profile.id}, function (err, user) {
    if (err) {
      return next(err);
    }
    //  Khi người dùng đã  cnode  Người sử dụng ， Qua  github  Đăng nhập sẽ cập nhật thông tin của mình 
    if (user) {
      user.githubUsername = profile.username;
      user.githubId = profile.id;
      user.githubAccessToken = profile.accessToken;
      user.loginname = profile.username;
      user.avatar = profile._json.avatar_url;

      user.save(function (err) {
        if (err) {
          return next(err);
        }
        authMiddleWare.gen_session(user, res);
        return res.redirect('/');
      });
    } else {
      //  Nếu người dùng không tồn tại ， Việc thành lập một người dùng mới 
      req.session.profile = profile;
      return res.redirect('/auth/github/new');
    }
  });
};

exports.new = function (req, res, next) {
  res.render('sign/new_oauth', {actionPath: '/auth/github/create'});
};

exports.create = function (req, res, next) {
  var profile = req.session.profile;
  var isnew = req.body.isnew;
  var loginname = String(req.body.name).toLowerCase();
  var password = req.body.pass;
  var ep = new eventproxy();
  ep.fail(next);

  if (!profile) {
    return res.redirect('/signin');
  }
  delete req.session.profile;
  if (isnew) { //  Đăng ký tài khoản mới 
    var user = new User({
      loginname: profile.username,
      pass: profile.accessToken,
      email: profile.emails[0].value,
      avatar: profile._json.avatar_url,
      githubId: profile.id,
      githubUsername: profile.username,
      githubAccessToken: profile.accessToken,
      active: true,
    });
    user.save(function (err) {
      if (err) {
        //  Theo  err.err  Các thông báo lỗi là quyết định làm thế nào để đáp ứng cho người sử dụng ， Nơi này là khó khăn để xem văn bản 
        if (err.err.indexOf('duplicate key error') !== -1) {
          if (err.err.indexOf('users.$email') !== -1) {
            return res.status(500)
              .render('sign/no_github_email');
          }
          if (err.err.indexOf('users.$loginname') !== -1) {
            return res.status(500)
              .send(' Bạn  GitHub  Tên tài khoản người dùng và trước  CNodejs  Tên người dùng đăng ký lặp đi lặp lại ');
          }
        }
        return next(err);
        // END  Theo  err.err  Các thông báo lỗi là quyết định làm thế nào để đáp ứng cho người sử dụng ， Nơi này là khó khăn để xem văn bản 
      }
      authMiddleWare.gen_session(user, res);
      res.redirect('/');
    });
  } else { //  Kết hợp với các tài khoản cũ 
    ep.on('login_error', function (login_error) {
      res.status(403);
      res.render('sign/signin', { error: ' Tên tài khoản hoặc lỗi mật khẩu 。' });
    });
    User.findOne({loginname: loginname},
      ep.done(function (user) {
        if (!user) {
          return ep.emit('login_error');
        }
        tools.bcompare(password, user.pass, ep.done(function (bool) {
          if (!bool) {
            return ep.emit('login_error');
          }
          user.githubUsername = profile.username;
          user.githubId = profile.id;
          user.loginname = profile.username;
          user.avatar = profile._json.avatar_url;
          user.githubAccessToken = profile.accessToken;

          user.save(function (err) {
            if (err) {
              return next(err);
            }
            authMiddleWare.gen_session(user, res);
            res.redirect('/');
          });
        }));
      }));
  }
};
