module.exports = function (model) {
	var module = {};
	
	module.admin = require('./admin')(model);
	module.frontend = require('./frontend')(model);

	return module;
}
