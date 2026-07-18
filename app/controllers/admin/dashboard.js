let dateformat = require('dateformat');
module.exports = function(model){
	
	let module = {};

	module.view = async function(req, res){
		let totalUsers = await model.User.count({where:{"is_deleted": "0" }});
		console.log("totalUsers---",totalUsers);
		let totalBrands = await model.Brand.count({});
		let totalCampaign = await model.Campaign.count({});
		

		return res.render('backend/dashboard', {
			error: req.flash("error"),
			success: req.flash("success"),
			vErrors: req.flash("vErrors"),
			user: req.session.admin,
			config: config,
			totalUsers,
			totalBrands,
			totalCampaign,
			alias: 'dashboard',
			dashboard: "active"
		});
	};

	return module;
}