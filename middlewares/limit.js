var config = require('../config');

//  Khoảng thời gian bài viết ， Bà 
var POST_INTERVAL = config.post_interval;
if (!(POST_INTERVAL > 0)) POST_INTERVAL = 0;
var DISABLE_POST_INTERVAL = POST_INTERVAL > 0 ? false : true;

/**
 *  Quyền viết bài / Nhận xét khoảng thời gian giới hạn 
 */
exports.postInterval = function (req, res, next) {
  if (DISABLE_POST_INTERVAL) return next();
  if (isNaN(req.session.lastPostTimestamp)) {
    req.session.lastPostTimestamp = Date.now();
    return next();
  }
  if (Date.now() - req.session.lastPostTimestamp < POST_INTERVAL) {
    var ERROR_MSG = ' Trả lời của bạn quá nhanh 。';
    res.render('notify/notify', {error: ERROR_MSG});
    return;
  }

  req.session.lastPostTimestamp = Date.now();
  next();
};
