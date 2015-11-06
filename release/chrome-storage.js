'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

/*!
 * chrome-storage.js
 * https://github.com/lmk123/chrome-storage-wrapper
 *
 * Version: 0.1.0
 * Author: Milk Lee <me@limingkai.cn>
 * Release under MIT license.
 */
(function (factory) {
  if ('function' === typeof define && define.amd) {
    define([], factory);
  } else if ('undefined' !== typeof module && module.exports) {
    module.exports = factory();
  } else {
    window.chromeStorage = factory();
  }
})(function () {
  var _chrome = chrome;
  var storage = _chrome.storage;
  var runtime = _chrome.runtime;
  var changeCallbacks = [];

  var context = 'local',
      defaultStorage = storage[context];

  var module = {

    /**
     * 封装一层获取方法
     * @param {Object|String[]|String} keys - 可以是一个对象：{ key1:'null', key2:''}；也可以是一个数组：['key1','key2']；也可以是一个字符串：'key'
     * @param {String} [area]
     * @returns {Promise}
     */

    get: function get(keys, area) {
      return new Promise(function (resolve, reject) {
        getCurrentStorage(area).get(keys, function (items) {
          var err = runtime.lastError;
          if (err) {
            reject(err);
          } else {
            resolve(items);
          }
        });
      });
    },

    /**
     * 获取存储区域的所有数据
     * @param {String} [area]
     */
    getAll: function getAll(area) {
      return module.get(null, area);
    },

    /**
     * 封装一层设置方法
     * @param {Object|String} key - 如果传了 value 参数，那么它只能是字符串
     * @param {*} [value] - 当以  .set('key', value) 的形式调用时，key 只能是一个字符串
     * @param {String} [area]
     * @returns {Promise}
     */
    set: function set(key, value, area) {
      var obj = undefined;
      if ('object' === (typeof key === 'undefined' ? 'undefined' : _typeof(key))) {
        obj = key;
        area = value;
      } else {
        obj = {};
        obj[key] = value;
      }
      return new Promise(function (resolve, reject) {
        getCurrentStorage(area).set(obj, function () {
          var err = runtime.lastError;
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },

    /**
     * 封装一层删除方法
     * @param {Object|String[]|String} keys - 可以是一个对象：{ key1:'null', key2:''}；也可以是一个数组：['key1','key2']；也可以是一个字符串：'key'
     * @param {String} [area]
     * @returns {Promise}
     */
    remove: function remove(keys, area) {
      return new Promise(function (resolve, reject) {
        getCurrentStorage(area).remove(keys, function (items) {
          var err = runtime.lastError;
          if (err) {
            reject(err);
          } else {
            resolve(items);
          }
        });
      });
    },

    /**
     * 封装一层 clear 方法
     * @param {String} [area]
     * @returns Promise
     */
    clear: function clear(area) {
      return new Promise(function (resolve, reject) {
        getCurrentStorage(area).clear(function () {
          var err = runtime.lastError;
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },

    /**
     * 获取当前的默认存储区域
     * @returns {String}
     */
    get defaultArea() {
      return context;
    },

    /**
     * 设置当前的默认存储区域
     * @param {String} area
     */
    set defaultArea(area) {
      noAreaError(area);
      context = area;
      defaultStorage = storage[context];
    },

    /**
     * 注册 change 事件。
     * 注意，回调里面的第一个参数仅包含最新值，
     * 而不是一个有newValue和oldValue的对象。
     * 见下面的事件监听函数。
     * @param {Function} listener
     * @param [options]
     * @param {String[]} [options.keys] - 关心哪些键的变化
     * @param {String[]} [options.areas] - 关心哪些存储区域的变化
     * @returns {Function} 最后实际生成的监听函数
     */
    addChangeListener: function addChangeListener(listener, options) {

      if (!options) {
        options = {};
      }

      var _options = options;
      var keys = _options.keys;
      var areas = _options.areas;var newListener = undefined;

      if ('string' === typeof keys) {
        keys = [keys];
      }

      if ('string' === typeof areas) {
        areas = [areas];
      }

      newListener = function (changes, area) {
        if (Array.isArray(areas)) {
          if (areas.indexOf(area) < 0) {
            return;
          }
        }

        var keysIsArray = Array.isArray(keys),
            myChanges = {};

        for (var key in changes) {
          if (!keysIsArray || keys.indexOf(key) >= 0) {
            myChanges[key] = changes[key];
          }
        }

        for (var hasMyChange in myChanges) {
          listener(myChanges, area);
          break;
        }
      };
      changeCallbacks.push(newListener);
      return newListener;
    },

    /**
     * 删除一个监听函数
     * @param {Function} newListener
     */
    removeChangeListener: function removeChangeListener(newListener) {
      var index = changeCallbacks.indexOf(newListener);
      if (index >= 0) {
        changeCallbacks.splice(index, 1);
      }
    },

    /**
     * 在存储区域间同步数据
     * @param {String} [from]
     * @param {String} [to]
     * @returns {Promise}
     */
    sync: function sync() {
      var from = arguments.length <= 0 || arguments[0] === undefined ? 'local' : arguments[0];
      var to = arguments.length <= 1 || arguments[1] === undefined ? 'sync' : arguments[1];

      return Promise.all([module.getAll(from), module.clear(to)]).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 1);

        var data = _ref2[0];
        return module.set(data, to);
      });
    }
  };

  storage.onChanged.addListener(function (changes, area) {
    var customChanges = {};

    for (var key in changes) {
      customChanges[key] = changes[key].newValue;
    }

    changeCallbacks.forEach(function (newListener) {
      newListener(customChanges, area);
    });
  });

  return module;

  /**
   * 获取默认的存储空间
   * @param {String} [area]
   * @returns {chrome.storage.StorageArea}
   */
  function getCurrentStorage(area) {
    var currentStorage = undefined;
    if (undefined === area) {
      currentStorage = defaultStorage;
    } else {
      noAreaError(area);
      currentStorage = storage[area];
    }
    return currentStorage;
  }

  /**
   * 如果没有指定的存储区域则报错
   * @param {String} area
   */
  function noAreaError(area) {
    if (!storage[area]) {
      throw new Error('chrome.storage 不支持 ' + area + ' 存储区域。');
    }
  }
});

//# sourceMappingURL=chrome-storage.js.map