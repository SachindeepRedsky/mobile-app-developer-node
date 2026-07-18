module.exports = function (model) {
	var module = {};

	//all model loading
	const config = require('../../config/constants.js');
	
	module.login = require('./admin/login')(model,config);
	module.user = require('./admin/user')(model,config);
	module.profile = require('./admin/profile')(model,config);
	module.dashboard = require('./admin/dashboard')(model,config);
	module.cms = require('./admin/cmsController')(model,config);
	module.brand = require('./admin/brandController.js')(model,config);
	module.campaign = require('./admin/campaignController.js')(model,config);
	
	return module;
}
