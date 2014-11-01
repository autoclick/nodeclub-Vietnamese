/**
 * config
 */

var path = require('path');

var debug = true;

var config = {
  // debug  Vì  true  Khi nào ， Để gỡ lỗi địa phương 
  debug: debug,

  mini_assets: !debug, //  Cho dù để cho phép các tập tin nén tĩnh sáp nhập ， Xem chi tiết Loader

  name: 'Nodeclub', //  Tên cộng đồng 
  description: 'VNode：Cộng đồng Node.js Việt chuyên nghiệp ', //  Cộng đồng Mô tả 
  keywords: 'nodejs, node, express, connect, socket.io',

  //  Thêm vào  html head  Thông tin 
  site_headers: [
    '<meta name="author" content="EDP@TAOBAO" />'
  ],
  site_logo: '/public/images/cnodejs_light.svg', // default is 'name'
  site_icon: '/public/images/cnode_icon_32.png', //  Mặc định là không  favicon,  Điền vào URL ở đây 
  //  Góc trên bên phải của khu vực điều hướng 
  site_navs: [
    //  Format  [ path, title, [target=''] ]
    [ '/about', ' Về chúng tôi ' ]
  ],
  // cdn host， Như  http://cnodejs.qiniudn.com
  site_static_host: '', //  Miền lưu trữ tập tin tĩnh 
  //  Miền cộng đồng 
  host: 'localhost',
  //  Vỡ nợ Google tracker ID， Hãy chỉnh sửa trang web riêng của mình ， Địa chỉ ứng dụng ：http://www.google.com/analytics/
  google_tracker_id: 'UA-4175xxxx-x',

  // mongodb  Cấu hình 
  db: 'mongodb://127.0.0.1/node_club_dev',
  db_name: 'node_club_dev',


  session_secret: 'node_club_secret', //  Hãy chắc chắn để sửa đổi 
  auth_cookie_name: 'node_club',

  //  Chương trình cổng chạy 
  port: 3000,

  //  Số danh sách chủ đề chủ đề hiển thị 
  list_topic_count: 20,

  //  Hạn chế viết bài  Khi nào  Khoảng thời gian ， Đơn vị ： Phần nghìn giây 
  post_interval: 2000,

  // RSS Cấu hình 
  rss: {
    title: 'VNode：Cộng đồng Node.js Việt chuyên nghiệp ',
    link: 'http://cnodejs.org',
    language: 'zh-cn',
    description: 'VNode：Cộng đồng Node.js Việt chuyên nghiệp ',
    // Nhận đến RSS Item Số lượng 
    max_rss_items: 50
  },

  //  Hộp thư  Cấu hình 
  mail_opts: {
    host: 'smtp.gmail.com',
    port: 465,
    auth: {
      user: 'xxxxxxxxx@gmail.com',
      pass: 'xxxxxxxx'
    }
  },

  //weibo app key
  weibo_key: 10000000,
  weibo_id: 'your_weibo_id',

  // admin  Bạn có thể xóa chủ đề ， Edit Tags ， Đặt một ai đó  Vì  Daren 
  admins: { user_login_name: true },

  // github  Đổ bộ  Cấu hình 
  GITHUB_OAUTH: {
    clientID: 'your GITHUB_CLIENT_ID',
    clientSecret: 'your GITHUB_CLIENT_SECRET',
    callbackURL: 'http://cnodejs.org/auth/github/callback'
  },
  //  Có cho phép đăng ký trực tiếp （ Nếu không, bạn có thể đi  github  Đường ）
  allow_sign_up: true,

  // newrelic  Được sử dụng để giám sát các dịch vụ hiệu suất trang web 
  newrelic_key: 'yourkey',

  //7 Gia súc access Thông tin ， Đối với các tập tin tải lên 
  qn_access: {
    accessKey: 'your access key',
    secretKey: 'your secret key',
    bucket: 'your bucket name',
    domain: 'http://{bucket}.qiniudn.com'
  },

  // File Upload  Cấu hình 
  // Chú ý ： Như  Trái cây Fill  qn_access， Sẽ được tải lên  7 Bò ， Sau đây  Cấu hình  Vô hiệu 
  upload: {
    path: path.join(__dirname, 'public/upload/'),
    url: '/public/upload/'
  },

  //  Diễn đàn 
  tabs: [
    ['share', ' Chia sẻ '],
    ['ask', ' Các câu hỏi và câu trả lời '],
    ['job', ' Tuyển dụng ']
  ]
};

module.exports = config;
