module.exports = function (model) {
	var module = {};

	module.admin = require('./admin.js')(model);
	module.frontend = require('./frontend.js')(model);

	return module;
}	