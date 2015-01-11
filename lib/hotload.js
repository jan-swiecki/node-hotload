(function(){
  var PATH, fs, colors, crypto, stack, Optional, l, resolveCalledFilename, hashSums, fileWatchers, headStr, onFileChange, fileHandlers, moduleLoader;
  PATH = require('path');
  fs = require('fs');
  colors = require('colors');
  crypto = require('crypto');
  stack = require('callsite');
  Optional = require('./optional.js');
  l = function(it){
    console.log("--".yellow.bold, it);
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
  hashSums = {};
  fileWatchers = {};
  headStr = function(it){
    return it.substr(0, 7);
  };
  onFileChange = require('./onFileChange.js');
  fileHandlers = {};
  moduleLoader = function(relPath, absPath, callback){
    var ret, m, ex;
    ret = Optional.absent();
    try {
      l("(" + relPath + ") Begin output");
      m = require(absPath);
      ret = Optional.of(m);
      l("(" + relPath + ") End output");
      l("(" + relPath + ") Module loaded successfully");
      if (typeof callback == 'function') {
        callback(void 8, ret);
      }
    } catch (e$) {
      ex = e$;
      l("(" + relPath + ") End output");
      l((("(" + relPath + ") Error loading module: ") + ex.message).red.bold);
      if (typeof callback == 'function') {
        callback(void 8, ret);
      }
    }
    return ret;
  };
  module.exports = function(path, callback, args){
    var absPath, mainDir, relPath, moduleOptional, _module, ref$, ref1$, k, absTmpPath, ref2$;
    if (typeof args === 'undefined') {
      if (typeof callback !== 'function') {
        args = callback;
      }
    }
    args = Array.isArray(args)
      ? args
      : [];
    absPath = resolveCalledFilename(path, 2);
    
    // basic nodejs REPL support
    if(typeof require.main === 'undefined') {
      mainDir = process.cwd();
    } else {
      mainDir = PATH.dirname(require.main.filename);
    }

    mainDir = PATH.dirname(require.main.filename);
    relPath = PATH.relative(mainDir, absPath);
    if (require.cache[absPath] == null) {
      l("Loading " + absPath);
      moduleOptional = moduleLoader(relPath, absPath);
      if (!moduleOptional.isPresent()) {
        _module = {
          error: true
        };
      } else {
        _module = moduleOptional.get();
      }
      if (typeof _module !== 'object') {
        l("[warn] Hotload only works with objects, " + relPath + " will not be reloaded");
        return _module;
      } else {
        if ((ref$ = _module.hlInit) != null) {
          ref$.apply(this, args);
        }
        if (typeof callback == 'function') {
          callback(_module);
        }
        l(("fileHandlers[" + relPath + "] = ") + fileHandlers[absPath]);
        if (!fileHandlers[absPath]) {
          l("Attaching to " + relPath);
          fileHandlers[absPath] = onFileChange(absPath, function(){
            return module.exports(absPath, callback);
          });
        }
        return _module;
      }
    } else {
      l("Reloading " + relPath);
      if (typeof (ref1$ = require.cache[absPath].exports).hlUnload == 'function') {
        ref1$.hlUnload();
      }
      for (k in require.cache[absPath].exports) {
        require.cache[absPath].exports[k] = null;
      }
      if (typeof global.gc == 'function') {
        global.gc();
      }
      for (k in require.cache[absPath].exports) {
        delete require.cache[absPath].exports[k];
      }
      absTmpPath = absPath + ".tmp";
      require.cache[absTmpPath] = require.cache[absPath];
      delete require.cache[absPath];
      moduleOptional = moduleLoader(relPath, absPath);
      if (!moduleOptional.isPresent()) {
        return;
      } else {
        _module = moduleOptional.get();
      }
      require.cache[absPath] = require.cache[absTmpPath];
      delete require.cache[absTmpPath];
      for (k in _module) {
        require.cache[absPath].exports[k] = _module[k];
      }
      if ((ref2$ = require.cache[absPath].exports.hlInit) != null) {
        ref2$.apply(this, args);
      }
      if (typeof callback == 'function') {
        callback(require.cache[absPath].exports);
      }
      return require.cache[absPath].exports;
    }
  };
  module.exports.stop = function(libPath){
    var absPath, h;
    absPath = resolveCalledFilename(libPath, 2);
    h = fileHandlers[absPath];
    if (h) {
      l("Stopping watch at " + libPath);
      if (typeof h.close == 'function') {
        h.close();
      }
      delete fileHandlers[absPath];
    }
  };
}).call(this);
