# chrome.storage 库

一个对 chrome.storage 的简单包装库。

## 特点

 + 不依赖任何第三方库
 + 支持 RequireJS/Browserify/AngularJS 及普通脚本加载方式；
 + 所有接口一律返回 Promise
 + 灵活的存储区域设置

## 安装

 1. 结合 RequireJS 使用
 ```js
 require('path/to/chrome-storage.js',function(chromeStorage){
     // ...
 });
 ```
 2. 结合 Browserify 使用
 ```js
 var chromeStorage = require('path/to/chrome-storage.js')
 ```
 3. 结合 AngularJS 使用
 ```js
 angular.module('MyApp',['ChromeStorage'])
 .config(['ChromeStorage',function(chromeStorage){
     // ...
 }]);
 ```
 4. 普通脚本加载方式
 ```html
 <script src="path/to/chrome-storage.js"></script>
 <script>console.dir(chromeStorage)</script>
 ```

## 使用
