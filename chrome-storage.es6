(function ( factory ) {
    if ( 'function' === typeof define && define.amd ) {
        define( [] , factory );
    } else if ( 'undefined' !== typeof module && module.exports ) {
        module.exports = factory();
    } else if ( 'undefined' !== typeof angular && 'function' === typeof angular.module ) {
        angular.module( 'ChromeStorage' , [] ).constant( 'ChormeStorage' , factory() );
    } else {
        window.chromeStorage = factory();
    }
}( function () {
    const { storage , runtime } = chrome ,
          changeCallbacks = [];

    let context        = 'local' ,
        defaultStorage = storage[ context ];

    const module = {

        /**
         * 封装一层获取方法
         * @param {Object|String[]|String} keys - 可以是一个对象：{ key1:'null', key2:'' }；也可以是一个数组：['key1','key2']；也可以是一个字符串：'key'
         * @param {String} [area]
         * @returns {Promise}
         */
        get ( keys , area ) {
            return new Promise( ( resolve , rejact ) => {
                getCurrentStorage( area ).get( keys , function ( items ) {
                    const err = runtime.lastError;
                    if ( err ) {
                        rejact( err );
                    } else {
                        resolve( items );
                    }
                } );
            } );
        } ,

        /**
         * 获取存储区域的所有数据
         * @param {String} [area]
         */
        getAll ( area ) {
            return module.get( null , area );
        } ,

        /**
         * 封装一层设置方法
         * @param {Object|String} key - 如果传了 value 参数，那么它只能是字符串
         * @param {*} [value] - 当以  .set('key', value) 的形式调用时，key 只能是一个字符串
         * @param {String} [area]
         * @returns {Promise}
         */
        set ( key , value , area ) {
            let obj;
            if ( 'object' === typeof key ) {
                obj = key;
                area = value;
            } else {
                obj = {};
                obj[ key ] = value;
            }
            return new Promise( ( resolve , reject ) => {
                getCurrentStorage( area ).set( obj , function () {
                    var err = runtime.lastError;
                    if ( err ) {
                        reject( err );
                    } else {
                        resolve();
                    }
                } );
            } );
        } ,

        /**
         * 封装一层删除方法
         * @param {Object|String[]|String} keys - 可以是一个对象：{ key1:'null', key2:'' }；也可以是一个数组：['key1','key2']；也可以是一个字符串：'key'
         * @param {String} [area]
         * @returns {Promise}
         */
            remove ( keys , area ) {
            return new Promise( ( resolve , reject ) => {
                getCurrentStorage( area ).remove( keys , function ( items ) {
                    const err = runtime.lastError;
                    if ( err ) {
                        reject( err );
                    } else {
                        resolve( items );
                    }
                } );
            } );
        } ,

        /**
         * 封装一层 clear 方法
         * @param {String} [area]
         * @returns Promise
         */
            clear ( area ) {
            return new Promise( ( resolve , reject ) => {
                getCurrentStorage( area ).clear( () => {
                    const err = runtime.lastError;
                    if ( err ) {
                        reject( err );
                    } else {
                        resolve();
                    }
                } );
            } );
        } ,

        /**
         * 获取当前的默认存储区域
         * @returns {String}
         */
        get defaultArea() {
            return context;
        } ,

        /**
         * 设置当前的默认存储区域
         * @param {String} area
         */
        set defaultArea( area ) {
            noAreaError( area );
            context = area;
            defaultStorage = storage[ context ];
        } ,

        /**
         * 注册 change 事件。
         * 注意，回调里面的第一个参数仅包含最新值，
         * 而不是一个有newValue和oldValue的对象。
         * 见下面的事件监听函数。
         * @param {Function} listener
         * @param {String[]} [caseOf] - 关心哪些设置。如果changes里面没有任何一个在 caseOf 对象里列出的 key ，就不会触发事件
         * @returns {Function} 最后实际生成的监听函数
         */
            addChangeListener ( listener , caseOf ) {
            var cb;
            if ( Array.isArray( caseOf ) ) {
                cb = function ( changes , area ) {
                    const myChanges = {};

                    for ( let key in changes ) {
                        if ( caseOf.indexOf( key ) >= 0 ) {
                            myChanges[ key ] = changes[ key ];
                        }
                    }

                    for ( let hasMyChange in myChanges ) {
                        listener( myChanges , area );
                        break;
                    }
                };
            } else {
                cb = listener;
            }
            changeCallbacks.push( cb );
            return cb;
        } ,

        /**
         * 删除一个监听函数
         * @param {Function} listener
         */
            removeChangeListener ( listener ) {
            const index = changeCallbacks.indexOf( listener );
            if ( index >= 0 ) {
                changeCallbacks.splice( index , 1 );
            }
        }
    };

    storage.onChanged.addListener( function ( changes , area ) {
        const customChanges = {};

        for ( let key in changes ) {
            customChanges[ key ] = changes[ key ].newValue;
        }

        // 防止对象在回调里被修改，因为这会导致其它回调也收到修改后的对象
        changeCallbacks.forEach( ( listener ) => {
            listener( Object.freeze( customChanges ) , area );
        } );
    } );

    return module;

    /**
     * 获取默认的存储空间
     * @param {String} [area]
     * @returns {*}
     */
    function getCurrentStorage( area ) {
        let currentStorage;
        if ( undefined === area ) {
            currentStorage = defaultStorage;
        } else {
            noAreaError( area );
            currentStorage = storage[ area ];
        }
        return currentStorage;
    }

    function noAreaError( area ) {
        if ( !storage[ area ] ) {
            throw new Error( 'chrome.storage 不支持 ' + area + ' 存储区域。' );
        }
    }
} ));
