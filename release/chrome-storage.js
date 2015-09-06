/*!
 * chrome-storage.js
 * https://github.com/lmk123/chrome-storage-wrapper
 *
 * Version: 0.1.0
 * Author: Milk Lee <me@limingkai.cn>
 * Release under MIT license.
 */
'use strict';

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

    var module = Object.defineProperties({

        /**
         * 封装一层获取方法
         * @param {Object|String[]|String} keys - 可以是一个对象：{ key1:'null', key2:''}；也可以是一个数组：['key1','key2']；也可以是一个字符串：'key'
         * @param {String} [area]
         * @returns {Promise}
         */
        get: function get(keys, area) {
            return new Promise(function (resolve, rejact) {
                getCurrentStorage(area).get(keys, function (items) {
                    var err = runtime.lastError;
                    if (err) {
                        rejact(err);
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
            if ('object' === typeof key) {
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
         * @param {Function} listener
         */
        removeChangeListener: function removeChangeListener(listener) {
            var index = changeCallbacks.indexOf(listener);
            if (index >= 0) {
                changeCallbacks.splice(index, 1);
            }
        }
    }, {
        defaultArea: { /**
                        * 获取当前的默认存储区域
                        * @returns {String}
                        */

            get: function get() {
                return context;
            },

            /**
             * 设置当前的默认存储区域
             * @param {String} area
             */
            set: function set(area) {
                noAreaError(area);
                context = area;
                defaultStorage = storage[context];
            },
            configurable: true,
            enumerable: true
        }
    });

    storage.onChanged.addListener(function (changes, area) {
        var customChanges = {};

        for (var key in changes) {
            customChanges[key] = changes[key].newValue;
        }

        // 防止对象在回调里被修改，因为这会导致其它回调也收到修改后的对象
        changeCallbacks.forEach(function (listener) {
            listener(Object.freeze(customChanges), area);
        });
    });

    return module;

    /**
     * 获取默认的存储空间
     * @param {String} [area]
     * @returns {*}
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

    function noAreaError(area) {
        if (!storage[area]) {
            throw new Error('chrome.storage 不支持 ' + area + ' 存储区域。');
        }
    }
});