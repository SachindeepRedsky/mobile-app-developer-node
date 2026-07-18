let dateformat = require('dateformat');
let currentDate = new Date();
let md5 = require('md5');
let Op = Sequelize.Op;
let fs = require("fs");
const { raw } = require('mysql');

module.exports = function (model, config) {
	let module = {};

	module.view = function (request, response) {
		response.render('backend/user/users', {
			title: 'User Managment',
			error: request.flash("error"),
			success: request.flash("success"),
			vErrors: request.flash("vErrors"),
			user: request.session.admin,
			config: config,
			alias: 'user',
			userManagement: 'active'
		});
	};


	module.getUsers = async function (request, response) {
		try {
			// console.log('ge/tUsers req body---', request.body);
			let start = parseInt(request.query.start);
			let length = parseInt(request.query.length);
			let search = request.query.search.value;
			let query = {};

			if (search != '') {
				query = {
					[Op.or]: [
						{ 'firstName': { [Op.like]: '%' + search + '%' } },
						{ 'mobile': { [Op.like]: '%' + search + '%' } },
						{ 'email': { [Op.like]: '%' + search + '%' } }
					], 'is_deleted': '0'
				};
			} else {
				query = { "is_deleted": "0" };
			}

			console.log("query: ", query);
			let usersCount = await model.User.count({ where: query });
			let users = await model.User.findAll({ where: query, order: [["id", "DESC"]], offset: start, limit: length, raw: true });
			//console.log('users----', users);
			console.log("usersCount ->", usersCount);
			console.log("users ->", users.length);
			for (let i = 0; i < users.length; i++) {
				users[i].indexno = i + 1;
			}

			let obj = {
				'draw': request.query.draw,
				'recordsTotal': usersCount,
				'recordsFiltered': usersCount,
				'data': users
			};
			return response.send(JSON.stringify(obj));
		} catch (error) {
			console.log("error in get users", error);
		}

	};

	module.detail = async function (request, response) {
		// console.log("detail---", request.params);
		let userId = request.params.id;
		if (userId != "" && userId != 0) {
			try {
				let userDetail = await model.User.findByPk(userId);
				if (userDetail != null) {
					response.render('backend/user/detail', {
						title: 'View User',
						error: request.flash("error"),
						success: request.flash("success"),
						vErrors: request.flash("vErrors"),
						user: request.session.admin,
						config: config,
						userDetail: userDetail,
						alias: 'user',
						userManagement: 'active'

					});
				} else {
					request.flash('error', "User detail not available.");
					response.redirect('/backend/user');
				}
			} catch (err) {
				console.log('user edit Error:', err);
				request.flash('error', "User detail not available.");
				response.redirect('/backend/user');
			}
		} else {
			request.flash('error', "User detail not available.");
			response.redirect('/backend/user');
		}
	};
	module.blockUnblockUser = async function (request, response) {
		// console.log("detail---", request.params, request.body);
		let userId = request.body.id;
		try {
			let userDetails = await model.User.findOne({ where: { id: userId }, raw: true })
			// console.log("userDetails-----", userDetails);
			if (userDetails) {
				if (userDetails.status == "active") {
					// console.log("a");
					let updateSts = await model.User.update({ status: 'inactive' }, { where: { id: userId } })
					// console.log("updateSts --> ", updateSts);
				} else {
					// console.log("ia");

					let updateSts = await model.User.update({ status: 'active' }, { where: { id: userId } })
					console.log("updateSts --> ", updateSts);

				}
				return response.send("success");
			} else {
				return response.send("error");
			}
		} catch (err) {
			console.log('blockUnblockUser Error:', err);
			response.redirect('/backend/user');
		}

	};



	return module;
}

function randomNumber(length) {
	let chars = '0123456789';
	let result = '';
	for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}


