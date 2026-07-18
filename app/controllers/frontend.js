module.exports = function (model) {
	var module = {};
	const config = require('../../config/constants.js');

	module.auth = require('./frontend/auth.js')(model, config);
	
	return module;
}	