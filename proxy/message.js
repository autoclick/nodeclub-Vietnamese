var EventProxy = require('eventproxy');

var Message = require('../models').Message;

var User = require('./user');
var Topic = require('./topic');
var Reply = require('./reply');

/**
 *  Theo người sử dụng ID， Lấy tổng số tin nhắn chưa đọc 
 * Callback:
 *  Việc gọi lại danh sách tham số chức năng ：
 * - err,  Cơ sở dữ liệu lỗi 
 * - count,  Số lượng tin nhắn chưa đọc 
 * @param {String} id  Người sử dụng ID
 * @param {Function} callback  Nhận số tin nhắn 
 */
exports.getMessagesCount = function (id, callback) {
  Message.count({master_id: id, has_read: false}, callback);
};


/**
 *  Theo tin tức Id Nhận được thông báo 
 * Callback:
 * - err,  Cơ sở dữ liệu lỗi 
 * - message,  Tin nhắn đối tượng 
 * @param {String} id  Tin tức ID
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getMessageById = function (id, callback) {
  Message.findOne({_id: id}, function (err, message) {
    if (err) {
      return callback(err);
    }
    if (message.type === 'reply' || message.type === 'reply2' || message.type === 'at') {
      var proxy = new EventProxy();
      proxy.assign('author_found', 'topic_found', 'reply_found', function (author, topic, reply) {
        message.author = author;
        message.topic = topic;
        message.reply = reply;
        if (!author || !topic) {
          message.is_invalid = true;
        }
        return callback(null, message);
      }).fail(callback); //  Nhận bất thường 
      User.getUserById(message.author_id, proxy.done('author_found'));
      Topic.getTopicById(message.topic_id, proxy.done('topic_found'));
      Reply.getReplyById(message.reply_id, proxy.done('reply_found'));
    }

    if (message.type === 'follow') {
      User.getUserById(message.author_id, function (err, author) {
        if (err) {
          return callback(err);
        }
        message.author = author;
        if (!author) {
          message.is_invalid = true;
        }
        return callback(null, message);
      });
    }
  });
};

/**
 *  Theo người sử dụng ID， Nhận được thông báo  Danh sách 
 * Callback:
 * - err,  Trường hợp ngoại lệ cơ sở dữ liệu 
 * - messages,  Tin tức  Danh sách 
 * @param {String} userId  Người sử dụng ID
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getReadMessagesByUserId = function (userId, callback) {
  Message.find({master_id: userId, has_read: true}, null,
    {sort: '-create_at', limit: 20}, callback);
};

/**
 *  Theo người sử dụng ID， Nhận chưa đọc  Tin tức  Danh sách 
 * Callback:
 * - err,  Trường hợp ngoại lệ cơ sở dữ liệu 
 * - messages,  Chưa đọc  Tin tức  Danh sách 
 * @param {String} userId  Người sử dụng ID
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getUnreadMessageByUserId = function (userId, callback) {
  Message.find({master_id: userId, has_read: false}, null,
    {sort: '-create_at'}, callback);
};
