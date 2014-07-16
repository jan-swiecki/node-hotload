var path = require("path");
var fs = require("fs");
var libPath = path.resolve("./lib.js");
var libPath2 = path.resolve("./lib2.js");
var libPathError = path.resolve("./libError.js");
var hotload = require("../lib/hotload.js");

module.exports = {
	tearDown: function(callback) {
		// console.log("removing cache");
		delete require.cache[libPath];
		callback();
	},
	testRequire1: function(test) {
		var lib = require(libPath);
		test.expect(1);
		test.equals(lib.x, "abc");
		test.done();
	},
	testRequire2: function(test) {
		test.expect(1);
		var lib1 = require(libPath);
		delete require.cache[libPath];
		var lib2 = hotload(libPath);
		hotload.stop(libPath);
		test.deepEqual(lib1, lib2);
		test.done();
	},
	testReload: function(test) {
		test.expect(4);

		fs.writeFileSync(libPath2, 'module.exports = {"x": "xyz"};');

		var lib = hotload(libPath2);
		test.deepEqual(lib, {"x": "xyz"});
		test.ok(typeof lib["y"] === "undefined");

		fs.writeFileSync(libPath2, 'module.exports = {"y": "123"};');

		setTimeout(function() {
			test.deepEqual(lib, {"y": "123"});
			test.ok(typeof lib["x"] === "undefined");

			hotload.stop(libPath2);

			fs.unlinkSync(libPath2);
			test.done();
		}, 500);

	},
	testError: function(test) {
		test.expect(1);
		var lib = hotload(libPathError);
		test.deepEqual(lib, {error: true});
		hotload.stop(libPathError);
		test.done();
	}
}