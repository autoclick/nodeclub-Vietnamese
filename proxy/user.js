var models = require('../models');
var User = models.User;
var utility = require('utility');

/**
 *  Tìm một danh sách các người dùng dựa trên danh sách tên người dùng 
 * Callback:
 * - err,  Trường hợp ngoại lệ cơ sở dữ liệu 
 * - users,  Danh sách người dùng 
 * @param {Array} names  Tên tài khoản Danh sách 
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getUsersByNames = function (names, callback) {
  if (names.length === 0) {
    return callback(null, []);
  }
  User.find({ loginname: { $in: names } }, callback);
};

/**
 *  Tìm một người sử dụng dựa vào tên đăng nhập 
 * Callback:
 * - err,  Trường hợp ngoại lệ cơ sở dữ liệu 
 * - user,  Người sử dụng 
 * @param {String} loginName  Tên đăng nhập 
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getUserByLoginName = function (loginName, callback) {
  User.findOne({'loginname': loginName}, callback);
};

/**
 *  Theo  Người sử dụng ID， Tìm thấy  Người sử dụng 
 * Callback:
 * - err,  Trường hợp ngoại lệ cơ sở dữ liệu 
 * - user,  Người sử dụng 
 * @param {String} id  Người sử dụng ID
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getUserById = function (id, callback) {
  User.findOne({_id: id}, callback);
};

/**
 *  Theo  Hộp thư ， Tìm thấy  Người sử dụng 
 * Callback:
 * - err,  Trường hợp ngoại lệ cơ sở dữ liệu 
 * - user,  Người sử dụng 
 * @param {String} email  Hộp thư  Địa chỉ 
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getUserByMail = function (email, callback) {
  User.findOne({email: email}, callback);
};

/**
 *  Theo  Người sử dụng ID Danh sách ， Nhận một nhóm  Người sử dụng 
 * Callback:
 * - err,  Trường hợp ngoại lệ cơ sở dữ liệu 
 * - users,  Danh sách người dùng 
 * @param {Array} ids  Người sử dụng ID Danh sách 
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getUsersByIds = function (ids, callback) {
  User.find({'_id': {'$in': ids}}, callback);
};

/**
 *  Theo  Từ khóa ， Nhận một nhóm  Người sử dụng 
 * Callback:
 * - err,  Trường hợp ngoại lệ cơ sở dữ liệu 
 * - users,  Danh sách người dùng 
 * @param {String} query  Từ khóa 
 * @param {Object} opt  Tùy chọn 
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getUsersByQuery = function (query, opt, callback) {
  User.find(query, '', opt, callback);
};

/**
 *  Theo  Điều kiện truy vấn ， Nhận một  Người sử dụng 
 * Callback:
 * - err,  Trường hợp ngoại lệ cơ sở dữ liệu 
 * - user,  Người sử dụng 
 * @param {String} name  Người sử dụng  Tên 
 * @param {String} key  Kích hoạt 
 * @param {Function} callback  Các chức năng gọi lại 
 */
exports.getUserByNameAndKey = function (loginname, key, callback) {
  User.findOne({loginname: loginname, retrieve_key: key}, callback);
};

exports.newAndSave = function (name, loginname, pass, email, avatar_url, active, callback) {
  var user = new User();
  user.name = loginname;
  user.loginname = loginname;
  user.pass = pass;
  user.email = email;
  user.avatar = avatar_url;
  user.active = active || false;
  user.save(callback);
};

var makeGravatar = function (email) {
  return 'http://www.gravatar.com/avatar/' + utility.md5(email.toLowerCase()) + '?size=48';
};
exports.makeGravatar = makeGravatar;

exports.getGravatar = function (user) {
  return user.avatar || makeGravatar(user);
};
