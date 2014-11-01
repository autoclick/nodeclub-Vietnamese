var models = require('../models');
var Reply = models.Reply;
var EventProxy = require('eventproxy');

var tools = require('../common/tools');
var User = require('./user');
var at = require('../common/at');

/**
 *  Nhận được một tin nhắn trả lời 
 * @param {String} id  Đáp lại ID
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getReply = function (id, callback) {
  Reply.findOne({_id: id}, callback);
};

/**
 *  Theo  Đáp lại ID， Được  Đáp lại 
 * Callback:
 * - err,  Trường hợp ngoại lệ cơ sở dữ liệu 
 * - reply,  Đáp lại  Nội dung 
 * @param {String} id  Đáp lại ID
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getReplyById = function (id, callback) {
  Reply.findOne({_id: id}, function (err, reply) {
    if (err) {
      return callback(err);
    }
    if (!reply) {
      return callback(err, null);
    }

    var author_id = reply.author_id;
    User.getUserById(author_id, function (err, author) {
      if (err) {
        return callback(err);
      }
      reply.author = author;
      reply.friendly_create_at = tools.formatDate(reply.create_at, true);
      // TODO:  Thêm phương pháp cập nhật ， Một số bài viết cũ có thể được chuyển đổi sang markdown Format  Nội dung 
      if (reply.content_is_html) {
        return callback(null, reply);
      }
      at.linkUsers(reply.content, function (err, str) {
        if (err) {
          return callback(err);
        }
        reply.content = str;
        return callback(err, reply);
      });
    });
  });
};

/**
 *  Theo  Chủ đề ID， Được  Đáp lại  Danh sách 
 * Callback:
 * - err,  Trường hợp ngoại lệ cơ sở dữ liệu 
 * - replies,  Đáp lại  Danh sách 
 * @param {String} id  Chủ đề ID
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getRepliesByTopicId = function (id, cb) {
  Reply.find({topic_id: id}, '', {sort: 'create_at'}, function (err, replies) {
    if (err) {
      return cb(err);
    }
    if (replies.length === 0) {
      return cb(null, []);
    }

    var proxy = new EventProxy();
    proxy.after('reply_find', replies.length, function () {
      cb(null, replies);
    });
    for (var j = 0; j < replies.length; j++) {
      (function (i) {
        var author_id = replies[i].author_id;
        User.getUserById(author_id, function (err, author) {
          if (err) {
            return cb(err);
          }
          replies[i].author = author || { _id: '' };
          replies[i].friendly_create_at = tools.formatDate(replies[i].create_at, true);
          if (replies[i].content_is_html) {
            return proxy.emit('reply_find');
          }
          at.linkUsers(replies[i].content, function (err, str) {
            if (err) {
              return cb(err);
            }
            replies[i].content = str;
            proxy.emit('reply_find');
          });
        });
      })(j);
    }
  });
};

/**
 *  Tạo và lưu một  Đáp lại  Thông tin 
 * @param {String} content  Đáp lại  Nội dung 
 * @param {String} topicId  Chủ đề ID
 * @param {String} authorId  Đáp lại  Tác giả 
 * @param {String} [replyId]  Đáp lại ID， Khi hai  Đáp lại  Khi thiết lập giá trị này 
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.newAndSave = function (content, topicId, authorId, replyId, callback) {
  if (typeof replyId === 'function') {
    callback = replyId;
    replyId = null;
  }
  var reply = new Reply();
  reply.content = content;
  reply.topic_id = topicId;
  reply.author_id = authorId;
  if (replyId) {
    reply.reply_id = replyId;
  }
  reply.save(function (err) {
    callback(err, reply);
  });
};

exports.getRepliesByAuthorId = function (authorId, opt, callback) {
  if (!callback) {
    callback = opt;
    opt = null;
  }
  Reply.find({author_id: authorId}, {}, opt, callback);
};

//  Qua  author_id  Được  Đáp lại  Tổng số 
exports.getCountByAuthorId = function (authorId, callback) {
  Reply.count({author_id: authorId}, callback);
};
