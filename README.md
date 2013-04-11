# Hot code reload for NodeJS

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

The purpose is reload library without application shut down.

It is probably not suitable for production use.

Hotload only works on object modules, i.e. modules with `module.exports = "abc";` will be `require`d normally but they cannot be hot reloaded.

```javascript
// index.js
hotload = require("hotload");

// first argument is the same as in `require`
// second argument (callback) is optional
lib = hotload("./lib.js", function(lib){
    console.log("lib has loaded/reloaded!");
});

```

From now on if lib.js is modified it will be reloaded. How does it work? On lib.js file change hotload replaces all properties of original `lib` object with new ones.

E.g. old lib.js could be:

```javascript
// old lib.js
module.exports = {
    "a": 10,
    "b": 11
};

```

And new lib.js could be

```javascript
// new lib.js
module.exports = {
    "b": 21,
    "c": 22
};
```

In that case during runtime of `index.js` when we save `lib.js` from old to new one then in `lib` object will become:
```javascript
{
    "b": 21,
    "c": 22
}