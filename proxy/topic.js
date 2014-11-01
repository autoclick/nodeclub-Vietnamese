var EventProxy = require('eventproxy');

var models = require('../models');
var Topic = models.Topic;
var User = require('./user');
var Reply = require('./reply');
var tools = require('../common/tools');
var at = require('../common/at');
var _ = require('lodash');

/**
 *  Theo chủ đề ID Nhận chủ đề 
 * Callback:
 * - err,  Cơ sở dữ liệu lỗi 
 * - topic,  Chủ đề 
 * - author,  Tác giả 
 * - lastReply,  Bài trả lời cuối 
 * @param {String} id  Chủ đề ID
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getTopicById = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['topic', 'author', 'last_reply'];
  proxy.assign(events, function (topic, author, last_reply) {
    if (!author) {
      return callback(null, null, null, null);
    }
    return callback(null, topic, author, last_reply);
  }).fail(callback);

  Topic.findOne({_id: id}, proxy.done(function (topic) {
    if (!topic) {
      proxy.emit('topic', null);
      proxy.emit('author', null);
      proxy.emit('last_reply', null);
      return;
    }
    proxy.emit('topic', topic);

    User.getUserById(topic.author_id, proxy.done('author'));

    if (topic.last_reply) {
      Reply.getReplyById(topic.last_reply, proxy.done(function (last_reply) {
        proxy.emit('last_reply', last_reply);
      }));
    } else {
      proxy.emit('last_reply', null);
    }
  }));
};

/**
 *  Nhận từ khóa có thể tìm kiếm để  Chủ đề  Số lượng 
 * Callback:
 * - err,  Cơ sở dữ liệu lỗi 
 * - count,  Chủ đề  Số lượng 
 * @param {String} query  Từ khóa tìm kiếm 
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getCountByQuery = function (query, callback) {
  Topic.count(query, callback);
};

/**
 *  Theo Từ khóa ， Nhận chủ đề  Danh sách 
 * Callback:
 * - err,  Cơ sở dữ liệu lỗi 
 * - count,  Chủ đề  Danh sách 
 * @param {String} query  Từ khóa tìm kiếm 
 * @param {Object} opt  Tùy chọn tìm kiếm 
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getTopicsByQuery = function (query, opt, callback) {
  Topic.find(query, '_id', opt, function (err, docs) {
    if (err) {
      return callback(err);
    }
    if (docs.length === 0) {
      return callback(null, []);
    }

    var topics_id = _.pluck(docs, 'id');

    var proxy = new EventProxy();
    proxy.after('topic_ready', topics_id.length, function (topics) {
      //  Lọc ra vô 
      var filtered = topics.filter(function (item) {
        return !!item;
      });
      return callback(null, filtered);
    });
    proxy.fail(callback);

    topics_id.forEach(function (id, i) {
      exports.getTopicById(id, proxy.group('topic_ready', function (topic, author, last_reply) {
        //  Khi nào id Sau khi kiểm tra ， Để biết thêm thông  Danh sách  Khi nào ， Bài viết có thể đã bị xóa 
        //  Vì vậy, có thể có null
        if (topic) {
          topic.author = author;
          topic.reply = last_reply;
          topic.friendly_create_at = tools.formatDate(topic.create_at, true);
        }
        return topic;
      }));
    });
  });
};

// for sitemap
exports.getLimit5w = function (callback) {
  Topic.find({}, '_id', {limit: 50000, sort: '-create_at'}, callback);
};

/**
 *  Nhận tất cả các thông tin  Chủ đề 
 * Callback:
 * - err,  Trường hợp ngoại lệ cơ sở dữ liệu 
 * - message,  Tin tức 
 * - topic,  Chủ đề 
 * - author,  Chủ đề  Tác giả 
 * - replies,  Chủ đề  Đáp lại 
 * @param {String} id  Chủ đề ID
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getFullTopic = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['topic', 'author', 'replies'];
  proxy
    .assign(events, function (topic, author, replies) {
      callback(null, '', topic, author, replies);
    })
    .fail(callback);

  Topic.findOne({_id: id}, proxy.done(function (topic) {
    if (!topic) {
      proxy.unbind();
      return callback(null, ' Chủ đề này không tồn tại hoặc đã bị xóa 。');
    }
    at.linkUsers(topic.content, proxy.done('topic', function (str) {
      topic.content = str;
      return topic;
    }));

    User.getUserById(topic.author_id, proxy.done(function (author) {
      if (!author) {
        proxy.unbind();
        return callback(null, ' Chủ đề  Tác giả  Mất 。');
      }
      proxy.emit('author', author);
    }));

    Reply.getRepliesByTopicId(topic._id, proxy.done('replies'));
  }));
};

/**
 *  Cập nhật  Chủ đề  Của  Bài trả lời cuối  Thông tin 
 * @param {String} topicId  Chủ đề ID
 * @param {String} replyId  Đáp lại ID
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.updateLastReply = function (topicId, replyId, callback) {
  Topic.findOne({_id: topicId}, function (err, topic) {
    if (err || !topic) {
      return callback(err);
    }
    topic.last_reply = replyId;
    topic.last_reply_at = new Date();
    topic.reply_count += 1;
    topic.save(callback);
  });
};

/**
 *  Theo chủ đề ID， Tìm một  Chủ đề 
 * @param {String} id  Chủ đề ID
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getTopic = function (id, callback) {
  Topic.findOne({_id: id}, callback);
};

/**
 *  Sẽ  Khi nào  Cách đây  Chủ đề  Đáp lại  Đếm Ít 1， Xóa bỏ  Đáp lại  Khi nào  Sử dụng 
 * @param {String} id  Chủ đề ID
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.reduceCount = function (id, callback) {
  Topic.findOne({_id: id}, function (err, topic) {
    if (err) {
      return callback(err);
    }

    if (!topic) {
      return callback(new Error(' Điều đó  Chủ đề  Không tồn tại '));
    }

    topic.reply_count -= 1;
    topic.save(callback);
  });
};

exports.newAndSave = function (title, content, tab, authorId, callback) {
  var topic = new Topic();
  topic.title = title;
  topic.content = content;
  topic.tab = tab;
  topic.author_id = authorId;
  topic.save(callback);
};
