/**
 * fs.watch wrapper that checks file SHA1
 * and prevents multiple callback calls.
 *
 * Related: http://stackoverflow.com/q/12978924/1637178
 * 
 * 
 * Usage is the same as fs.watch
 *
 *   var onFileChange = require("./onFileChange.js");
 *
 *   // same as fs.watch
 *   onFileChange("myAwesomeFile.txt", function()
 *   {
 *       console.log("Awesome file change!");
 *   });
 *
 * @author Jan Święcki <jan.swiecki@gmail.com>
 * @link https://gist.github.com/jan-swiecki/5358631
 */
module.exports = (function()
{
    var crypto = require("crypto");
    var fs     = require("fs");

    var hashSums     = {};
    var fileWatchers = {};

    var getSha1 = function(string)
    {
        return crypto.createHash("sha1").update(string).digest("hex");
    }

    var getSha1FromFile = function(path)
    {
        if(fs.existsSync(path))
        {
            return getSha1(fs.readFileSync(path));
        }
        else
        {
            // if file is moved/deleted then do nothing
            return hashSums[path];
        }
    }

    // actual onFileChange function
    return function(path, callback)
    {
        function hasDifferentHash()
        {
            var h = getSha1FromFile(path);
            if(h !== hashSums[path])
            {
                hashSums[path] = h;
                return true;
            }
            else
            {
                return false;
            }
        }

        function init()
        {
            if(! fs.existsSync(path))
            {
                console.error("Path "+path+" does not exists");
                return false;
            }
            else
            {
                hashSums[path] || (hashSums[path] = getSha1FromFile(path));

                // Try to prevent many events to fire at the same time.
                // When someone is making many almost simultaneous file saves
                // then SHA1 is sometimes not calculated properly. It happens
                // probably because halfly saved file is being read. In that
                // case the only thing we could try to do is to create file lock
                // in NodeJS that is included by Operating System while saving file.
                // Later I will try to experiment with fs-ext flock
                // (https://github.com/baudehlo/node-fs-ext).
                var execute = true;

                fileWatchers[path] = fs.watch(path, function(event)
                {
                    if(execute === true && event === 'change' && hasDifferentHash())
                    {
                        execute = false;
                        fileWatchers[path].close();
                        callback(path);
                        init();
                    }
                });
            }
        }

        if(typeof callback === 'function')
        {
            if(init() === false)
            {
                throw new Error("Cannot initialize");
            }

            return {
                "close": fileWatchers[path].close
            };
            
        }
        else
        {
            throw new Error("No callback for onFileChange");
        }

    }

}());