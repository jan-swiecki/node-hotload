# Hotload - Hot code reload for NodeJS

### Version 0.1.0

## TL;DR:

```javascript
// lib.js
module.exports = {
    "key": "value"
}

// index.js
hotload = require("hotload");

//lib = require("lib");
lib = hotload("./lib.js");

setInterval(function()
{
    // normally it would print 'value' indefinitely,
    // but at runtime try to change value of "key" in lib.js
    // and save lib.js file and see that module will be reloaded
    // and new value will be printed.
    console.log(lib.key);

}, 1000);
```

## Install

`> npm install hotload`

## Usage

### Introduction

The purpose is to reload libraries without application shut down.

It is probably not suitable for production use.

Hotload only works on object modules. Non-object modules (E.g. `module.exports = "abc"`) will be `require`d normally but they cannot be hot reloaded. If you don't see why you should google about JavaScript's variable references and its pass-by-value nature. However if you know how to hack NodeJS around this and achive immutables hot reloading let me know.

```javascript
// index.js
hotload = require("hotload");

// First argument is the same as for `require`. Second argument (callback) is optional.
// Callback's first argument is the module object, which is exactly the same object
// as returned by `hotload`.
lib = hotload("./lib.js", function(lib2){
    // (lib === lib2) is true first time
    console.log("lib has loaded/reloaded!");
});

// Callback function is called on first module load and on every module reload.
```

From now on if `lib.js` is modified it will be reloaded. How does the mechanism work? When `lib.js` is changed hotload replaces all properties of original `lib` object with new ones.

E.g. when we have old `lib.js` like this:

```javascript
// old lib.js
module.exports = {
    "a": 10,
    "b": 11
};
```

And new `lib.js` like this:

```javascript
// new lib.js
module.exports = {
    "b": 21,
    "c": 22
};
```

then during runtime of `index.js` when we save `lib.js` (old version to new version) `lib` object will become (during runtime of `index.js` module):

```javascript
{
    "b": 21,
    "c": 22
}
```

So after hot reloading `lib.js` the `lib` object can still be used. You don't need to use callback method to replace your references at all, it just works.

### Additional information

Hotload will look out for imported object's methods `hlInit` and `hlUnload` and execute then during start/shutdown of that module. E.g.:

```javascript
module.exports = {
    hlInit: function()
    {
        console.log("Module has been loaded/reloaded");
    },
    hlUnload: function()
    {
        console.log("Module is being unloaded, better take down all event listeners so they don't overlap with new ones!");
    }
}
```

As mentioned in example's `hlUnload` function -- if your module has event listeners or any other long running tasks (e.g. `setInterval`) you should shut them down while unloading module, because if you don't when module is reloaded it will duplicate event listeners.

You could say "Hey, wait a second! After module reload old module is gone, and I don't have access to event listeners so they must be gone too!". Wrong. They are still running and worse -- you don't have access to them any more!

### License

MIT