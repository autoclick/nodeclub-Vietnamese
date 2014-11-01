/*! WebUploader 0.1.5 */


/**
* @fileOverview  Hãy để trong các phần khác nhau của các mã có thể được sử dụng [amd](https://github.com/amdjs/amdjs-api/wiki/AMD) Mô-đun xác định cách thức tổ chức 。
*
* AMD API  Đơn giản là không thực hiện đầy đủ bên trong ， Xin vui lòng bỏ qua 。 Chỉ khi nào WebUploader Được sáp nhập vào một tập tin khi nào thì sự ra đời của 。
*/
(function (root, factory) {
    var modules = {},

    //  Nội bộ require,  Đơn giản không được thực hiện đầy đủ 。
    // https://github.com/amdjs/amdjs-api/wiki/require
        _require = function (deps, callback) {
            var args, len, i;

            //  Trong trường hợp deps Không phải là một mảng ， Trả trực tiếp module
            if (typeof deps === 'string') {
                return getModule(deps);
            } else {
                args = [];
                for (len = deps.length, i = 0; i < len; i++) {
                    args.push(getModule(deps[i]));
                }

                return callback.apply(null, args);
            }
        },

    //  Nội bộ define， Không hỗ trợ không được chỉ định id.
        _define = function (id, deps, factory) {
            if (arguments.length === 2) {
                factory = deps;
                deps = null;
            }

            _require(deps || [], function () {
                setModule(id, factory, arguments);
            });
        },

    //  Thiết lập module,  Tương hợp CommonJs Từ ngữ 。
        setModule = function (id, factory, args) {
            var module = {
                exports: factory
            },
                returned;

            if (typeof factory === 'function') {
                args.length || (args = [_require, module.exports, module]);
                returned = factory.apply(null, args);
                returned !== undefined && (module.exports = returned);
            }

            modules[id] = module.exports;
        },

    //  Theo id Được module
        getModule = function (id) {
            var module = modules[id] || root[id];

            if (!module) {
                throw new Error('`' + id + '` is undefined');
            }

            return module;
        },

    //  Tất cả modules， The Path ids Nạp vào một đối tượng 。
        exportsTo = function (obj) {
            var key, host, parts, part, last, ucFirst;

            // make the first character upper case.
            ucFirst = function (str) {
                return str && (str.charAt(0).toUpperCase() + str.substr(1));
            };

            for (key in modules) {
                host = obj;

                if (!modules.hasOwnProperty(key)) {
                    continue;
                }

                parts = key.split('/');
                last = ucFirst(parts.pop());

                while ((part = ucFirst(parts.shift()))) {
                    host[part] = host[part] || {};
                    host = host[part];
                }

                host[last] = modules[key];
            }

            return obj;
        },

        makeExport = function (dollar) {
            root.__dollar = dollar;

            // exports every module.
            return exportsTo(factory(root, _define, _require));
        },

        origin;

    if (typeof module === 'object' && typeof module.exports === 'object') {

        // For CommonJS and CommonJS-like environments where a proper window is present,
        module.exports = makeExport();
    } else if (typeof define === 'function' && define.amd) {

        // Allow using this built library as an AMD module
        // in another project. That other project will only
        // see this AMD call, not the internal modules in
        // the closure below.
        define('webuploader', ['jquery'], makeExport);
    } else {

        // Browser globals case. Just assign the
        // result to a property on the global.
        origin = root.WebUploader;
        root.WebUploader = makeExport();
        root.WebUploader.noConflict = function () {
            root.WebUploader = origin;
        };
    }
})(window, function (window, define, require) {


    /**
    * @fileOverview jQuery or Zepto
    */
    define('dollar-third', [], function () {
        var $ = window.__dollar || window.jQuery || window.Zepto;

        if (!$) {
            throw new Error('jQuery or Zepto not found!');
        }

        return $;
    });
    /**
    * @fileOverview Dom  Liên quan đến hoạt động 
    */
    define('dollar', [
        'dollar-third'
    ], function (_) {
        return _;
    });
    /**
    * @fileOverview  Dùng jQuery Của Promise
    */
    define('promise-third', [
        'dollar'
    ], function ($) {
        return {
            Deferred: $.Deferred,
            when: $.when,

            isPromise: function (anything) {
                return anything && typeof anything.then === 'function';
            }
        };
    });
    /**
    * @fileOverview Promise/A+
    */
    define('promise', [
        'promise-third'
    ], function (_) {
        return _;
    });
    /**
    * @fileOverview  Phương pháp lớp cơ sở 。
    */

    /**
    * Web Uploader Nội bộ  Danh mục  Của  Mô tả chi tiết ， Đề cập dưới đây  Của  Hàm số  Danh mục ， Tất cả OK trong `WebUploader` Điều này truy cập biến 。
    *
    * As you know, Web Uploader Của  Mỗi tập tin được sử dụng [AMD](https://github.com/amdjs/amdjs-api/wiki/AMD) Đặc điểm kỹ thuật  Của `define` Tổ chức  Của ,  Mỗi Module Sẽ có một module id.
    *  Vỡ nợ module id Các tập tin  Của  Đường dẫn ， Và điều này  Đường dẫn  Sẽ được chuyển đổi thành một không gian lưu trữ trong tên WebUploader Trong 。 Như ：
    *
    * * module `base`：WebUploader.Base
    * * module `file`: WebUploader.File
    * * module `lib/dnd`: WebUploader.Lib.Dnd
    * * module `runtime/html5/dnd`: WebUploader.Runtime.Html5.Dnd
    *
    *
    *  Các tài liệu sau  Trong  Đúng  Danh mục  Của  Dùng  Có thể được bỏ qua `WebUploader` Tiếp đầu ngữ 。
    * @module WebUploader
    * @title WebUploader API Hồ sơ 
    */
    define('base', [
        'dollar',
        'promise'
    ], function ($, promise) {

        var noop = function () { },
            call = Function.call;

        // http://jsperf.com/uncurrythis
        //  Chống Corey của 
        function uncurryThis(fn) {
            return function () {
                return call.apply(fn, arguments);
            };
        }

        function bindFn(fn, context) {
            return function () {
                return fn.apply(context, arguments);
            };
        }

        function createObject(proto) {
            var f;

            if (Object.create) {
                return Object.create(proto);
            } else {
                f = function () { };
                f.prototype = proto;
                return new f();
            }
        }


        /**
        *  Nền tảng  Danh mục ， Cung cấp một số thông thường đơn giản  Của  Phương pháp 。
        * @class Base
        */
        return {

            /**
            * @property {String} version  Số phiên bản hiện tại 。
            */
            version: '0.1.5',

            /**
            * @property {jQuery|Zepto} $  Tham khảo phụ thuộc  Của jQuery Hoặc Zepto Đúng  Voi 。
            */
            $: $,

            Deferred: promise.Deferred,

            isPromise: promise.isPromise,

            when: promise.when,

            /**
            * @description   Đơn giản  Của  Kết quả kiểm tra trình duyệt 。
            *
            * * `webkit`  webkit Số phiên bản ， Trong trường hợp  Trình duyệt không webkit Hạt nhân ， Khách sạn này là `undefined`。
            * * `chrome`  chrome Trình duyệt  Số phiên bản ， Trong trường hợp  Trình duyệt  Vì chrome， Khách sạn này là `undefined`。
            * * `ie`  ie Trình duyệt  Số phiên bản ， Trong trường hợp  Trình duyệt không ie， Khách sạn này là `undefined`。** Không được hỗ trợ ie10+**
            * * `firefox`  firefox Trình duyệt  Số phiên bản ， Trong trường hợp  Trình duyệt không firefox， Khách sạn này là `undefined`。
            * * `safari`  safari Trình duyệt  Số phiên bản ， Trong trường hợp  Trình duyệt không safari， Khách sạn này là `undefined`。
            * * `opera`  opera Trình duyệt  Số phiên bản ， Trong trường hợp  Trình duyệt không opera， Khách sạn này là `undefined`。
            *
            * @property {Object} [browser]
            */
            browser: (function (ua) {
                var ret = {},
                    webkit = ua.match(/WebKit\/([\d.]+)/),
                    chrome = ua.match(/Chrome\/([\d.]+)/) ||
                        ua.match(/CriOS\/([\d.]+)/),

                    ie = ua.match(/MSIE\s([\d\.]+)/) ||
                        ua.match(/(?:trident)(?:.*rv:([\w.]+))?/i),
                    firefox = ua.match(/Firefox\/([\d.]+)/),
                    safari = ua.match(/Safari\/([\d.]+)/),
                    opera = ua.match(/OPR\/([\d.]+)/);

                webkit && (ret.webkit = parseFloat(webkit[1]));
                chrome && (ret.chrome = parseFloat(chrome[1]));
                ie && (ret.ie = parseFloat(ie[1]));
                firefox && (ret.firefox = parseFloat(firefox[1]));
                safari && (ret.safari = parseFloat(safari[1]));
                opera && (ret.opera = parseFloat(opera[1]));

                return ret;
            })(navigator.userAgent),

            /**
            * @description   Kết quả thử nghiệm Hệ điều hành 。
            *
            * * `android`   Trong trường hợp  Trong android Trình duyệt  Môi trường ， Giá trị này  Vì  Đúng  Nên  Của android Số phiên bản ， Nếu không thì  Vì `undefined`。
            * * `ios`  Trong trường hợp  Trong ios Trình duyệt  Môi trường ， Giá trị này  Vì  Đúng  Nên  Của ios Số phiên bản ， Nếu không thì  Vì `undefined`。
            * @property {Object} [os]
            */
            os: (function (ua) {
                var ret = {},

                // osx = !!ua.match( /\(Macintosh\; Intel / ),
                    android = ua.match(/(?:Android);?[\s\/]+([\d.]+)?/),
                    ios = ua.match(/(?:iPad|iPod|iPhone).*OS\s([\d_]+)/);

                // osx && (ret.osx = true);
                android && (ret.android = parseFloat(android[1]));
                ios && (ret.ios = parseFloat(ios[1].replace(/_/g, '.')));

                return ret;
            })(navigator.userAgent),

            /**
            *  Hoàn thành  Danh mục  Chống  Danh mục 之间 Của 继承。
            * @method inherits
            * @grammar Base.inherits( super ) => child
            * @grammar Base.inherits( super, protos ) => child
            * @grammar Base.inherits( super, protos, statics ) => child
            * @param  {Class} super 父 Danh mục 
            * @param  {Object | Function} [protos] 子 Danh mục  Hoặc  Đúng  Voi 。 Trong trường hợp  Đúng  Voi  Trong 包含constructor，子 Danh mục 将是用此属性值。
            * @param  {Function} [protos.constructor] 子 Danh mục 构造器，不指定 Của 话将创建个临时 Của 直接执行父 Danh mục 构造器 Của  Phương pháp 。
            * @param  {Object} [statics] 静态属性或 Phương pháp 。
            * @return {Class} 返回子 Danh mục 。
            * @example
            * function Person() {
            *     console.log( 'Super' );
            * }
            * Person.prototype.hello = function() {
            *     console.log( 'hello' );
            * };
            *
            * var Manager = Base.inherits( Person, {
            *     world: function() {
            *         console.log( 'World' );
            *     }
            * });
            *
            * // 因 Vì 没有指定构造器，父 Danh mục  Của 构造器将会执行。
            * var instance = new Manager();    // => Super
            *
            * // 继承子父 Danh mục  Của  Phương pháp 
            * instance.hello();    // => hello
            * instance.world();    // => World
            *
            * // 子 Danh mục  Của __super__属性指向父 Danh mục 
            * console.log( Manager.__super__ === Person );    // => true
            */
            inherits: function (Super, protos, staticProtos) {
                var child;

                if (typeof protos === 'function') {
                    child = protos;
                    protos = null;
                } else if (protos && protos.hasOwnProperty('constructor')) {
                    child = protos.constructor;
                } else {
                    child = function () {
                        return Super.apply(this, arguments);
                    };
                }

                // 复制静态 Phương pháp 
                $.extend(true, child, Super, staticProtos || {});

                /* jshint camelcase: false */

                // 让子 Danh mục  Của __super__属性指向父 Danh mục 。
                child.__super__ = Super.prototype;

                // 构建原型，添加原型 Phương pháp 或属性。
                // 暂时用Object.create Hoàn thành 。
                child.prototype = createObject(Super.prototype);
                protos && $.extend(true, child.prototype, protos);

                return child;
            },

            /**
            * 一个不做任何事情 Của  Phương pháp 。可以用来赋值给 Vỡ nợ  Của callback.
            * @method noop
            */
            noop: noop,

            /**
            * 返回一个新 Của  Phương pháp ，此 Phương pháp 将已指定 Của `context`来执行。
            * @grammar Base.bindFn( fn, context ) => Function
            * @method bindFn
            * @example
            * var doSomething = function() {
            *         console.log( this.name );
            *     },
            *     obj = {
            *         name: 'Object Name'
            *     },
            *     aliasFn = Base.bind( doSomething, obj );
            *
            *  aliasFn();    // => Object Name
            *
            */
            bindFn: bindFn,

            /**
            * 引用Console.log Trong trường hợp 存 Trong  Của 话， Nếu không thì 引用一个[空函数noop](#WebUploader:Base.noop)。
            * @grammar Base.log( args... ) => undefined
            * @method log
            */
            log: (function () {
                if (window.console) {
                    return bindFn(console.log, console);
                }
                return noop;
            })(),

            nextTick: (function () {

                return function (cb) {
                    setTimeout(cb, 1);
                };

                // @bug 当 Trình duyệt 不 Trong 当前窗口时就停了。
                // var next = window.requestAnimationFrame ||
                //     window.webkitRequestAnimationFrame ||
                //     window.mozRequestAnimationFrame ||
                //     function( cb ) {
                //         window.setTimeout( cb, 1000 / 60 );
                //     };

                // // fix: Uncaught TypeError: Illegal invocation
                // return bindFn( next, window );
            })(),

            /**
            * 被[uncurrythis](http://www.2ality.com/2011/11/uncurrying-this.html) Của 数组slice Phương pháp 。
            * 将用来将非数组 Đúng  Voi 转化成数组 Đúng  Voi 。
            * @grammar Base.slice( target, start[, end] ) => Array
            * @method slice
            * @example
            * function doSomthing() {
            *     var args = Base.slice( arguments, 1 );
            *     console.log( args );
            * }
            *
            * doSomthing( 'ignored', 'arg2', 'arg3' );    // => Array ["arg2", "arg3"]
            */
            slice: uncurryThis([].slice),

            /**
            * 生成唯一 Của ID
            * @method guid
            * @grammar Base.guid() => String
            * @grammar Base.guid( prefx ) => String
            */
            guid: (function () {
                var counter = 0;

                return function (prefix) {
                    var guid = (+new Date()).toString(32),
                        i = 0;

                    for (; i < 5; i++) {
                        guid += Math.floor(Math.random() * 65535).toString(32);
                    }

                    return (prefix || 'wu_') + guid + (counter++).toString(32);
                };
            })(),

            /**
            * 格式化文件大小, 输出成带单位 Của 字符串
            * @method formatSize
            * @grammar Base.formatSize( size ) => String
            * @grammar Base.formatSize( size, pointLength ) => String
            * @grammar Base.formatSize( size, pointLength, units ) => String
            * @param {Number} size 文件大小
            * @param {Number} [pointLength=2] 精确到 Của 小数点数。
            * @param {Array} [units=[ 'B', 'K', 'M', 'G', 'TB' ]] 单位数组。从字节，到千字节，一直往上指定。 Trong trường hợp 单位数组里面只指定了到了K(千字节)，同时文件大小大于M, 此 Phương pháp  Của 输出将还是显示成多少K.
            * @example
            * console.log( Base.formatSize( 100 ) );    // => 100B
            * console.log( Base.formatSize( 1024 ) );    // => 1.00K
            * console.log( Base.formatSize( 1024, 0 ) );    // => 1K
            * console.log( Base.formatSize( 1024 * 1024 ) );    // => 1.00M
            * console.log( Base.formatSize( 1024 * 1024 * 1024 ) );    // => 1.00G
            * console.log( Base.formatSize( 1024 * 1024 * 1024, 0, ['B', 'KB', 'MB'] ) );    // => 1024MB
            */
            formatSize: function (size, pointLength, units) {
                var unit;

                units = units || ['B', 'K', 'M', 'G', 'TB'];

                while ((unit = units.shift()) && size > 1024) {
                    size = size / 1024;
                }

                return (unit === 'B' ? size : size.toFixed(pointLength || 2)) +
                        unit;
            }
        };
    });
    /**
    * 事件处理 Danh mục ，可以独立 Dùng ，也可以扩展给 Đúng  Voi  Dùng 。
    * @fileOverview Mediator
    */
    define('mediator', [
        'base'
    ], function (Base) {
        var $ = Base.$,
            slice = [].slice,
            separator = /\s+/,
            protos;

        //  Theo 条件过滤出事件handlers.
        function findHandlers(arr, name, callback, context) {
            return $.grep(arr, function (handler) {
                return handler &&
                        (!name || handler.e === name) &&
                        (!callback || handler.cb === callback ||
                        handler.cb._cb === callback) &&
                        (!context || handler.ctx === context);
            });
        }

        function eachEvent(events, callback, iterator) {
            // 不支持 Đúng  Voi ，只支持多个event用空格隔开
            $.each((events || '').split(separator), function (_, key) {
                iterator(key, callback);
            });
        }

        function triggerHanders(events, args) {
            var stoped = false,
                i = -1,
                len = events.length,
                handler;

            while (++i < len) {
                handler = events[i];

                if (handler.cb.apply(handler.ctx2, args) === false) {
                    stoped = true;
                    break;
                }
            }

            return !stoped;
        }

        protos = {

            /**
            * 绑定事件。
            *
            * `callback` Phương pháp  Trong 执行时，arguments将会来源于trigger Của 时候携带 Của 参数。 Như 
            * ```javascript
            * var obj = {};
            *
            * // 使得obj有事件行 Vì 
            * Mediator.installTo( obj );
            *
            * obj.on( 'testa', function( arg1, arg2 ) {
            *     console.log( arg1, arg2 ); // => 'arg1', 'arg2'
            * });
            *
            * obj.trigger( 'testa', 'arg1', 'arg2' );
            * ```
            *
            *  Trong trường hợp `callback` Trong ，某一个 Phương pháp `return false`了，则后续 Của 其他`callback`都不会被执行到。
            * 切会影响到`trigger` Phương pháp  Của 返回值， Vì `false`。
            *
            * `on`还可以用来添加一个特殊事件`all`, 这样所有 Của 事件触发都会响 Nên 到。同时此 Danh mục `callback` Trong  Của arguments有一个不同处，
            * 就是第一个参数 Vì `type`，记录当前是什么事件 Trong 触发。此 Danh mục `callback` Của 优先级比脚低，会再正常`callback`执行完后触发。
            * ```javascript
            * obj.on( 'all', function( type, arg1, arg2 ) {
            *     console.log( type, arg1, arg2 ); // => 'testa', 'arg1', 'arg2'
            * });
            * ```
            *
            * @method on
            * @grammar on( name, callback[, context] ) => self
            * @param  {String}   name     事件名，支持多个事件用空格隔开
            * @param  {Function} callback 事件处理器
            * @param  {Object}   [context]  事件处理器 Của 上下文。
            * @return {self} 返回自身，方便链式
            * @chainable
            * @class Mediator
            */
            on: function (name, callback, context) {
                var me = this,
                    set;

                if (!callback) {
                    return this;
                }

                set = this._events || (this._events = []);

                eachEvent(name, callback, function (name, callback) {
                    var handler = { e: name };

                    handler.cb = callback;
                    handler.ctx = context;
                    handler.ctx2 = context || me;
                    handler.id = set.length;

                    set.push(handler);
                });

                return this;
            },

            /**
            * 绑定事件，且当handler执行完后，自动解除绑定。
            * @method once
            * @grammar once( name, callback[, context] ) => self
            * @param  {String}   name     事件名
            * @param  {Function} callback 事件处理器
            * @param  {Object}   [context]  事件处理器 Của 上下文。
            * @return {self} 返回自身，方便链式
            * @chainable
            */
            once: function (name, callback, context) {
                var me = this;

                if (!callback) {
                    return me;
                }

                eachEvent(name, callback, function (name, callback) {
                    var once = function () {
                        me.off(name, once);
                        return callback.apply(context || me, arguments);
                    };

                    once._cb = callback;
                    me.on(name, once, context);
                });

                return me;
            },

            /**
            * 解除事件绑定
            * @method off
            * @grammar off( [name[, callback[, context] ] ] ) => self
            * @param  {String}   [name]     事件名
            * @param  {Function} [callback] 事件处理器
            * @param  {Object}   [context]  事件处理器 Của 上下文。
            * @return {self} 返回自身，方便链式
            * @chainable
            */
            off: function (name, cb, ctx) {
                var events = this._events;

                if (!events) {
                    return this;
                }

                if (!name && !cb && !ctx) {
                    this._events = [];
                    return this;
                }

                eachEvent(name, cb, function (name, cb) {
                    $.each(findHandlers(events, name, cb, ctx), function () {
                        delete events[this.id];
                    });
                });

                return this;
            },

            /**
            * 触发事件
            * @method trigger
            * @grammar trigger( name[, args...] ) => self
            * @param  {String}   type     事件名
            * @param  {*} [...] 任意参数
            * @return {Boolean}  Trong trường hợp handler Trong return false了，则返回false,  Nếu không thì 返回true
            */
            trigger: function (type) {
                var args, events, allEvents;

                if (!this._events || !type) {
                    return this;
                }

                args = slice.call(arguments, 1);
                events = findHandlers(this._events, type);
                allEvents = findHandlers(this._events, 'all');

                return triggerHanders(events, args) &&
                        triggerHanders(allEvents, arguments);
            }
        };

        /**
        *  Trong 介者，它本身是个单例，但可以通过[installTo](#WebUploader:Mediator:installTo) Phương pháp ，使任何 Đúng  Voi 具备事件行 Vì 。
        * 主要目 Của 是负责模块 Chống 模块之间 Của 合作，降低耦合度。
        *
        * @class Mediator
        */
        return $.extend({

            /**
            * 可以通过这个接口，使任何 Đúng  Voi 具备事件 Hàm số 。
            * @method installTo
            * @param  {Object} obj 需要具备事件行 Vì  Của  Đúng  Voi 。
            * @return {Object} 返回obj.
            */
            installTo: function (obj) {
                return $.extend(obj, protos);
            }

        }, protos);
    });
    /**
    * @fileOverview Uploader上传 Danh mục 
    */
    define('uploader', [
        'base',
        'mediator'
    ], function (Base, Mediator) {

        var $ = Base.$;

        /**
        * 上传入口 Danh mục 。
        * @class Uploader
        * @constructor
        * @grammar new Uploader( opts ) => Uploader
        * @example
        * var uploader = WebUploader.Uploader({
        *     swf: 'path_of_swf/Uploader.swf',
        *
        *     // 开起分片上传。
        *     chunked: true
        * });
        */
        function Uploader(opts) {
            this.options = $.extend(true, {}, Uploader.options, opts);
            this._init(this.options);
        }

        // default Options
        // widgets Trong 有相 Nên 扩展
        Uploader.options = {};
        Mediator.installTo(Uploader.prototype);

        // 批量添加纯命令式 Phương pháp 。
        $.each({
            upload: 'start-upload',
            stop: 'stop-upload',
            getFile: 'get-file',
            getFiles: 'get-files',
            addFile: 'add-file',
            addFiles: 'add-file',
            sort: 'sort-files',
            removeFile: 'remove-file',
            skipFile: 'skip-file',
            retry: 'retry',
            isInProgress: 'is-in-progress',
            makeThumb: 'make-thumb',
            md5File: 'md5-file',
            getDimension: 'get-dimension',
            addButton: 'add-btn',
            getRuntimeType: 'get-runtime-type',
            refresh: 'refresh',
            disable: 'disable',
            enable: 'enable',
            reset: 'reset'
        }, function (fn, command) {
            Uploader.prototype[fn] = function () {
                return this.request(command, arguments);
            };
        });

        $.extend(Uploader.prototype, {
            state: 'pending',

            _init: function (opts) {
                var me = this;

                me.request('init', opts, function () {
                    me.state = 'ready';
                    me.trigger('ready');
                });
            },

            /**
            *  Được  Hoặc  Thiết lập Uploader配置项。
            * @method option
            * @grammar option( key ) => *
            * @grammar option( key, val ) => self
            * @example
            *
            * // 初始状态图片上传前不会压缩
            * var uploader = new WebUploader.Uploader({
            *     compress: null;
            * });
            *
            * // 修改后图片上传前，尝试将图片压缩到1600 * 1600
            * uploader.option( 'compress', {
            *     width: 1600,
            *     height: 1600
            * });
            */
            option: function (key, val) {
                var opts = this.options;

                // setter
                if (arguments.length > 1) {

                    if ($.isPlainObject(val) &&
                            $.isPlainObject(opts[key])) {
                        $.extend(opts[key], val);
                    } else {
                        opts[key] = val;
                    }

                } else {    // getter
                    return key ? opts[key] : opts;
                }
            },

            /**
            *  Được 文件统计信息。返回一个包含一下信息 Của  Đúng  Voi 。
            * * `successNum` 上传成功 Của 文件数
            * * `successNum` 上传 Trong  Của 文件数
            * * `uploadFailNum` 上传失败 Của 文件数
            * * `cancelNum` 被删除 Của 文件数
            * * `invalidNum` 无效 Của 文件数
            * * `queueNum` 还 Trong 队列 Trong  Của 文件数
            * @method getStats
            * @grammar getStats() => Object
            */
            getStats: function () {
                // return this._mgr.getStats.apply( this._mgr, arguments );
                var stats = this.request('get-stats');

                return {
                    successNum: stats.numOfSuccess,
                    progressNum: stats.numOfProgress,

                    // who care?
                    // queueFailNum: 0,
                    cancelNum: stats.numOfCancel,
                    invalidNum: stats.numOfInvalid,
                    uploadFailNum: stats.numOfUploadFailed,
                    queueNum: stats.numOfQueue
                };
            },

            // 需要重写此 Phương pháp 来来支持opts.onEvent和instance.onEvent Của 处理器
            trigger: function (type/*, args...*/) {
                var args = [].slice.call(arguments, 1),
                    opts = this.options,
                    name = 'on' + type.substring(0, 1).toUpperCase() +
                        type.substring(1);

                if (
                // 调用通过on Phương pháp 注册 Của handler.
                        Mediator.trigger.apply(this, arguments) === false ||

                // 调用opts.onEvent
                        $.isFunction(opts[name]) &&
                        opts[name].apply(this, args) === false ||

                // 调用this.onEvent
                        $.isFunction(this[name]) &&
                        this[name].apply(this, args) === false ||

                // 广播所有uploader Của 事件。
                        Mediator.trigger.apply(Mediator,
                        [this, type].concat(args)) === false) {

                    return false;
                }

                return true;
            },

            // widgets/widget.js将补充此 Phương pháp  Của 详细 Hồ sơ 。
            request: Base.noop
        });

        /**
        * 创建Uploader实例，等同于new Uploader( opts );
        * @method create
        * @class Base
        * @static
        * @grammar Base.create( opts ) => Uploader
        */
        Base.create = Uploader.create = function (opts) {
            return new Uploader(opts);
        };

        // 暴露Uploader，可以通过它来扩展业务逻辑。
        Base.Uploader = Uploader;

        return Uploader;
    });
    /**
    * @fileOverview Runtime管理器，负责Runtime Của 选择, 连接
    */
    define('runtime/runtime', [
        'base',
        'mediator'
    ], function (Base, Mediator) {

        var $ = Base.$,
            factories = {},

        //  Được  Đúng  Voi  Của 第一个key
            getFirstKey = function (obj) {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        return key;
                    }
                }
                return null;
            };

        // 接口 Danh mục 。
        function Runtime(options) {
            this.options = $.extend({
                container: document.body
            }, options);
            this.uid = Base.guid('rt_');
        }

        $.extend(Runtime.prototype, {

            getContainer: function () {
                var opts = this.options,
                    parent, container;

                if (this._container) {
                    return this._container;
                }

                parent = $(opts.container || document.body);
                container = $(document.createElement('div'));

                container.attr('id', 'rt_' + this.uid);
                container.css({
                    position: 'absolute',
                    top: '0px',
                    left: '0px',
                    width: parent.width() || '1px',
                    height: parent.height() || '1px',
                    overflow: 'hidden'
                });

                parent.append(container);
                parent.addClass('webuploader-container');
                this._container = container;
                return container;
            },

            init: Base.noop,
            exec: Base.noop,

            destroy: function () {
                if (this._container) {
                    this._container.parentNode.removeChild(this.__container);
                }

                this.off();
            }
        });

        Runtime.orders = 'html5,flash';


        /**
        * 添加Runtime Hoàn thành 。
        * @param {String} type     Danh mục 型
        * @param {Runtime} factory 具体Runtime Hoàn thành 。
        */
        Runtime.addRuntime = function (type, factory) {
            factories[type] = factory;
        };

        Runtime.hasRuntime = function (type) {
            return !!(type ? factories[type] : getFirstKey(factories));
        };

        Runtime.create = function (opts, orders) {
            var type, runtime;

            orders = orders || Runtime.orders;
            $.each(orders.split(/\s*,\s*/g), function () {
                if (factories[this]) {
                    type = this;
                    return false;
                }
            });

            type = type || getFirstKey(factories);

            if (!type) {
                alert('程序需要 Flash 11 以上版本才能正常运行，请前往：http://get.adobe.com/cn/flashplayer/ 安装');
                throw new Error('Runtime Error');
            }

            runtime = new factories[type](opts);
            return runtime;
        };

        Mediator.installTo(Runtime.prototype);
        return Runtime;
    });

    /**
    * @fileOverview Runtime管理器，负责Runtime Của 选择, 连接
    */
    define('runtime/client', [
        'base',
        'mediator',
        'runtime/runtime'
    ], function (Base, Mediator, Runtime) {

        var cache;

        cache = (function () {
            var obj = {};

            return {
                add: function (runtime) {
                    obj[runtime.uid] = runtime;
                },

                get: function (ruid, standalone) {
                    var i;

                    if (ruid) {
                        return obj[ruid];
                    }

                    for (i in obj) {
                        // 有些 Danh mục 型不能重用，比 Như filepicker.
                        if (standalone && obj[i].__standalone) {
                            continue;
                        }

                        return obj[i];
                    }

                    return null;
                },

                remove: function (runtime) {
                    delete obj[runtime.uid];
                }
            };
        })();

        function RuntimeClient(component, standalone) {
            var deferred = Base.Deferred(),
                runtime;

            this.uid = Base.guid('client_');

            // 允许runtime没有初始化之前，注册一些 Phương pháp  Trong 初始化后执行。
            this.runtimeReady = function (cb) {
                return deferred.done(cb);
            };

            this.connectRuntime = function (opts, cb) {

                // already connected.
                if (runtime) {
                    throw new Error('already connected!');
                }

                deferred.done(cb);

                if (typeof opts === 'string' && cache.get(opts)) {
                    runtime = cache.get(opts);
                }

                // 像filePicker只能独立存 Trong ，不能公用。
                runtime = runtime || cache.get(null, standalone);

                // 需要创建
                if (!runtime) {
                    runtime = Runtime.create(opts, opts.runtimeOrder);
                    runtime.__promise = deferred.promise();
                    runtime.once('ready', deferred.resolve);
                    runtime.init();
                    cache.add(runtime);
                    runtime.__client = 1;
                } else {
                    // 来自cache
                    Base.$.extend(runtime.options, opts);
                    runtime.__promise.then(deferred.resolve);
                    runtime.__client++;
                }

                standalone && (runtime.__standalone = standalone);
                return runtime;
            };

            this.getRuntime = function () {
                return runtime;
            };

            this.disconnectRuntime = function () {
                if (!runtime) {
                    return;
                }

                runtime.__client--;

                if (runtime.__client <= 0) {
                    cache.remove(runtime);
                    delete runtime.__promise;
                    runtime.destroy();
                }

                runtime = null;
            };

            this.exec = function () {
                if (!runtime) {
                    return;
                }

                var args = Base.slice(arguments);
                component && args.unshift(component);

                return runtime.exec.apply(this, args);
            };

            this.getRuid = function () {
                return runtime && runtime.uid;
            };

            this.destroy = (function (destroy) {
                return function () {
                    destroy && destroy.apply(this, arguments);
                    this.trigger('destroy');
                    this.off();
                    this.exec('destroy');
                    this.disconnectRuntime();
                };
            })(this.destroy);
        }

        Mediator.installTo(RuntimeClient.prototype);
        return RuntimeClient;
    });
    /**
    * @fileOverview 错误信息
    */
    define('lib/dnd', [
        'base',
        'mediator',
        'runtime/client'
    ], function (Base, Mediator, RuntimeClent) {

        var $ = Base.$;

        function DragAndDrop(opts) {
            opts = this.options = $.extend({}, DragAndDrop.options, opts);

            opts.container = $(opts.container);

            if (!opts.container.length) {
                return;
            }

            RuntimeClent.call(this, 'DragAndDrop');
        }

        DragAndDrop.options = {
            accept: null,
            disableGlobalDnd: false
        };

        Base.inherits(RuntimeClent, {
            constructor: DragAndDrop,

            init: function () {
                var me = this;

                me.connectRuntime(me.options, function () {
                    me.exec('init');
                    me.trigger('ready');
                });
            },

            destroy: function () {
                this.disconnectRuntime();
            }
        });

        Mediator.installTo(DragAndDrop.prototype);

        return DragAndDrop;
    });
    /**
    * @fileOverview 组件基 Danh mục 。
    */
    define('widgets/widget', [
        'base',
        'uploader'
    ], function (Base, Uploader) {

        var $ = Base.$,
            _init = Uploader.prototype._init,
            IGNORE = {},
            widgetClass = [];

        function isArrayLike(obj) {
            if (!obj) {
                return false;
            }

            var length = obj.length,
                type = $.type(obj);

            if (obj.nodeType === 1 && length) {
                return true;
            }

            return type === 'array' || type !== 'function' && type !== 'string' &&
                    (length === 0 || typeof length === 'number' && length > 0 &&
                    (length - 1) in obj);
        }

        function Widget(uploader) {
            this.owner = uploader;
            this.options = uploader.options;
        }

        $.extend(Widget.prototype, {

            init: Base.noop,

            //  Danh mục Backbone Của 事件监听声明，监听uploader实例上 Của 事件
            // widget直接无法监听事件，事件只能通过uploader来传递
            invoke: function (apiName, args) {

                /*
                {
                'make-thumb': 'makeThumb'
                }
                */
                var map = this.responseMap;

                //  Trong trường hợp 无API响 Nên 声明则忽略
                if (!map || !(apiName in map) || !(map[apiName] in this) ||
                        !$.isFunction(this[map[apiName]])) {

                    return IGNORE;
                }

                return this[map[apiName]].apply(this, args);

            },

            /**
            * 发送命令。当传入`callback` Hoặc `handler` Trong 返回`promise`时。返回一个当所有`handler` Trong  Của promise都完成后完成 Của 新`promise`。
            * @method request
            * @grammar request( command, args ) => * | Promise
            * @grammar request( command, args, callback ) => Promise
            * @for  Uploader
            */
            request: function () {
                return this.owner.request.apply(this.owner, arguments);
            }
        });

        // 扩展Uploader.
        $.extend(Uploader.prototype, {

            // 覆写_init用来初始化widgets
            _init: function () {
                var me = this,
                    widgets = me._widgets = [];

                $.each(widgetClass, function (_, klass) {
                    widgets.push(new klass(me));
                });

                return _init.apply(me, arguments);
            },

            request: function (apiName, args, callback) {
                var i = 0,
                    widgets = this._widgets,
                    len = widgets.length,
                    rlts = [],
                    dfds = [],
                    widget, rlt, promise, key;

                args = isArrayLike(args) ? args : [args];

                for (; i < len; i++) {
                    widget = widgets[i];
                    rlt = widget.invoke(apiName, args);

                    if (rlt !== IGNORE) {

                        // Deferred Đúng  Voi 
                        if (Base.isPromise(rlt)) {
                            dfds.push(rlt);
                        } else {
                            rlts.push(rlt);
                        }
                    }
                }

                //  Trong trường hợp 有callback，则用异步方式。
                if (callback || dfds.length) {
                    promise = Base.when.apply(Base, dfds);
                    key = promise.pipe ? 'pipe' : 'then';

                    // 很重要不能删除。删除了会死循环。
                    // 保证执行顺序。让callback总是 Trong 下一个 tick  Trong 执行。
                    return promise[key](function () {
                        var deferred = Base.Deferred(),
                                    args = arguments;

                        if (args.length === 1) {
                            args = args[0];
                        }

                        setTimeout(function () {
                            deferred.resolve(args);
                        }, 1);

                        return deferred.promise();
                    })[callback ? key : 'done'](callback || Base.noop);
                } else {
                    return rlts[0];
                }
            }
        });

        /**
        * 添加组件
        * @param  {object} widgetProto 组件原型，构造函数通过constructor属性定义
        * @param  {object} responseMap API名称 Chống 函数 Hoàn thành  Của 映射
        * @example
        *     Uploader.register( {
        *         init: function( options ) {},
        *         makeThumb: function() {}
        *     }, {
        *         'make-thumb': 'makeThumb'
        *     } );
        */
        Uploader.register = Widget.register = function (responseMap, widgetProto) {
            var map = { init: 'init' },
                klass;

            if (arguments.length === 1) {
                widgetProto = responseMap;
                widgetProto.responseMap = map;
            } else {
                widgetProto.responseMap = $.extend(map, responseMap);
            }

            klass = Base.inherits(Widget, widgetProto);
            widgetClass.push(klass);

            return klass;
        };

        return Widget;
    });
    /**
    * @fileOverview DragAndDrop Widget。
    */
    define('widgets/filednd', [
        'base',
        'uploader',
        'lib/dnd',
        'widgets/widget'
    ], function (Base, Uploader, Dnd) {
        var $ = Base.$;

        Uploader.options.dnd = '';

        /**
        * @property {Selector} [dnd=undefined]  指定Drag And Drop拖拽 Của 容器， Trong trường hợp 不指定，则不启动。
        * @namespace options
        * @for Uploader
        */

        /**
        * @property {Selector} [disableGlobalDnd=false]  是否禁掉整个页面 Của 拖拽 Hàm số ， Trong trường hợp 不禁用，图片拖进来 Của 时候会 Vỡ nợ 被 Trình duyệt 打开。
        * @namespace options
        * @for Uploader
        */

        /**
        * @event dndAccept
        * @param {DataTransferItemList} items DataTransferItem
        * @description 阻止此事件可以拒绝某些 Danh mục 型 Của 文件拖入进来。目前只有 chrome 提供这样 Của  API，且只能通过 mime-type 验证。
        * @for  Uploader
        */
        return Uploader.register({
            init: function (opts) {

                if (!opts.dnd ||
                        this.request('predict-runtime-type') !== 'html5') {
                    return;
                }

                var me = this,
                    deferred = Base.Deferred(),
                    options = $.extend({}, {
                        disableGlobalDnd: opts.disableGlobalDnd,
                        container: opts.dnd,
                        accept: opts.accept
                    }),
                    dnd;

                dnd = new Dnd(options);

                dnd.once('ready', deferred.resolve);
                dnd.on('drop', function (files) {
                    me.request('add-file', [files]);
                });

                // 检测文件是否全部允许添加。
                dnd.on('accept', function (items) {
                    return me.owner.trigger('dndAccept', items);
                });

                dnd.init();

                return deferred.promise();
            }
        });
    });

    /**
    * @fileOverview 错误信息
    */
    define('lib/filepaste', [
        'base',
        'mediator',
        'runtime/client'
    ], function (Base, Mediator, RuntimeClent) {

        var $ = Base.$;

        function FilePaste(opts) {
            opts = this.options = $.extend({}, opts);
            opts.container = $(opts.container || document.body);
            RuntimeClent.call(this, 'FilePaste');
        }

        Base.inherits(RuntimeClent, {
            constructor: FilePaste,

            init: function () {
                var me = this;

                me.connectRuntime(me.options, function () {
                    me.exec('init');
                    me.trigger('ready');
                });
            },

            destroy: function () {
                this.exec('destroy');
                this.disconnectRuntime();
                this.off();
            }
        });

        Mediator.installTo(FilePaste.prototype);

        return FilePaste;
    });
    /**
    * @fileOverview 组件基 Danh mục 。
    */
    define('widgets/filepaste', [
        'base',
        'uploader',
        'lib/filepaste',
        'widgets/widget'
    ], function (Base, Uploader, FilePaste) {
        var $ = Base.$;

        /**
        * @property {Selector} [paste=undefined]  指定监听paste事件 Của 容器， Trong trường hợp 不指定，不启用此 Hàm số 。此 Hàm số  Vì 通过粘贴来添加截屏 Của 图片。建议 Thiết lập  Vì `document.body`.
        * @namespace options
        * @for Uploader
        */
        return Uploader.register({
            init: function (opts) {

                if (!opts.paste ||
                        this.request('predict-runtime-type') !== 'html5') {
                    return;
                }

                var me = this,
                    deferred = Base.Deferred(),
                    options = $.extend({}, {
                        container: opts.paste,
                        accept: opts.accept
                    }),
                    paste;

                paste = new FilePaste(options);

                paste.once('ready', deferred.resolve);
                paste.on('paste', function (files) {
                    me.owner.request('add-file', [files]);
                });
                paste.init();

                return deferred.promise();
            }
        });
    });
    /**
    * @fileOverview Blob
    */
    define('lib/blob', [
        'base',
        'runtime/client'
    ], function (Base, RuntimeClient) {

        function Blob(ruid, source) {
            var me = this;

            me.source = source;
            me.ruid = ruid;
            this.size = source.size || 0;

            //  Trong trường hợp 没有指定 mimetype, 但是知道文件后缀。
            if (!source.type && ~'jpg,jpeg,png,gif,bmp'.indexOf(this.ext)) {
                this.type = 'image/' + (this.ext === 'jpg' ? 'jpeg' : this.ext);
            } else {
                this.type = source.type || 'application/octet-stream';
            }

            RuntimeClient.call(me, 'Blob');
            this.uid = source.uid || this.uid;

            if (ruid) {
                me.connectRuntime(ruid);
            }
        }

        Base.inherits(RuntimeClient, {
            constructor: Blob,

            slice: function (start, end) {
                return this.exec('slice', start, end);
            },

            getSource: function () {
                return this.source;
            }
        });

        return Blob;
    });
    /**
    *  Vì 了统一化Flash Của File和HTML5 Của File而存 Trong 。
    * 以至于要调用Flash里面 Của File，也可以像调用HTML5版本 Của File一下。
    * @fileOverview File
    */
    define('lib/file', [
        'base',
        'lib/blob'
    ], function (Base, Blob) {

        var uid = 1,
            rExt = /\.([^.]+)$/;

        function File(ruid, file) {
            var ext;

            this.name = file.name || ('untitled' + uid++);
            ext = rExt.exec(file.name) ? RegExp.$1.toLowerCase() : '';

            // todo 支持其他 Danh mục 型文件 Của 转换。
            //  Trong trường hợp 有 mimetype, 但是文件名里面没有找出后缀规律
            if (!ext && file.type) {
                ext = /\/(jpg|jpeg|png|gif|bmp)$/i.exec(file.type) ?
                        RegExp.$1.toLowerCase() : '';
                this.name += '.' + ext;
            }

            this.ext = ext;
            this.lastModifiedDate = file.lastModifiedDate ||
                    (new Date()).toLocaleString();

            Blob.apply(this, arguments);
        }

        return Base.inherits(Blob, File);
    });

    /**
    * @fileOverview 错误信息
    */
    define('lib/filepicker', [
        'base',
        'runtime/client',
        'lib/file'
    ], function (Base, RuntimeClent, File) {

        var $ = Base.$;

        function FilePicker(opts) {
            opts = this.options = $.extend({}, FilePicker.options, opts);

            opts.container = $(opts.id);

            if (!opts.container.length) {
                throw new Error('按钮指定错误');
            }

            opts.innerHTML = opts.innerHTML || opts.label ||
                    opts.container.html() || '';

            opts.button = $(opts.button || document.createElement('div'));
            opts.button.html(opts.innerHTML);
            opts.container.html(opts.button);

            RuntimeClent.call(this, 'FilePicker', true);
        }

        FilePicker.options = {
            button: null,
            container: null,
            label: null,
            innerHTML: null,
            multiple: true,
            accept: null,
            name: 'file'
        };

        Base.inherits(RuntimeClent, {
            constructor: FilePicker,

            init: function () {
                var me = this,
                    opts = me.options,
                    button = opts.button;

                button.addClass('webuploader-pick');

                me.on('all', function (type) {
                    var files;

                    switch (type) {
                        case 'mouseenter':
                            button.addClass('webuploader-pick-hover');
                            break;

                        case 'mouseleave':
                            button.removeClass('webuploader-pick-hover');
                            break;

                        case 'change':
                            files = me.exec('getFiles');
                            me.trigger('select', $.map(files, function (file) {
                                file = new File(me.getRuid(), file);

                                // 记录来源。
                                file._refer = opts.container;
                                return file;
                            }), opts.container);
                            break;
                    }
                });

                me.connectRuntime(opts, function () {
                    me.refresh();
                    me.exec('init', opts);
                    me.trigger('ready');
                });

                $(window).on('resize', function () {
                    me.refresh();
                });
            },

            refresh: function () {
                var shimContainer = this.getRuntime().getContainer(),
                    button = this.options.button,
                    width = button.outerWidth ?
                            button.outerWidth() : button.width(),

                    height = button.outerHeight ?
                            button.outerHeight() : button.height(),

                    pos = button.offset();

                if(width < shimContainer.width()){
                    width = shimContainer.width();
                }
                if(height < shimContainer.height()){
                    height = shimContainer.height();
                }

                width && height && shimContainer.css({
                    bottom: 'auto',
                    right: 'auto',
                    width: width + 'px',
                    height: height + 'px'
                }).offset(pos);
            },

            enable: function () {
                var btn = this.options.button;

                btn.removeClass('webuploader-pick-disable');
                this.refresh();
            },

            disable: function () {
                var btn = this.options.button;

                this.getRuntime().getContainer().css({
                    top: '-99999px'
                });

                btn.addClass('webuploader-pick-disable');
            },

            destroy: function () {
                if (this.runtime) {
                    this.exec('destroy');
                    this.disconnectRuntime();
                }
            }
        });

        return FilePicker;
    });

    /**
    * @fileOverview 文件选择相关
    */
    define('widgets/filepicker', [
        'base',
        'uploader',
        'lib/filepicker',
        'widgets/widget'
    ], function (Base, Uploader, FilePicker) {
        var $ = Base.$;

        $.extend(Uploader.options, {

            /**
            * @property {Selector | Object} [pick=undefined]
            * @namespace options
            * @for Uploader
            * @description 指定选择文件 Của 按钮容器，不指定则不创建按钮。
            *
            * * `id` {Seletor} 指定选择文件 Của 按钮容器，不指定则不创建按钮。
            * * `label` {String} 请采用 `innerHTML` 代替
            * * `innerHTML` {String} 指定按钮文字。不指定时优先从指定 Của 容器 Trong 看是否自带文字。
            * * `multiple` {Boolean} 是否开起同时选择多个文件能力。
            */
            pick: null,

            /**
            * @property {Arroy} [accept=null]
            * @namespace options
            * @for Uploader
            * @description 指定接受哪些 Danh mục 型 Của 文件。 由于目前还有ext转mimeType表，所以这里需要分开指定。
            *
            * * `title` {String} 文字描述
            * * `extensions` {String} 允许 Của 文件后缀，不带点，多个用逗号分割。
            * * `mimeTypes` {String} 多个用逗号分割。
            *
            *  Như ：
            *
            * ```
            * {
            *     title: 'Images',
            *     extensions: 'gif,jpg,jpeg,bmp,png',
            *     mimeTypes: 'image/*'
            * }
            * ```
            */
            accept: null/*{
                title: 'Images',
                extensions: 'gif,jpg,jpeg,bmp,png',
                mimeTypes: 'image/*'
            }*/
        });

        return Uploader.register({
            'add-btn': 'addButton',
            refresh: 'refresh',
            disable: 'disable',
            enable: 'enable'
        }, {

            init: function (opts) {
                this.pickers = [];
                return opts.pick && this.addButton(opts.pick);
            },

            refresh: function () {
                $.each(this.pickers, function () {
                    this.refresh();
                });
            },

            /**
            * @method addButton
            * @for Uploader
            * @grammar addButton( pick ) => Promise
            * @description
            * 添加文件选择按钮， Trong trường hợp 一个按钮不够，需要调用此 Phương pháp 来添加。参数跟[options.pick](#WebUploader:Uploader:options)一致。
            * @example
            * uploader.addButton({
            *     id: '#btnContainer',
            *     innerHTML: '选择文件'
            * });
            */
            addButton: function (pick) {
                var me = this,
                    opts = me.options,
                    accept = opts.accept,
                    promises = [];

                if (!pick) {
                    return;
                }

                $.isPlainObject(pick) || (pick = {
                    id: pick
                });

                $(pick.id).each(function () {
                    var options, picker, deferred;

                    deferred = Base.Deferred();

                    options = $.extend({}, pick, {
                        accept: $.isPlainObject(accept) ? [accept] : accept,
                        swf: opts.swf,
                        runtimeOrder: opts.runtimeOrder,
                        id: this
                    });

                    picker = new FilePicker(options);

                    picker.once('ready', deferred.resolve);
                    picker.on('select', function (files) {
                        me.owner.request('add-file', [files]);
                    });
                    picker.init();

                    me.pickers.push(picker);

                    promises.push(deferred.promise());
                });

                return Base.when.apply(Base, promises);
            },

            disable: function () {
                $.each(this.pickers, function () {
                    this.disable();
                });
            },

            enable: function () {
                $.each(this.pickers, function () {
                    this.enable();
                });
            }
        });
    });
    /**
    * @fileOverview 文件属性封装
    */
    define('file', [
        'base',
        'mediator'
    ], function (Base, Mediator) {

        var $ = Base.$,
            idPrefix = 'WU_FILE_',
            idSuffix = 0,
            rExt = /\.([^.]+)$/,
            statusMap = {};

        function gid() {
            return idPrefix + idSuffix++;
        }

        /**
        * 文件 Danh mục 
        * @class File
        * @constructor 构造函数
        * @grammar new File( source ) => File
        * @param {Lib.File} source [lib.File](#Lib.File)实例, 此source Đúng  Voi 是带有Runtime信息 Của 。
        */
        function WUFile(source) {

            /**
            * 文件名，包括扩展名（后缀）
            * @property name
            * @type {string}
            */
            this.name = source.name || 'Untitled';

            /**
            * 文件体积（字节）
            * @property size
            * @type {uint}
            * @default 0
            */
            this.size = source.size || 0;

            /**
            * 文件MIMETYPE Danh mục 型， Chống 文件 Danh mục 型 Của  Đúng  Nên 关系请参考[http://t.cn/z8ZnFny](http://t.cn/z8ZnFny)
            * @property type
            * @type {string}
            * @default 'application'
            */
            this.type = source.type || 'application';

            /**
            * 文件最后修改日期
            * @property lastModifiedDate
            * @type {int}
            * @default 当前时间戳
            */
            this.lastModifiedDate = source.lastModifiedDate || (new Date() * 1);

            /**
            * 文件ID， Mỗi  Đúng  Voi 具有唯一ID， Chống 文件名无关
            * @property id
            * @type {string}
            */
            this.id = gid();

            /**
            * 文件扩展名，通过文件名 Được ，例 Như test.png Của 扩展名 Vì png
            * @property ext
            * @type {string}
            */
            this.ext = rExt.exec(this.name) ? RegExp.$1 : '';


            /**
            * 状态文字说明。 Trong 不同 Của status语境下有不同 Của 用途。
            * @property statusText
            * @type {string}
            */
            this.statusText = '';

            // 存储文件状态，防止通过属性直接修改
            statusMap[this.id] = WUFile.Status.INITED;

            this.source = source;
            this.loaded = 0;

            this.on('error', function (msg) {
                this.setStatus(WUFile.Status.ERROR, msg);
            });
        }

        $.extend(WUFile.prototype, {

            /**
            *  Thiết lập 状态，状态变化时会触发`change`事件。
            * @method setStatus
            * @grammar setStatus( status[, statusText] );
            * @param {File.Status|String} status [文件状态值](#WebUploader:File:File.Status)
            * @param {String} [statusText=''] 状态说明，常 Trong error时 Dùng ，用http, abort,server等来标记是由于什么原因导致文件错误。
            */
            setStatus: function (status, text) {

                var prevStatus = statusMap[this.id];

                typeof text !== 'undefined' && (this.statusText = text);

                if (status !== prevStatus) {
                    statusMap[this.id] = status;
                    /**
                    * 文件状态变化
                    * @event statuschange
                    */
                    this.trigger('statuschange', status, prevStatus);
                }

            },

            /**
            *  Được 文件状态
            * @return {File.Status}
            * @example
            文件状态具体包括以下几种 Danh mục 型：
            {
            // 初始化
            INITED:     0,
            // 已入队列
            QUEUED:     1,
            // 正 Trong 上传
            PROGRESS:     2,
            // 上传出错
            ERROR:         3,
            // 上传成功
            COMPLETE:     4,
            // 上传取消
            CANCELLED:     5
            }
            */
            getStatus: function () {
                return statusMap[this.id];
            },

            /**
            *  Được 文件原始信息。
            * @return {*}
            */
            getSource: function () {
                return this.source;
            },

            destory: function () {
                delete statusMap[this.id];
            }
        });

        Mediator.installTo(WUFile.prototype);

        /**
        * 文件状态值，具体包括以下几种 Danh mục 型：
        * * `inited` 初始状态
        * * `queued` 已经进入队列, 等待上传
        * * `progress` 上传 Trong 
        * * `complete` 上传完成。
        * * `error` 上传出错，可重试
        * * `interrupt` 上传 Trong 断，可续传。
        * * `invalid` 文件不合格，不能重试上传。会自动从队列 Trong 移除。
        * * `cancelled` 文件被移除。
        * @property {Object} Status
        * @namespace File
        * @class File
        * @static
        */
        WUFile.Status = {
            INITED: 'inited',    // 初始状态
            QUEUED: 'queued',    // 已经进入队列, 等待上传
            PROGRESS: 'progress',    // 上传 Trong 
            ERROR: 'error',    // 上传出错，可重试
            COMPLETE: 'complete',    // 上传完成。
            CANCELLED: 'cancelled',    // 上传取消。
            INTERRUPT: 'interrupt',    // 上传 Trong 断，可续传。
            INVALID: 'invalid'    // 文件不合格，不能重试上传。
        };

        return WUFile;
    });

    /**
    * @fileOverview 文件队列
    */
    define('queue', [
        'base',
        'mediator',
        'file'
    ], function (Base, Mediator, WUFile) {

        var $ = Base.$,
            STATUS = WUFile.Status;

        /**
        * 文件队列, 用来存储各个状态 Trong  Của 文件。
        * @class Queue
        * @extends Mediator
        */
        function Queue() {

            /**
            * 统计文件数。
            * * `numOfQueue` 队列 Trong  Của 文件数。
            * * `numOfSuccess` 上传成功 Của 文件数
            * * `numOfCancel` 被移除 Của 文件数
            * * `numOfProgress` 正 Trong 上传 Trong  Của 文件数
            * * `numOfUploadFailed` 上传错误 Của 文件数。
            * * `numOfInvalid` 无效 Của 文件数。
            * @property {Object} stats
            */
            this.stats = {
                numOfQueue: 0,
                numOfSuccess: 0,
                numOfCancel: 0,
                numOfProgress: 0,
                numOfUploadFailed: 0,
                numOfInvalid: 0
            };

            // 上传队列，仅包括等待上传 Của 文件
            this._queue = [];

            // 存储所有文件
            this._map = {};
        }

        $.extend(Queue.prototype, {

            /**
            * 将新文件加入 Đúng 队列尾部
            *
            * @method append
            * @param  {File} file   文件 Đúng  Voi 
            */
            append: function (file) {
                this._queue.push(file);
                this._fileAdded(file);
                return this;
            },

            /**
            * 将新文件加入 Đúng 队列头部
            *
            * @method prepend
            * @param  {File} file   文件 Đúng  Voi 
            */
            prepend: function (file) {
                this._queue.unshift(file);
                this._fileAdded(file);
                return this;
            },

            /**
            *  Được 文件 Đúng  Voi 
            *
            * @method getFile
            * @param  {String} fileId   文件ID
            * @return {File}
            */
            getFile: function (fileId) {
                if (typeof fileId !== 'string') {
                    return fileId;
                }
                return this._map[fileId];
            },

            /**
            * 从队列 Trong 取出一个指定状态 Của 文件。
            * @grammar fetch( status ) => File
            * @method fetch
            * @param {String} status [文件状态值](#WebUploader:File:File.Status)
            * @return {File} [File](#WebUploader:File)
            */
            fetch: function (status) {
                var len = this._queue.length,
                    i, file;

                status = status || STATUS.QUEUED;

                for (i = 0; i < len; i++) {
                    file = this._queue[i];

                    if (status === file.getStatus()) {
                        return file;
                    }
                }

                return null;
            },

            /**
            *  Đúng 队列进行排序，能够控制文件上传顺序。
            * @grammar sort( fn ) => undefined
            * @method sort
            * @param {Function} fn 排序 Phương pháp 
            */
            sort: function (fn) {
                if (typeof fn === 'function') {
                    this._queue.sort(fn);
                }
            },

            /**
            *  Được 指定 Danh mục 型 Của 文件列表, 列表 Trong 每一个成员 Vì [File](#WebUploader:File) Đúng  Voi 。
            * @grammar getFiles( [status1[, status2 ...]] ) => Array
            * @method getFiles
            * @param {String} [status] [文件状态值](#WebUploader:File:File.Status)
            */
            getFiles: function () {
                var sts = [].slice.call(arguments, 0),
                    ret = [],
                    i = 0,
                    len = this._queue.length,
                    file;

                for (; i < len; i++) {
                    file = this._queue[i];

                    if (sts.length && ! ~$.inArray(file.getStatus(), sts)) {
                        continue;
                    }

                    ret.push(file);
                }

                return ret;
            },

            _fileAdded: function (file) {
                var me = this,
                    existing = this._map[file.id];

                if (!existing) {
                    this._map[file.id] = file;

                    file.on('statuschange', function (cur, pre) {
                        me._onFileStatusChange(cur, pre);
                    });
                }

                file.setStatus(STATUS.QUEUED);
            },

            _onFileStatusChange: function (curStatus, preStatus) {
                var stats = this.stats;

                switch (preStatus) {
                    case STATUS.PROGRESS:
                        stats.numOfProgress--;
                        break;

                    case STATUS.QUEUED:
                        stats.numOfQueue--;
                        break;

                    case STATUS.ERROR:
                        stats.numOfUploadFailed--;
                        break;

                    case STATUS.INVALID:
                        stats.numOfInvalid--;
                        break;
                }

                switch (curStatus) {
                    case STATUS.QUEUED:
                        stats.numOfQueue++;
                        break;

                    case STATUS.PROGRESS:
                        stats.numOfProgress++;
                        break;

                    case STATUS.ERROR:
                        stats.numOfUploadFailed++;
                        break;

                    case STATUS.COMPLETE:
                        stats.numOfSuccess++;
                        break;

                    case STATUS.CANCELLED:
                        stats.numOfCancel++;
                        break;

                    case STATUS.INVALID:
                        stats.numOfInvalid++;
                        break;
                }
            }

        });

        Mediator.installTo(Queue.prototype);

        return Queue;
    });
    /**
    * @fileOverview 队列
    */
    define('widgets/queue', [
        'base',
        'uploader',
        'queue',
        'file',
        'lib/file',
        'runtime/client',
        'widgets/widget'
    ], function (Base, Uploader, Queue, WUFile, File, RuntimeClient) {

        var $ = Base.$,
            rExt = /\.\w+$/,
            Status = WUFile.Status;

        return Uploader.register({
            'sort-files': 'sortFiles',
            'add-file': 'addFiles',
            'get-file': 'getFile',
            'fetch-file': 'fetchFile',
            'get-stats': 'getStats',
            'get-files': 'getFiles',
            'remove-file': 'removeFile',
            'retry': 'retry',
            'reset': 'reset',
            'accept-file': 'acceptFile'
        }, {

            init: function (opts) {
                var me = this,
                    deferred, len, i, item, arr, accept, runtime;

                if ($.isPlainObject(opts.accept)) {
                    opts.accept = [opts.accept];
                }

                // accept Trong  Của  Trong 生成匹配正则。
                if (opts.accept) {
                    arr = [];

                    for (i = 0, len = opts.accept.length; i < len; i++) {
                        item = opts.accept[i].extensions;
                        item && arr.push(item);
                    }

                    if (arr.length) {
                        accept = '\\.' + arr.join(',')
                                .replace(/,/g, '$|\\.')
                                .replace(/\*/g, '.*') + '$';
                    }

                    me.accept = new RegExp(accept, 'i');
                }

                me.queue = new Queue();
                me.stats = me.queue.stats;

                //  Trong trường hợp 当前不是html5运行时，那就算了。
                // 不执行后续操作
                if (this.request('predict-runtime-type') !== 'html5') {
                    return;
                }

                // 创建一个 html5 运行时 Của  placeholder
                // 以至于外部添加原生 File  Đúng  Voi  Của 时候能正确包裹一下供 webuploader  Dùng 。
                deferred = Base.Deferred();
                runtime = new RuntimeClient('Placeholder');
                runtime.connectRuntime({
                    runtimeOrder: 'html5'
                }, function () {
                    me._ruid = runtime.getRuid();
                    deferred.resolve();
                });
                return deferred.promise();
            },


            //  Vì 了支持外部直接添加一个原生File Đúng  Voi 。
            _wrapFile: function (file) {
                if (!(file instanceof WUFile)) {

                    if (!(file instanceof File)) {
                        if (!this._ruid) {
                            throw new Error('Can\'t add external files.');
                        }
                        file = new File(this._ruid, file);
                    }

                    file = new WUFile(file);
                }

                return file;
            },

            // 判断文件是否可以被加入队列
            acceptFile: function (file) {
                var invalid = !file || file.size < 6 || this.accept &&

                //  Trong trường hợp 名字 Trong 有后缀，才做后缀白名单处理。
                        rExt.exec(file.name) && !this.accept.test(file.name);

                return !invalid;
            },


            /**
            * @event beforeFileQueued
            * @param {File} file File Đúng  Voi 
            * @description 当文件被加入队列之前触发，此事件 Của handler返回值 Vì `false`，则此文件不会被添加进入队列。
            * @for  Uploader
            */

            /**
            * @event fileQueued
            * @param {File} file File Đúng  Voi 
            * @description 当文件被加入队列以后触发。
            * @for  Uploader
            */

            _addFile: function (file) {
                var me = this;

                file = me._wrapFile(file);

                // 不过 Danh mục 型判断允许不允许，先派送 `beforeFileQueued`
                if (!me.owner.trigger('beforeFileQueued', file)) {
                    return;
                }

                //  Danh mục 型不匹配，则派送错误事件，并返回。
                if (!me.acceptFile(file)) {
                    me.owner.trigger('error', 'Q_TYPE_DENIED', file);
                    return;
                }

                me.queue.append(file);
                me.owner.trigger('fileQueued', file);
                return file;
            },

            getFile: function (fileId) {
                return this.queue.getFile(fileId);
            },

            /**
            * @event filesQueued
            * @param {File} files 数组，内容 Vì 原始File(lib/File） Đúng  Voi 。
            * @description 当一批文件添加进队列以后触发。
            * @for  Uploader
            */

            /**
            * @method addFiles
            * @grammar addFiles( file ) => undefined
            * @grammar addFiles( [file1, file2 ...] ) => undefined
            * @param {Array of File or File} [files] Files  Đúng  Voi  数组
            * @description 添加文件到队列
            * @for  Uploader
            */
            addFiles: function (files) {
                var me = this;

                if (!files.length) {
                    files = [files];
                }

                files = $.map(files, function (file) {
                    return me._addFile(file);
                });

                me.owner.trigger('filesQueued', files);

                if (me.options.auto) {
                    setTimeout(function () {
                        me.request('start-upload');
                    }, 20);
                }
            },

            getStats: function () {
                return this.stats;
            },

            /**
            * @event fileDequeued
            * @param {File} file File Đúng  Voi 
            * @description 当文件被移除队列后触发。
            * @for  Uploader
            */

            /**
            * @method removeFile
            * @grammar removeFile( file ) => undefined
            * @grammar removeFile( id ) => undefined
            * @param {File|id} file File Đúng  Voi 或这File Đúng  Voi  Của id
            * @description 移除某一文件。
            * @for  Uploader
            * @example
            *
            * $li.on('click', '.remove-this', function() {
            *     uploader.removeFile( file );
            * })
            */
            removeFile: function (file) {
                var me = this;

                file = file.id ? file : me.queue.getFile(file);

                file.setStatus(Status.CANCELLED);
                me.owner.trigger('fileDequeued', file);
            },

            /**
            * @method getFiles
            * @grammar getFiles() => Array
            * @grammar getFiles( status1, status2, status... ) => Array
            * @description 返回指定状态 Của 文件集合，不传参数将返回所有状态 Của 文件。
            * @for  Uploader
            * @example
            * console.log( uploader.getFiles() );    // => all files
            * console.log( uploader.getFiles('error') )    // => all error files.
            */
            getFiles: function () {
                return this.queue.getFiles.apply(this.queue, arguments);
            },

            fetchFile: function () {
                return this.queue.fetch.apply(this.queue, arguments);
            },

            /**
            * @method retry
            * @grammar retry() => undefined
            * @grammar retry( file ) => undefined
            * @description 重试上传，重试指定文件， Hoặc 从出错 Của 文件开始重新上传。
            * @for  Uploader
            * @example
            * function retry() {
            *     uploader.retry();
            * }
            */
            retry: function (file, noForceStart) {
                var me = this,
                    files, i, len;

                if (file) {
                    file = file.id ? file : me.queue.getFile(file);
                    file.setStatus(Status.QUEUED);
                    noForceStart || me.request('start-upload');
                    return;
                }

                files = me.queue.getFiles(Status.ERROR);
                i = 0;
                len = files.length;

                for (; i < len; i++) {
                    file = files[i];
                    file.setStatus(Status.QUEUED);
                }

                me.request('start-upload');
            },

            /**
            * @method sort
            * @grammar sort( fn ) => undefined
            * @description 排序队列 Trong  Của 文件， Trong 上传之前调整可以控制上传顺序。
            * @for  Uploader
            */
            sortFiles: function () {
                return this.queue.sort.apply(this.queue, arguments);
            },

            /**
            * @event reset
            * @description 当 uploader 被重置 Của 时候触发。
            * @for  Uploader
            */

            /**
            * @method reset
            * @grammar reset() => undefined
            * @description 重置uploader。目前只重置了队列。
            * @for  Uploader
            * @example
            * uploader.reset();
            */
            reset: function () {
                this.owner.trigger('reset');
                this.queue = new Queue();
                this.stats = this.queue.stats;
            }
        });

    });
    /**
    * @fileOverview 添加 Được Runtime相关信息 Của  Phương pháp 。
    */
    define('widgets/runtime', [
        'uploader',
        'runtime/runtime',
        'widgets/widget'
    ], function (Uploader, Runtime) {

        Uploader.support = function () {
            return Runtime.hasRuntime.apply(Runtime, arguments);
        };

        return Uploader.register({
            'predict-runtime-type': 'predictRuntmeType'
        }, {

            init: function () {
                if (!this.predictRuntmeType()) {
                    throw Error('Runtime Error');
                }
            },

            /**
            * 预测Uploader将采用哪个`Runtime`
            * @grammar predictRuntmeType() => String
            * @method predictRuntmeType
            * @for  Uploader
            */
            predictRuntmeType: function () {
                var orders = this.options.runtimeOrder || Runtime.orders,
                    type = this.type,
                    i, len;

                if (!type) {
                    orders = orders.split(/\s*,\s*/g);

                    for (i = 0, len = orders.length; i < len; i++) {
                        if (Runtime.hasRuntime(orders[i])) {
                            this.type = type = orders[i];
                            break;
                        }
                    }
                }

                return type;
            }
        });
    });
    /**
    * @fileOverview Transport
    */
    define('lib/transport', [
        'base',
        'runtime/client',
        'mediator'
    ], function (Base, RuntimeClient, Mediator) {

        var $ = Base.$;

        function Transport(opts) {
            var me = this;

            opts = me.options = $.extend(true, {}, Transport.options, opts || {});
            RuntimeClient.call(this, 'Transport');

            this._blob = null;
            this._formData = opts.formData || {};
            this._headers = opts.headers || {};

            this.on('progress', this._timeout);
            this.on('load error', function () {
                me.trigger('progress', 1);
                clearTimeout(me._timer);
            });
        }

        Transport.options = {
            server: '',
            method: 'POST',

            // 跨域时，是否允许携带cookie, 只有html5 runtime才有效
            withCredentials: false,
            fileVal: 'file',
            timeout: 2 * 60 * 1000,    // 2分钟
            formData: {},
            headers: {},
            sendAsBinary: false
        };

        $.extend(Transport.prototype, {

            // 添加Blob, 只能添加一次，最后一次有效。
            appendBlob: function (key, blob, filename) {
                var me = this,
                    opts = me.options;

                if (me.getRuid()) {
                    me.disconnectRuntime();
                }

                // 连接到blob归属 Của 同一个runtime.
                me.connectRuntime(blob.ruid, function () {
                    me.exec('init');
                });

                me._blob = blob;
                opts.fileVal = key || opts.fileVal;
                opts.filename = filename || opts.filename;
            },

            // 添加其他字段
            append: function (key, value) {
                if (typeof key === 'object') {
                    $.extend(this._formData, key);
                } else {
                    this._formData[key] = value;
                }
            },

            setRequestHeader: function (key, value) {
                if (typeof key === 'object') {
                    $.extend(this._headers, key);
                } else {
                    this._headers[key] = value;
                }
            },

            send: function (method) {
                this.exec('send', method);
                this._timeout();
            },

            abort: function () {
                clearTimeout(this._timer);
                return this.exec('abort');
            },

            destroy: function () {
                this.trigger('destroy');
                this.off();
                this.exec('destroy');
                this.disconnectRuntime();
            },

            getResponse: function () {
                return this.exec('getResponse');
            },

            getResponseAsJson: function () {
                return this.exec('getResponseAsJson');
            },

            getStatus: function () {
                return this.exec('getStatus');
            },

            _timeout: function () {
                var me = this,
                    duration = me.options.timeout;

                if (!duration) {
                    return;
                }

                clearTimeout(me._timer);
                me._timer = setTimeout(function () {
                    me.abort();
                    me.trigger('error', 'timeout');
                }, duration);
            }

        });

        // 让Transport具备事件 Hàm số 。
        Mediator.installTo(Transport.prototype);

        return Transport;
    });
    /**
    * @fileOverview 负责文件上传相关。
    */
    define('widgets/upload', [
        'base',
        'uploader',
        'file',
        'lib/transport',
        'widgets/widget'
    ], function (Base, Uploader, WUFile, Transport) {

        var $ = Base.$,
            isPromise = Base.isPromise,
            Status = WUFile.Status;

        // 添加 Vỡ nợ 配置项
        $.extend(Uploader.options, {


            /**
            * @property {Boolean} [prepareNextFile=false]
            * @namespace options
            * @for Uploader
            * @description 是否允许 Trong 文件传输时提前把下一个文件准备好。
            *  Đúng 于一个文件 Của 准备工作比较耗时，比 Như 图片压缩，md5序列化。
            *  Trong trường hợp 能提前 Trong 当前文件传输期处理，可以节省总体耗时。
            */
            prepareNextFile: false,

            /**
            * @property {Boolean} [chunked=false]
            * @namespace options
            * @for Uploader
            * @description 是否要分片处理大文件上传。
            */
            chunked: false,

            /**
            * @property {Boolean} [chunkSize=5242880]
            * @namespace options
            * @for Uploader
            * @description  Trong trường hợp 要分片，分多大一片？  Vỡ nợ 大小 Vì 5M.
            */
            chunkSize: 5 * 1024 * 1024,

            /**
            * @property {Boolean} [chunkRetry=2]
            * @namespace options
            * @for Uploader
            * @description  Trong trường hợp 某个分片由于网络问题出错，允许自动重传多少次？
            */
            chunkRetry: 2,

            /**
            * @property {Boolean} [threads=3]
            * @namespace options
            * @for Uploader
            * @description 上传并发数。允许同时最大上传进程数。
            */
            threads: 3,


            /**
            * @property {Object} [formData]
            * @namespace options
            * @for Uploader
            * @description 文件上传请求 Của 参数表，每次发送都会发送此 Đúng  Voi  Trong  Của 参数。
            */
            formData: null

            /**
            * @property {Object} [fileVal='file']
            * @namespace options
            * @for Uploader
            * @description  Thiết lập 文件上传域 Của name。
            */

            /**
            * @property {Object} [method='POST']
            * @namespace options
            * @for Uploader
            * @description 文件上传方式，`POST` Hoặc `GET`。
            */

            /**
            * @property {Object} [sendAsBinary=false]
            * @namespace options
            * @for Uploader
            * @description 是否已二进制 Của 流 Của 方式发送文件，这样整个上传内容`php://input`都 Vì 文件内容，
            * 其他参数 Trong $_GET数组 Trong 。
            */
        });

        // 负责将文件切片。
        function CuteFile(file, chunkSize) {
            var pending = [],
                blob = file.source,
                total = blob.size,
                chunks = chunkSize ? Math.ceil(total / chunkSize) : 1,
                start = 0,
                index = 0,
                len;

            while (index < chunks) {
                len = Math.min(chunkSize, total - start);

                pending.push({
                    file: file,
                    start: start,
                    end: chunkSize ? (start + len) : total,
                    total: total,
                    chunks: chunks,
                    chunk: index++
                });
                start += len;
            }

            file.blocks = pending.concat();
            file.remaning = pending.length;

            return {
                file: file,

                has: function () {
                    return !!pending.length;
                },

                fetch: function () {
                    return pending.shift();
                }
            };
        }

        Uploader.register({
            'start-upload': 'start',
            'stop-upload': 'stop',
            'skip-file': 'skipFile',
            'is-in-progress': 'isInProgress'
        }, {

            init: function () {
                var owner = this.owner;

                this.runing = false;

                // 记录当前正 Trong 传 Của 数据，跟threads相关
                this.pool = [];

                // 缓存即将上传 Của 文件。
                this.pending = [];

                // 跟踪还有多少分片没有完成上传。
                this.remaning = 0;
                this.__tick = Base.bindFn(this._tick, this);

                owner.on('uploadComplete', function (file) {
                    // 把其他块取消了。
                    file.blocks && $.each(file.blocks, function (_, v) {
                        v.transport && (v.transport.abort(), v.transport.destroy());
                        delete v.transport;
                    });

                    delete file.blocks;
                    delete file.remaning;
                });
            },

            /**
            * @event startUpload
            * @description 当开始上传流程时触发。
            * @for  Uploader
            */

            /**
            * 开始上传。此 Phương pháp 可以从初始状态调用开始上传流程，也可以从暂停状态调用，继续上传流程。
            * @grammar upload() => undefined
            * @method upload
            * @for  Uploader
            */
            start: function () {
                var me = this;

                // 移出invalid Của 文件
                $.each(me.request('get-files', Status.INVALID), function () {
                    me.request('remove-file', this);
                });

                if (me.runing) {
                    return;
                }

                me.runing = true;

                //  Trong trường hợp 有暂停 Của ，则续传
                $.each(me.pool, function (_, v) {
                    var file = v.file;

                    if (file.getStatus() === Status.INTERRUPT) {
                        file.setStatus(Status.PROGRESS);
                        me._trigged = false;
                        v.transport && v.transport.send();
                    }
                });

                me._trigged = false;
                me.owner.trigger('startUpload');
                Base.nextTick(me.__tick);
            },

            /**
            * @event stopUpload
            * @description 当开始上传流程暂停时触发。
            * @for  Uploader
            */

            /**
            * 暂停上传。第一个参数 Vì 是否 Trong 断上传当前正 Trong 上传 Của 文件。
            * @grammar stop() => undefined
            * @grammar stop( true ) => undefined
            * @method stop
            * @for  Uploader
            */
            stop: function (interrupt) {
                var me = this;

                if (me.runing === false) {
                    return;
                }

                me.runing = false;

                interrupt && $.each(me.pool, function (_, v) {
                    v.transport && v.transport.abort();
                    v.file.setStatus(Status.INTERRUPT);
                });

                me.owner.trigger('stopUpload');
            },

            /**
            * 判断`Uplaode`r是否正 Trong 上传 Trong 。
            * @grammar isInProgress() => Boolean
            * @method isInProgress
            * @for  Uploader
            */
            isInProgress: function () {
                return !!this.runing;
            },

            getStats: function () {
                return this.request('get-stats');
            },

            /**
            * 掉过一个文件上传，直接标记指定文件 Vì 已上传状态。
            * @grammar skipFile( file ) => undefined
            * @method skipFile
            * @for  Uploader
            */
            skipFile: function (file, status) {
                file = this.request('get-file', file);

                file.setStatus(status || Status.COMPLETE);
                file.skipped = true;

                //  Trong trường hợp 正 Trong 上传。
                file.blocks && $.each(file.blocks, function (_, v) {
                    var _tr = v.transport;

                    if (_tr) {
                        _tr.abort();
                        _tr.destroy();
                        delete v.transport;
                    }
                });

                this.owner.trigger('uploadSkip', file);
            },

            /**
            * @event uploadFinished
            * @description 当所有文件上传结束时触发。
            * @for  Uploader
            */
            _tick: function () {
                var me = this,
                    opts = me.options,
                    fn, val;

                // 上一个promise还没有结束，则等待完成后再执行。
                if (me._promise) {
                    return me._promise.always(me.__tick);
                }

                // 还有位置，且还有文件要处理 Của 话。
                if (me.pool.length < opts.threads && (val = me._nextBlock())) {
                    me._trigged = false;

                    fn = function (val) {
                        me._promise = null;

                        // 有可能是reject过来 Của ，所以要检测val Của  Danh mục 型。
                        val && val.file && me._startSend(val);
                        Base.nextTick(me.__tick);
                    };

                    me._promise = isPromise(val) ? val.always(fn) : fn(val);

                    // 没有要上传 Của 了，且没有正 Trong 传输 Của 了。
                } else if (!me.remaning && !me.getStats().numOfQueue) {
                    me.runing = false;

                    me._trigged || Base.nextTick(function () {
                        me.owner.trigger('uploadFinished');
                    });
                    me._trigged = true;
                }
            },

            _nextBlock: function () {
                var me = this,
                    act = me._act,
                    opts = me.options,
                    next, done;

                //  Trong trường hợp 当前文件还有没有需要传输 Của ，则直接返回剩下 Của 。
                if (act && act.has() &&
                        act.file.getStatus() === Status.PROGRESS) {

                    // 是否提前准备下一个文件
                    if (opts.prepareNextFile && !me.pending.length) {
                        me._prepareNextFile();
                    }

                    return act.fetch();

                    //  Nếu không thì ， Trong trường hợp 正 Trong 运行，则准备下一个文件，并等待完成后返回下个分片。
                } else if (me.runing) {

                    //  Trong trường hợp 缓存 Trong 有，则直接 Trong 缓存 Trong 取，没有则去queue Trong 取。
                    if (!me.pending.length && me.getStats().numOfQueue) {
                        me._prepareNextFile();
                    }

                    next = me.pending.shift();
                    done = function (file) {
                        if (!file) {
                            return null;
                        }

                        act = CuteFile(file, opts.chunked ? opts.chunkSize : 0);
                        me._act = act;
                        return act.fetch();
                    };

                    // 文件可能还 Trong prepare Trong ，也有可能已经完全准备好了。
                    return isPromise(next) ?
                            next[next.pipe ? 'pipe' : 'then'](done) :
                            done(next);
                }
            },


            /**
            * @event uploadStart
            * @param {File} file File Đúng  Voi 
            * @description 某个文件开始上传前触发，一个文件只会触发一次。
            * @for  Uploader
            */
            _prepareNextFile: function () {
                var me = this,
                    file = me.request('fetch-file'),
                    pending = me.pending,
                    promise;

                if (file) {
                    promise = me.request('before-send-file', file, function () {

                        // 有可能文件被skip掉了。文件被skip掉后，状态坑定不是Queued.
                        if (file.getStatus() === Status.QUEUED) {
                            me.owner.trigger('uploadStart', file);
                            file.setStatus(Status.PROGRESS);
                            return file;
                        }

                        return me._finishFile(file);
                    });

                    //  Trong trường hợp 还 Trong pending Trong ，则替换成文件本身。
                    promise.done(function () {
                        var idx = $.inArray(promise, pending);

                        ~idx && pending.splice(idx, 1, file);
                    });

                    // befeore-send-file Của 钩子就有错误发生。
                    promise.fail(function (reason) {
                        file.setStatus(Status.ERROR, reason);
                        me.owner.trigger('uploadError', file, reason);
                        me.owner.trigger('uploadComplete', file);
                    });

                    pending.push(promise);
                }
            },

            // 让出位置了，可以让其他分片开始上传
            _popBlock: function (block) {
                var idx = $.inArray(block, this.pool);

                this.pool.splice(idx, 1);
                block.file.remaning--;
                this.remaning--;
            },

            // 开始上传，可以被掉过。 Trong trường hợp promise被reject了，则表示跳过此分片。
            _startSend: function (block) {
                var me = this,
                    file = block.file,
                    promise;

                me.pool.push(block);
                me.remaning++;

                //  Trong trường hợp 没有分片，则直接 Dùng 原始 Của 。
                // 不会丢失content-type信息。
                block.blob = block.chunks === 1 ? file.source :
                        file.source.slice(block.start, block.end);

                // hook,  Mỗi 分片发送之前可能要做些异步 Của 事情。
                promise = me.request('before-send', block, function () {

                    // 有可能文件已经上传出错了，所以不需要再传输了。
                    if (file.getStatus() === Status.PROGRESS) {
                        me._doSend(block);
                    } else {
                        me._popBlock(block);
                        Base.nextTick(me.__tick);
                    }
                });

                //  Trong trường hợp  Vì fail了，则跳过此分片。
                promise.fail(function () {
                    if (file.remaning === 1) {
                        me._finishFile(file).always(function () {
                            block.percentage = 1;
                            me._popBlock(block);
                            me.owner.trigger('uploadComplete', file);
                            Base.nextTick(me.__tick);
                        });
                    } else {
                        block.percentage = 1;
                        me._popBlock(block);
                        Base.nextTick(me.__tick);
                    }
                });
            },


            /**
            * @event uploadBeforeSend
            * @param {Object} object
            * @param {Object} data  Vỡ nợ  Của 上传参数，可以扩展此 Đúng  Voi 来控制上传参数。
            * @param {Object} headers 可以扩展此 Đúng  Voi 来控制上传头部。
            * @description 当某个文件 Của 分块 Trong 发送前触发，主要用来询问是否要添加附带参数，大文件 Trong 开起分片上传 Của 前提下此事件可能会触发多次。
            * @for  Uploader
            */

            /**
            * @event uploadAccept
            * @param {Object} object
            * @param {Object} ret 服务端 Của 返回数据，json格式， Trong trường hợp 服务端不是json格式，从ret._raw Trong 取数据，自行解析。
            * @description 当某个文件上传到服务端响 Nên 后，会派送此事件来询问服务端响 Nên 是否有效。 Trong trường hợp 此事件handler返回值 Vì `false`, 则此文件将派送`server` Danh mục 型 Của `uploadError`事件。
            * @for  Uploader
            */

            /**
            * @event uploadProgress
            * @param {File} file File Đúng  Voi 
            * @param {Number} percentage 上传进度
            * @description 上传过程 Trong 触发，携带上传进度。
            * @for  Uploader
            */


            /**
            * @event uploadError
            * @param {File} file File Đúng  Voi 
            * @param {String} reason 出错 Của code
            * @description 当文件上传出错时触发。
            * @for  Uploader
            */

            /**
            * @event uploadSuccess
            * @param {File} file File Đúng  Voi 
            * @param {Object} response 服务端返回 Của 数据
            * @description 当文件上传成功时触发。
            * @for  Uploader
            */

            /**
            * @event uploadComplete
            * @param {File} [file] File Đúng  Voi 
            * @description 不管成功 Hoặc 失败，文件上传完成时触发。
            * @for  Uploader
            */

            // 做上传操作。
            _doSend: function (block) {
                var me = this,
                    owner = me.owner,
                    opts = me.options,
                    file = block.file,
                    tr = new Transport(opts),
                    data = $.extend({}, opts.formData),
                    headers = $.extend({}, opts.headers),
                    requestAccept, ret;

                block.transport = tr;

                tr.on('destroy', function () {
                    delete block.transport;
                    me._popBlock(block);
                    Base.nextTick(me.__tick);
                });

                // 广播上传进度。以文件 Vì 单位。
                tr.on('progress', function (percentage) {
                    var totalPercent = 0,
                        uploaded = 0;

                    // 可能没有abort掉，progress还是执行进来了。
                    // if ( !file.blocks ) {
                    //     return;
                    // }

                    totalPercent = block.percentage = percentage;

                    if (block.chunks > 1) {    // 计算文件 Của 整体速度。
                        $.each(file.blocks, function (_, v) {
                            uploaded += (v.percentage || 0) * (v.end - v.start);
                        });

                        totalPercent = uploaded / file.size;
                    }

                    owner.trigger('uploadProgress', file, totalPercent || 0);
                });

                // 用来询问，是否返回 Của 结果是有错误 Của 。
                requestAccept = function (reject) {
                    var fn;

                    ret = tr.getResponseAsJson() || {};
                    ret._raw = tr.getResponse();
                    fn = function (value) {
                        reject = value;
                    };

                    // 服务端响 Nên 了，不代表成功了，询问是否响 Nên 正确。
                    if (!owner.trigger('uploadAccept', block, ret, fn)) {
                        reject = reject || 'server';
                    }

                    return reject;
                };

                // 尝试重试，然后广播文件上传出错。
                tr.on('error', function (type, flag) {
                    block.retried = block.retried || 0;

                    // 自动重试
                    if (block.chunks > 1 && ~'http,abort'.indexOf(type) &&
                            block.retried < opts.chunkRetry) {

                        block.retried++;
                        tr.send();

                    } else {

                        // http status 500 ~ 600
                        if (!flag && type === 'server') {
                            type = requestAccept(type);
                        }

                        file.setStatus(Status.ERROR, type);
                        owner.trigger('uploadError', file, type);
                        owner.trigger('uploadComplete', file);
                    }
                });

                // 上传成功
                tr.on('load', function () {
                    var reason;

                    //  Trong trường hợp 非预期，转向上传出错。
                    if ((reason = requestAccept())) {
                        tr.trigger('error', reason, true);
                        return;
                    }

                    // 全部上传完成。
                    if (file.remaning === 1) {
                        me._finishFile(file, ret);
                    } else {
                        tr.destroy();
                    }
                });

                // 配置 Vỡ nợ  Của 上传字段。
                data = $.extend(data, {
                    id: file.id,
                    name: file.name,
                    type: file.type,
                    lastModifiedDate: file.lastModifiedDate,
                    size: file.size
                });

                block.chunks > 1 && $.extend(data, {
                    chunks: block.chunks,
                    chunk: block.chunk
                });

                //  Trong 发送之间可以添加字段什么 Của 。。。
                //  Trong trường hợp  Vỡ nợ  Của 字段不够 Dùng ，可以通过监听此事件来扩展
                owner.trigger('uploadBeforeSend', block, data, headers);

                // 开始发送。
                tr.appendBlob(opts.fileVal, block.blob, file.name);
                tr.append(data);
                tr.setRequestHeader(headers);
                tr.send();
            },

            // 完成上传。
            _finishFile: function (file, ret, hds) {
                var owner = this.owner;

                return owner
                        .request('after-send-file', arguments, function () {
                            file.setStatus(Status.COMPLETE);
                            owner.trigger('uploadSuccess', file, ret, hds);
                        })
                        .fail(function (reason) {

                            //  Trong trường hợp 外部已经标记 Vì invalid什么 Của ，不再改状态。
                            if (file.getStatus() === Status.PROGRESS) {
                                file.setStatus(Status.ERROR, reason);
                            }

                            owner.trigger('uploadError', file, reason);
                        })
                        .always(function () {
                            owner.trigger('uploadComplete', file);
                        });
            }

        });
    });
    /**
    * @fileOverview 各种验证，包括文件总大小是否超出、单文件是否超出和文件是否重复。
    */

    define('widgets/validator', [
        'base',
        'uploader',
        'file',
        'widgets/widget'
    ], function (Base, Uploader, WUFile) {

        var $ = Base.$,
            validators = {},
            api;

        /**
        * @event error
        * @param {String} type 错误 Danh mục 型。
        * @description 当validate不通过时，会以派送错误事件 Của 形式通知调用者。通过`upload.on('error', handler)`可以捕获到此 Danh mục 错误，目前有以下错误会 Trong 特定 Của 情况下派送错来。
        *
        * * `Q_EXCEED_NUM_LIMIT`  Trong  Thiết lập 了`fileNumLimit`且尝试给`uploader`添加 Của 文件数量超出这个值时派送。
        * * `Q_EXCEED_SIZE_LIMIT`  Trong  Thiết lập 了`Q_EXCEED_SIZE_LIMIT`且尝试给`uploader`添加 Của 文件总大小超出这个值时派送。
        * @for  Uploader
        */

        // 暴露给外面 Của api
        api = {

            // 添加验证器
            addValidator: function (type, cb) {
                validators[type] = cb;
            },

            // 移除验证器
            removeValidator: function (type) {
                delete validators[type];
            }
        };

        //  Trong Uploader初始化 Của 时候启动Validators Của 初始化
        Uploader.register({
            init: function () {
                var me = this;
                Base.nextTick(function () {
                    $.each(validators, function () {
                        this.call(me.owner);
                    });
                });
            }
        });

        /**
        * @property {int} [fileNumLimit=undefined]
        * @namespace options
        * @for Uploader
        * @description 验证文件总数量, 超出则不允许加入队列。
        */
        api.addValidator('fileNumLimit', function () {
            var uploader = this,
                opts = uploader.options,
                count = 0,
                max = parseInt(opts.fileNumLimit, 10),
                flag = true;

            if (!max) {
                return;
            }

            uploader.on('beforeFileQueued', function (file) {

                if (count >= max && flag) {
                    flag = false;
                    this.trigger('error', 'Q_EXCEED_NUM_LIMIT', max, file);
                    setTimeout(function () {
                        flag = true;
                    }, 1);
                }

                return count >= max ? false : true;
            });

            uploader.on('fileQueued', function () {
                count++;
            });

            uploader.on('fileDequeued', function () {
                count--;
            });

            uploader.on('uploadFinished reset', function () {
                count = 0;
            });
        });


        /**
        * @property {int} [fileSizeLimit=undefined]
        * @namespace options
        * @for Uploader
        * @description 验证文件总大小是否超出限制, 超出则不允许加入队列。
        */
        api.addValidator('fileSizeLimit', function () {
            var uploader = this,
                opts = uploader.options,
                count = 0,
                max = opts.fileSizeLimit >> 0,
                flag = true;

            if (!max) {
                return;
            }

            uploader.on('beforeFileQueued', function (file) {
                var invalid = count + file.size > max;

                if (invalid && flag) {
                    flag = false;
                    this.trigger('error', 'Q_EXCEED_SIZE_LIMIT', max, file);
                    setTimeout(function () {
                        flag = true;
                    }, 1);
                }

                return invalid ? false : true;
            });

            uploader.on('fileQueued', function (file) {
                count += file.size;
            });

            uploader.on('fileDequeued', function (file) {
                count -= file.size;
            });

            uploader.on('uploadFinished reset', function () {
                count = 0;
            });
        });

        /**
        * @property {int} [fileSingleSizeLimit=undefined]
        * @namespace options
        * @for Uploader
        * @description 验证单个文件大小是否超出限制, 超出则不允许加入队列。
        */
        api.addValidator('fileSingleSizeLimit', function () {
            var uploader = this,
                opts = uploader.options,
                max = opts.fileSingleSizeLimit;

            if (!max) {
                return;
            }

            uploader.on('beforeFileQueued', function (file) {

                if (file.size > max) {
                    file.setStatus(WUFile.Status.INVALID, 'exceed_size');
                    this.trigger('error', 'F_EXCEED_SIZE', file);
                    return false;
                }

            });

        });

        /**
        * @property {int} [duplicate=undefined]
        * @namespace options
        * @for Uploader
        * @description 去重，  Theo 文件名字、文件大小和最后修改时间来生成hash Key.
        */
        api.addValidator('duplicate', function () {
            var uploader = this,
                opts = uploader.options,
                mapping = {};

            if (opts.duplicate) {
                return;
            }

            function hashString(str) {
                var hash = 0,
                    i = 0,
                    len = str.length,
                    _char;

                for (; i < len; i++) {
                    _char = str.charCodeAt(i);
                    hash = _char + (hash << 6) + (hash << 16) - hash;
                }

                return hash;
            }

            uploader.on('beforeFileQueued', function (file) {
                var hash = file.__hash || (file.__hash = hashString(file.name +
                        file.size + file.lastModifiedDate));

                // 已经重复了
                if (mapping[hash]) {
                    this.trigger('error', 'F_DUPLICATE', file);
                    return false;
                }
            });

            uploader.on('fileQueued', function (file) {
                var hash = file.__hash;

                hash && (mapping[hash] = true);
            });

            uploader.on('fileDequeued', function (file) {
                var hash = file.__hash;

                hash && (delete mapping[hash]);
            });

            uploader.on('reset', function () {
                mapping = {};
            });
        });

        return api;
    });

    /**
    * @fileOverview Runtime管理器，负责Runtime Của 选择, 连接
    */
    define('runtime/compbase', [], function () {

        function CompBase(owner, runtime) {

            this.owner = owner;
            this.options = owner.options;

            this.getRuntime = function () {
                return runtime;
            };

            this.getRuid = function () {
                return runtime.uid;
            };

            this.trigger = function () {
                return owner.trigger.apply(owner, arguments);
            };
        }

        return CompBase;
    });
    /**
    * @fileOverview Html5Runtime
    */
    define('runtime/html5/runtime', [
        'base',
        'runtime/runtime',
        'runtime/compbase'
    ], function (Base, Runtime, CompBase) {

        var type = 'html5',
            components = {};

        function Html5Runtime() {
            var pool = {},
                me = this,
                destory = this.destory;

            Runtime.apply(me, arguments);
            me.type = type;


            // 这个 Phương pháp  Của 调用者，实际上是RuntimeClient
            me.exec = function (comp, fn/*, args...*/) {
                var client = this,
                    uid = client.uid,
                    args = Base.slice(arguments, 2),
                    instance;

                if (components[comp]) {
                    instance = pool[uid] = pool[uid] ||
                            new components[comp](client, me);

                    if (instance[fn]) {
                        return instance[fn].apply(instance, args);
                    }
                }
            };

            me.destory = function () {
                // @todo 删除池子 Trong  Của 所有实例
                return destory && destory.apply(this, arguments);
            };
        }

        Base.inherits(Runtime, {
            constructor: Html5Runtime,

            // 不需要连接其他程序，直接执行callback
            init: function () {
                var me = this;
                setTimeout(function () {
                    me.trigger('ready');
                }, 1);
            }

        });

        // 注册Components
        Html5Runtime.register = function (name, component) {
            var klass = components[name] = Base.inherits(CompBase, component);
            return klass;
        };

        // 注册html5运行时。
        // 只有 Trong 支持 Của 前提下注册。
        if (window.Blob && window.FileReader && window.DataView) {
            Runtime.addRuntime(type, Html5Runtime);
        }

        return Html5Runtime;
    });
    /**
    * @fileOverview Blob Html Hoàn thành 
    */
    define('runtime/html5/blob', [
        'runtime/html5/runtime',
        'lib/blob'
    ], function (Html5Runtime, Blob) {

        return Html5Runtime.register('Blob', {
            slice: function (start, end) {
                var blob = this.owner.source,
                    slice = blob.slice || blob.webkitSlice || blob.mozSlice;

                blob = slice.call(blob, start, end);

                return new Blob(this.getRuid(), blob);
            }
        });
    });
    /**
    * @fileOverview FilePaste
    */
    define('runtime/html5/dnd', [
        'base',
        'runtime/html5/runtime',
        'lib/file'
    ], function (Base, Html5Runtime, File) {

        var $ = Base.$,
            prefix = 'webuploader-dnd-';

        return Html5Runtime.register('DragAndDrop', {
            init: function () {
                var elem = this.elem = this.options.container;

                this.dragEnterHandler = Base.bindFn(this._dragEnterHandler, this);
                this.dragOverHandler = Base.bindFn(this._dragOverHandler, this);
                this.dragLeaveHandler = Base.bindFn(this._dragLeaveHandler, this);
                this.dropHandler = Base.bindFn(this._dropHandler, this);
                this.dndOver = false;

                elem.on('dragenter', this.dragEnterHandler);
                elem.on('dragover', this.dragOverHandler);
                elem.on('dragleave', this.dragLeaveHandler);
                elem.on('drop', this.dropHandler);

                if (this.options.disableGlobalDnd) {
                    $(document).on('dragover', this.dragOverHandler);
                    $(document).on('drop', this.dropHandler);
                }
            },

            _dragEnterHandler: function (e) {
                var me = this,
                    denied = me._denied || false,
                    items;

                e = e.originalEvent || e;

                if (!me.dndOver) {
                    me.dndOver = true;

                    // 注意只有 chrome 支持。
                    items = e.dataTransfer.items;

                    if (items && items.length) {
                        me._denied = denied = !me.trigger('accept', items);
                    }

                    me.elem.addClass(prefix + 'over');
                    me.elem[denied ? 'addClass' :
                            'removeClass'](prefix + 'denied');
                }

                e.dataTransfer.dropEffect = denied ? 'none' : 'copy';

                return false;
            },

            _dragOverHandler: function (e) {
                // 只处理框内 Của 。
                var parentElem = this.elem.parent().get(0);
                if (parentElem && !$.contains(parentElem, e.currentTarget)) {
                    return false;
                }

                clearTimeout(this._leaveTimer);
                this._dragEnterHandler.call(this, e);

                return false;
            },

            _dragLeaveHandler: function () {
                var me = this,
                    handler;

                handler = function () {
                    me.dndOver = false;
                    me.elem.removeClass(prefix + 'over ' + prefix + 'denied');
                };

                clearTimeout(me._leaveTimer);
                me._leaveTimer = setTimeout(handler, 100);
                return false;
            },

            _dropHandler: function (e) {
                var me = this,
                    ruid = me.getRuid(),
                    parentElem = me.elem.parent().get(0),
                    dataTransfer, data;

                // 只处理框内 Của 。
                if (parentElem && !$.contains(parentElem, e.currentTarget)) {
                    return false;
                }

                e = e.originalEvent || e;
                dataTransfer = e.dataTransfer;

                //  Trong trường hợp 是页面内拖拽，还不能处理，不阻止事件。
                // 此处 ie11 下会报参数错误，
                try {
                    data = dataTransfer.getData('text/html');
                } catch (err) {
                }

                if (data) {
                    return;
                }

                me._getTansferFiles(dataTransfer, function (results) {
                    me.trigger('drop', $.map(results, function (file) {
                        return new File(ruid, file);
                    }));
                });

                me.dndOver = false;
                me.elem.removeClass(prefix + 'over');
                return false;
            },

            //  Trong trường hợp 传入 callback 则去查看文件夹， Nếu không thì 只管当前文件夹。
            _getTansferFiles: function (dataTransfer, callback) {
                var results = [],
                    promises = [],
                    items, files, file, item, i, len, canAccessFolder;

                items = dataTransfer.items;
                files = dataTransfer.files;

                canAccessFolder = !!(items && items[0].webkitGetAsEntry);

                for (i = 0, len = files.length; i < len; i++) {
                    file = files[i];
                    item = items && items[i];

                    if (canAccessFolder && item.webkitGetAsEntry().isDirectory) {

                        promises.push(this._traverseDirectoryTree(
                                item.webkitGetAsEntry(), results));
                    } else {
                        results.push(file);
                    }
                }

                Base.when.apply(Base, promises).done(function () {

                    if (!results.length) {
                        return;
                    }

                    callback(results);
                });
            },

            _traverseDirectoryTree: function (entry, results) {
                var deferred = Base.Deferred(),
                    me = this;

                if (entry.isFile) {
                    entry.file(function (file) {
                        results.push(file);
                        deferred.resolve();
                    });
                } else if (entry.isDirectory) {
                    entry.createReader().readEntries(function (entries) {
                        var len = entries.length,
                            promises = [],
                            arr = [],    //  Vì 了保证顺序。
                            i;

                        for (i = 0; i < len; i++) {
                            promises.push(me._traverseDirectoryTree(
                                    entries[i], arr));
                        }

                        Base.when.apply(Base, promises).then(function () {
                            results.push.apply(results, arr);
                            deferred.resolve();
                        }, deferred.reject);
                    });
                }

                return deferred.promise();
            },

            destroy: function () {
                var elem = this.elem;

                elem.off('dragenter', this.dragEnterHandler);
                elem.off('dragover', this.dragEnterHandler);
                elem.off('dragleave', this.dragLeaveHandler);
                elem.off('drop', this.dropHandler);

                if (this.options.disableGlobalDnd) {
                    $(document).off('dragover', this.dragOverHandler);
                    $(document).off('drop', this.dropHandler);
                }
            }
        });
    });

    /**
    * @fileOverview FilePaste
    */
    define('runtime/html5/filepaste', [
        'base',
        'runtime/html5/runtime',
        'lib/file'
    ], function (Base, Html5Runtime, File) {

        return Html5Runtime.register('FilePaste', {
            init: function () {
                var opts = this.options,
                    elem = this.elem = opts.container,
                    accept = '.*',
                    arr, i, len, item;

                // accetp Của mimeTypes Trong 生成匹配正则。
                if (opts.accept) {
                    arr = [];

                    for (i = 0, len = opts.accept.length; i < len; i++) {
                        item = opts.accept[i].mimeTypes;
                        item && arr.push(item);
                    }

                    if (arr.length) {
                        accept = arr.join(',');
                        accept = accept.replace(/,/g, '|').replace(/\*/g, '.*');
                    }
                }
                this.accept = accept = new RegExp(accept, 'i');
                this.hander = Base.bindFn(this._pasteHander, this);
                elem.on('paste', this.hander);
            },

            _pasteHander: function (e) {
                var allowed = [],
                    ruid = this.getRuid(),
                    items, item, blob, i, len;

                e = e.originalEvent || e;
                items = e.clipboardData.items;

                for (i = 0, len = items.length; i < len; i++) {
                    item = items[i];

                    if (item.kind !== 'file' || !(blob = item.getAsFile())) {
                        continue;
                    }

                    allowed.push(new File(ruid, blob));
                }

                if (allowed.length) {
                    // 不阻止非文件粘贴（文字粘贴） Của 事件冒泡
                    e.preventDefault();
                    e.stopPropagation();
                    this.trigger('paste', allowed);
                }
            },

            destroy: function () {
                this.elem.off('paste', this.hander);
            }
        });
    });

    /**
    * @fileOverview FilePicker
    */
    define('runtime/html5/filepicker', [
        'base',
        'runtime/html5/runtime'
    ], function (Base, Html5Runtime) {

        var $ = Base.$;

        return Html5Runtime.register('FilePicker', {
            init: function () {
                var container = this.getRuntime().getContainer(),
                    me = this,
                    owner = me.owner,
                    opts = me.options,
                    lable = $(document.createElement('label')),
                    input = $(document.createElement('input')),
                    arr, i, len, mouseHandler;

                input.attr('type', 'file');
                input.attr('name', opts.name);
                input.addClass('webuploader-element-invisible');

                lable.on('click', function () {
                    input.trigger('click');
                });

                lable.css({
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    cursor: 'pointer',
                    background: '#ffffff'
                });

                if (opts.multiple) {
                    input.attr('multiple', 'multiple');
                }

                // @todo Firefox不支持单独指定后缀
                if (opts.accept && opts.accept.length > 0) {
                    arr = [];

                    for (i = 0, len = opts.accept.length; i < len; i++) {
                        arr.push(opts.accept[i].mimeTypes);
                    }

                    input.attr('accept', arr.join(','));
                }

                container.append(input);
                container.append(lable);

                mouseHandler = function (e) {
                    owner.trigger(e.type);
                };

                input.on('change', function (e) {
                    var fn = arguments.callee,
                        clone;

                    me.files = e.target.files;

                    // reset input
                    clone = this.cloneNode(true);
                    clone.value = null;
                    this.parentNode.replaceChild(clone, this);

                    input.off();
                    input = $(clone).on('change', fn)
                            .on('mouseenter mouseleave', mouseHandler);

                    owner.trigger('change');
                });

                lable.on('mouseenter mouseleave', mouseHandler);

            },


            getFiles: function () {
                return this.files;
            },

            destroy: function () {
                // todo
            }
        });
    });
    /**
    * @fileOverview Transport
    * @todo 支持chunked传输，优势：
    * 可以将大文件分成小块，挨个传输，可以提高大文件成功率，当失败 Của 时候，也只需要重传那小部分，
    * 而不需要重头再传一次。另外断点续传也需要用chunked方式。
    */
    define('runtime/html5/transport', [
        'base',
        'runtime/html5/runtime'
    ], function (Base, Html5Runtime) {

        var noop = Base.noop,
            $ = Base.$;

        return Html5Runtime.register('Transport', {
            init: function () {
                this._status = 0;
                this._response = null;
            },

            send: function () {
                var owner = this.owner,
                    opts = this.options,
                    xhr = this._initAjax(),
                    blob = owner._blob,
                    server = opts.server,
                    formData, binary, fr;

                if (opts.sendAsBinary) {
                    server += (/\?/.test(server) ? '&' : '?') +
                            $.param(owner._formData);

                    binary = blob.getSource();
                } else {
                    formData = new FormData();
                    $.each(owner._formData, function (k, v) {
                        formData.append(k, v);
                    });

                    formData.append(opts.fileVal, blob.getSource(),
                            opts.filename || owner._formData.name || '');
                }

                if (opts.withCredentials && 'withCredentials' in xhr) {
                    xhr.open(opts.method, server, true);
                    xhr.withCredentials = true;
                } else {
                    xhr.open(opts.method, server);
                }

                this._setRequestHeader(xhr, opts.headers);

                if (binary) {
                    xhr.overrideMimeType('application/octet-stream');

                    // android直接发送blob会导致服务端接收到 Của 是空文件。
                    // bug详情。
                    // https://code.google.com/p/android/issues/detail?id=39882
                    // 所以先用fileReader读取出来再通过arraybuffer Của 方式发送。
                    if (Base.os.android) {
                        fr = new FileReader();

                        fr.onload = function () {
                            xhr.send(this.result);
                            fr = fr.onload = null;
                        };

                        fr.readAsArrayBuffer(binary);
                    } else {
                        xhr.send(binary);
                    }
                } else {
                    xhr.send(formData);
                }
            },

            getResponse: function () {
                return this._response;
            },

            getResponseAsJson: function () {
                return this._parseJson(this._response);
            },

            getStatus: function () {
                return this._status;
            },

            abort: function () {
                var xhr = this._xhr;

                if (xhr) {
                    xhr.upload.onprogress = noop;
                    xhr.onreadystatechange = noop;
                    xhr.abort();

                    this._xhr = xhr = null;
                }
            },

            destroy: function () {
                this.abort();
            },

            _initAjax: function () {
                var me = this,
                    xhr = new XMLHttpRequest(),
                    opts = this.options;

                if (opts.withCredentials && !('withCredentials' in xhr) &&
                        typeof XDomainRequest !== 'undefined') {
                    xhr = new XDomainRequest();
                }

                xhr.upload.onprogress = function (e) {
                    var percentage = 0;

                    if (e.lengthComputable) {
                        percentage = e.loaded / e.total;
                    }

                    return me.trigger('progress', percentage);
                };

                xhr.onreadystatechange = function () {

                    if (xhr.readyState !== 4) {
                        return;
                    }

                    xhr.upload.onprogress = noop;
                    xhr.onreadystatechange = noop;
                    me._xhr = null;
                    me._status = xhr.status;

                    if (xhr.status >= 200 && xhr.status < 300) {
                        me._response = xhr.responseText;
                        return me.trigger('load');
                    } else if (xhr.status >= 500 && xhr.status < 600) {
                        me._response = xhr.responseText;
                        return me.trigger('error', 'server');
                    }


                    return me.trigger('error', me._status ? 'http' : 'abort');
                };

                me._xhr = xhr;
                return xhr;
            },

            _setRequestHeader: function (xhr, headers) {
                $.each(headers, function (key, val) {
                    xhr.setRequestHeader(key, val);
                });
            },

            _parseJson: function (str) {
                var json;

                try {
                    json = JSON.parse(str);
                } catch (ex) {
                    json = {};
                }

                return json;
            }
        });
    });
    /**
    * @fileOverview FlashRuntime
    */
    define('runtime/flash/runtime', [
        'base',
        'runtime/runtime',
        'runtime/compbase'
    ], function (Base, Runtime, CompBase) {

        var $ = Base.$,
            type = 'flash',
            components = {};


        function getFlashVersion() {
            var version;

            try {
                version = navigator.plugins['Shockwave Flash'];
                version = version.description;
            } catch (ex) {
                try {
                    version = new ActiveXObject('ShockwaveFlash.ShockwaveFlash')
                            .GetVariable('$version');
                } catch (ex2) {
                    version = '0.0';
                }
            }
            version = version.match(/\d+/g);
            return parseFloat(version[0] + '.' + version[1], 10);
        }

        function FlashRuntime() {
            var pool = {},
                clients = {},
                destory = this.destory,
                me = this,
                jsreciver = Base.guid('webuploader_');

            Runtime.apply(me, arguments);
            me.type = type;


            // 这个 Phương pháp  Của 调用者，实际上是RuntimeClient
            me.exec = function (comp, fn/*, args...*/) {
                var client = this,
                    uid = client.uid,
                    args = Base.slice(arguments, 2),
                    instance;

                clients[uid] = client;

                if (components[comp]) {
                    if (!pool[uid]) {
                        pool[uid] = new components[comp](client, me);
                    }

                    instance = pool[uid];

                    if (instance[fn]) {
                        return instance[fn].apply(instance, args);
                    }
                }

                return me.flashExec.apply(client, arguments);
            };

            function handler(evt, obj) {
                var type = evt.type || evt,
                    parts, uid;

                parts = type.split('::');
                uid = parts[0];
                type = parts[1];

                // console.log.apply( console, arguments );

                if (type === 'Ready' && uid === me.uid) {
                    me.trigger('ready');
                } else if (clients[uid]) {
                    clients[uid].trigger(type.toLowerCase(), evt, obj);
                }

                // Base.log( evt, obj );
            }

            // flash Của 接受器。
            window[jsreciver] = function () {
                var args = arguments;

                //  Vì 了能捕获得到。
                setTimeout(function () {
                    handler.apply(null, args);
                }, 1);
            };

            this.jsreciver = jsreciver;

            this.destory = function () {
                // @todo 删除池子 Trong  Của 所有实例
                return destory && destory.apply(this, arguments);
            };

            this.flashExec = function (comp, fn) {
                var flash = me.getFlash(),
                    args = Base.slice(arguments, 2);

                return flash.exec(this.uid, comp, fn, args);
            };

            // @todo
        }

        Base.inherits(Runtime, {
            constructor: FlashRuntime,

            init: function () {
                var container = this.getContainer(),
                    opts = this.options,
                    html;

                // if not the minimal height, shims are not initialized
                // in older browsers (e.g FF3.6, IE6,7,8, Safari 4.0,5.0, etc)
                container.css({
                    position: 'absolute',
                    top: '-8px',
                    left: '-8px',
                    width: '9px',
                    height: '9px',
                    overflow: 'hidden'
                });

                // insert flash object
                html = '<object id="' + this.uid + '" type="application/' +
                        'x-shockwave-flash" data="' + opts.swf + '" ';

                if (Base.browser.ie) {
                    html += 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" ';
                }

                html += 'width="100%" height="100%" style="outline:0">' +
                    '<param name="movie" value="' + opts.swf + '" />' +
                    '<param name="flashvars" value="uid=' + this.uid +
                    '&jsreciver=' + this.jsreciver + '" />' +
                    '<param name="wmode" value="transparent" />' +
                    '<param name="allowscriptaccess" value="always" />' +
                '</object>';

                container.html(html);
            },

            getFlash: function () {
                if (this._flash) {
                    return this._flash;
                }

                this._flash = $('#' + this.uid).get(0);
                return this._flash;
            }

        });

        FlashRuntime.register = function (name, component) {
            component = components[name] = Base.inherits(CompBase, $.extend({

                // @todo fix this later
                flashExec: function () {
                    var owner = this.owner,
                        runtime = this.getRuntime();

                    return runtime.flashExec.apply(owner, arguments);
                }
            }, component));

            return component;
        };

        if (getFlashVersion() >= 11.4) {
            Runtime.addRuntime(type, FlashRuntime);
        }

        return FlashRuntime;
    });
    /**
    * @fileOverview FilePicker
    */
    define('runtime/flash/filepicker', [
        'base',
        'runtime/flash/runtime'
    ], function (Base, FlashRuntime) {
        var $ = Base.$;

        return FlashRuntime.register('FilePicker', {
            init: function (opts) {
                var copy = $.extend({}, opts),
                    len, i;

                // 修复Flash再没有 Thiết lập title Của 情况下无法弹出flash文件选择框 Của bug.
                len = copy.accept && copy.accept.length;
                for (i = 0; i < len; i++) {
                    if (!copy.accept[i].title) {
                        copy.accept[i].title = 'Files';
                    }
                }

                delete copy.button;
                delete copy.id;
                delete copy.container;

                this.flashExec('FilePicker', 'init', copy);
            },

            destroy: function () {
                // todo
            }
        });
    });
    /**
    * @fileOverview  Transport flash Hoàn thành 
    */
    define('runtime/flash/transport', [
        'base',
        'runtime/flash/runtime',
        'runtime/client'
    ], function (Base, FlashRuntime, RuntimeClient) {
        var $ = Base.$;

        return FlashRuntime.register('Transport', {
            init: function () {
                this._status = 0;
                this._response = null;
                this._responseJson = null;
            },

            send: function () {
                var owner = this.owner,
                    opts = this.options,
                    xhr = this._initAjax(),
                    blob = owner._blob,
                    server = opts.server,
                    binary;

                xhr.connectRuntime(blob.ruid);

                if (opts.sendAsBinary) {
                    server += (/\?/.test(server) ? '&' : '?') +
                            $.param(owner._formData);

                    binary = blob.uid;
                } else {
                    $.each(owner._formData, function (k, v) {
                        xhr.exec('append', k, v);
                    });

                    xhr.exec('appendBlob', opts.fileVal, blob.uid,
                            opts.filename || owner._formData.name || '');
                }

                this._setRequestHeader(xhr, opts.headers);
                xhr.exec('send', {
                    method: opts.method,
                    url: server,
                    mimeType: 'application/octet-stream'
                }, binary);
            },

            getStatus: function () {
                return this._status;
            },

            getResponse: function () {
                return this._response || '';
            },

            getResponseAsJson: function () {
                return this._responseJson;
            },

            abort: function () {
                var xhr = this._xhr;

                if (xhr) {
                    xhr.exec('abort');
                    xhr.destroy();
                    this._xhr = xhr = null;
                }
            },

            destroy: function () {
                this.abort();
            },

            _initAjax: function () {
                var me = this,
                    xhr = new RuntimeClient('XMLHttpRequest');

                xhr.on('uploadprogress progress', function (e) {
                    var percent = e.loaded / e.total;
                    percent = Math.min(1, Math.max(0, percent));
                    return me.trigger('progress', percent);
                });

                xhr.on('load', function () {
                    var status = xhr.exec('getStatus'),
                        err = '';

                    xhr.off();
                    me._xhr = null;

                    if (status >= 200 && status < 300) {
                        me._response = xhr.exec('getResponse');
                        me._responseJson = xhr.exec('getResponseAsJson');
                    } else if (status >= 500 && status < 600) {
                        me._response = xhr.exec('getResponse');
                        me._responseJson = xhr.exec('getResponseAsJson');
                        err = 'server';
                    } else {
                        err = 'http';
                    }

                    me._response = decodeURIComponent(me._response);
                    xhr.destroy();
                    xhr = null;

                    return err ? me.trigger('error', err) : me.trigger('load');
                });

                xhr.on('error', function () {
                    xhr.off();
                    me._xhr = null;
                    me.trigger('error', 'http');
                });

                me._xhr = xhr;
                return xhr;
            },

            _setRequestHeader: function (xhr, headers) {
                $.each(headers, function (key, val) {
                    xhr.exec('setRequestHeader', key, val);
                });
            }
        });
    });
    /**
    * @fileOverview 没有图像处理 Của 版本。
    */
    define('preset/withoutimage', [
        'base',

    // widgets
        'widgets/filednd',
        'widgets/filepaste',
        'widgets/filepicker',
        'widgets/queue',
        'widgets/runtime',
        'widgets/upload',
        'widgets/validator',

    // runtimes
    // html5
        'runtime/html5/blob',
        'runtime/html5/dnd',
        'runtime/html5/filepaste',
        'runtime/html5/filepicker',
        'runtime/html5/transport',

    // flash
        'runtime/flash/filepicker',
        'runtime/flash/transport'
    ], function (Base) {
        return Base;
    });
    define('webuploader', [
        'preset/withoutimage'
    ], function (preset) {
        return preset;
    });
    return require('webuploader');
});
