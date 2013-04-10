// Compiled with multi-compiler 0.0.1-beta by Jan Święcki
// Using:
//   coco 0.8.1 by satyr, http://satyr.github.com/coco/
//   uglify-js 1.3.3 by Mihai Bazon, git@github.com:mishoo/UglifyJS.git
//   regexp-quote 0.0.0 by Daniel Brockman, https://github.com/dbrock/node-regexp-quote
//   colors 0.6.0-1 by Marak Squires, http://github.com/Marak/colors.js.git
//   multi-compiler 0.0.1-beta by Jan Święcki, https://github.com/jan-swiecki/multi-compiler
// 
// Compile time: 2013-04-10T21:13:05.777Z
// 
// Options: compile
//
// This file depends on:
//   colors 0.6.0-1 by Marak Squires, http://github.com/Marak/colors.js.git
//   callsite 1.0.0 by TJ Holowaychuk
// 
(function(){
  var exec, PATH, fs, colors, crypto, stack, l, resolveCalledFilename, sha1, hashSums, fileWatchers, headStr, onFileChange, onFileChange2;
  exec = require('child_process').exec;
  PATH = require('path');
  fs = require('fs');
  colors = require('colors');
  crypto = require('crypto');
  stack = require('callsite');
  l = function(it){
    return console.log("--".yellow.bold, it);
  };
  resolveCalledFilename = (function(){
    var MODULE;
    MODULE = require("module");
    return function(request, stackLevel){
      var moduleFilename;
      moduleFilename = stack()[stackLevel].getFileName();
      return MODULE._resolveFilename(request, require.cache[moduleFilename]);
    };
  }.call(this));
  sha1 = function(string){
    return crypto.createHash('sha1').update(string).digest('hex');
  };
  hashSums = {};
  fileWatchers = {};
  headStr = function(it){
    return it.substr(0, 7);
  };
  onFileChange = require('./onFileChange.js');
  onFileChange2 = function(path, callback){
    function hashSum(){
      if (fs.existsSync(path)) {
        return sha1(fs.readFileSync(path));
      } else {
        l(("warning, " + path + " is not available anymore!").red.bold);
        return hashSums[path];
      }
    }
    function isDifferentHash(){
      var h;
      h = hashSum();
      if (h !== hashSums[path]) {
        l(path + " " + headStr(h) + " --> " + headStr(hashSums[path]));
        hashSums[path] = h;
        return true;
      } else {
        return false;
      }
    }
    function init(){
      if (!fs.existsSync(path)) {
        l("Path " + path + " does not exists");
        return false;
      } else {
        hashSums[path] || (hashSums[path] = hashSum());
        return fileWatchers[path] = fs.watch(path, function(event){
          l(event);
          if (event === 'change' && isDifferentHash()) {
            return callback(path);
          }
        });
      }
    }
    if (typeof callback === 'function') {
      init();
      return {
        stop: function(){
          return fileWatchers[path].close();
        },
        reload: init
      };
    } else {
      throw new Error("No callback for onFileChange");
    }
  };
  module.exports = function(path, callback){
    var absPath, mainDir, relPath, _module, absTmpPath, ref$, k;
    absPath = resolveCalledFilename(path, 2);
    mainDir = PATH.dirname(require.main.filename);
    relPath = absPath.replace(RegExp(mainDir + ''), '');
    if (require.cache[absPath] == null) {
      l("Loading " + relPath);
      _module = require(absPath);
      if (typeof _module !== 'object') {
        l("[warn] Hotload only works with objects, " + relPath + " will not be reloaded");
        return _module;
      } else {
        if (typeof _module.hlInit == 'function') {
          _module.hlInit();
        }
        if (typeof callback == 'function') {
          callback(_module);
        }
        onFileChange(absPath, function(){
          return module.exports(absPath, callback);
        });
        return _module;
      }
    } else {
      l("Reloading " + relPath);
      absTmpPath = absPath + ".tmp";
      require.cache[absTmpPath] = require.cache[absPath];
      delete require.cache[absPath];
      _module = require(absPath);
      require.cache[absPath] = require.cache[absTmpPath];
      delete require.cache[absTmpPath];
      if (typeof (ref$ = require.cache[absPath].exports).hlUnload == 'function') {
        ref$.hlUnload();
      }
      for (k in require.cache[absPath].exports) {
        require.cache[absPath].exports[k] = null;
      }
      if (typeof global.gc == 'function') {
        global.gc();
      }
      for (k in _module) {
        require.cache[absPath].exports[k] = _module[k];
      }
      if (typeof (ref$ = require.cache[absPath].exports).hlInit == 'function') {
        ref$.hlInit();
      }
      if (typeof callback == 'function') {
        callback(require.cache[absPath].exports);
      }
      return require.cache[absPath].exports;
    }
  };
}).call(this);
