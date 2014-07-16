function Optional(obj) {
	this.isPresent = function() {
		return obj !== null;
	}

	this.get = function() {
		return obj;
	}
}

module.exports = {
	"of": function(obj) {
		return new Optional(obj);
	},
	"absent": function(obj) {
		return new Optional(null);
	}
};