/*!
 * nodeclub - topic mention user controller.
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * Copyright(c) 2012 muyuan
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var User = require('../proxy').User;
var Message = require('./message');
var EventProxy = require('eventproxy');
var _ = require('lodash');

/**
 *  Chiết xuất từ ​​các văn bản @username  Tên đăng nhập mảng thẻ 
 * @param {String} text  Nội dung văn bản 
 * @return {Array}  Tên đăng nhập mảng 
 */
var fetchUsers = function (text) {
  var ignore_regexs = [
    /```.+?```/, //  Việc loại bỏ một hàng duy nhất  ```
    /^```[\s\S]+?^```/gm, // ```  Bên trong  pre  Nội dung nhãn 
    /`[\s\S]+?`/g, //  Trong cùng một hàng ，`some code`  Cũng không phải là nội dung được phân tích cú pháp 
    /^    .*/gm, // 4 Không gian cũng  pre  Nhãn ， Ở đây  .  Không phù hợp với các dòng mới 
    /\b.*?@[^\s]*?\..+?\b/g, // somebody@gmail.com  Sẽ được gỡ bỏ 
    /\[@.+?\]\(\/.+?\)/g, //  Đã được  link  Của  username
  ];

  ignore_regexs.forEach(function(ignore_regex) {
    text = text.replace(ignore_regex, '');
  });

  var results = text.match(/@[a-z0-9\-_]+\b/igm);
  var names = [];
  if (results) {
    for (var i = 0, l = results.length; i < l; i++) {
      var s = results[i];
      //remove leading char @
      s = s.slice(1);
      names.push(s);
    }
  }
  return names;
};
exports.fetchUsers = fetchUsers;

/**
 *  Theo  Nội dung văn bản  Đọc sử dụng ， Và gửi tin nhắn đề cập đến  Của  Người sử dụng 
 * Callback:
 * - err,  Trường hợp ngoại lệ cơ sở dữ liệu 
 * @param {String} text  Nội dung văn bản 
 * @param {String} topicId  Chủ đề ID
 * @param {String} authorId  Tác giả ID
 * @param {String} reply_id  Đáp lại ID
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.sendMessageToMentionUsers = function (text, topicId, authorId, reply_id, callback) {
  if (typeof reply_id === 'function') {
    callback = reply_id;
    reply_id = null;
  }
  callback = callback || _.noop;

  User.getUsersByNames(fetchUsers(text), function (err, users) {
    if (err || !users) {
      return callback(err);
    }
    var ep = new EventProxy();
    ep.fail(callback);
    ep.after('sent', users.length, function () {
      callback();
    });

    users.forEach(function (user) {
      Message.sendAtMessage(user._id, authorId, topicId, reply_id, ep.done('sent'));
    });
  });
};

/**
 *  Theo  Nội dung văn bản ， Thay thế các cơ sở dữ liệu  Của  Dữ liệu 
 * Callback:
 * - err,  Trường hợp ngoại lệ cơ sở dữ liệu 
 * - text,  Sau khi thay thế  Của  Nội dung văn bản 
 * @param {String} text  Nội dung văn bản 
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.linkUsers = function (text, callback) {
  var users = fetchUsers(text);
  for (var i = 0, l = users.length; i < l; i++) {
    var name = users[i];
    text = text.replace(new RegExp('@' + name + '\\b', 'g'), '[@' + name + '](/user/' + name + ')');
  }
  return callback(null, text);
};
