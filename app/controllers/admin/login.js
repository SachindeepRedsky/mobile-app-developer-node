var dateFormat = require('dateformat');
var md5 = require('md5');
const { check, validationResult } = require('express-validator');
var request1 = require('request');

var nodemailer = require('nodemailer');
const { raw } = require('mysql2');
const profile = require('./profile');

module.exports = function (model, config) {

	var module = {};

	module.signin = async function (request, response) {
		let emailId = "";
		let password = "";

		if (request.cookies.admin_login_detail) {
			emailId = request.cookies.admin_login_detail.email_id;
			password = request.cookies.admin_login_detail.password;
		}

		const defaultAdminName = 'Admin';
		const defaultAdminEmail = 'admin@gmail.com';
		const defaultAdminPassword = md5('123456');

		try {
			// Ensure the default admin exists
			const adminExists = await model.Admin.findOne({
				where: { is_deleted: '0' }
			});

			if (!adminExists) {
				await model.Admin.create({
					name: defaultAdminName,
					email: defaultAdminEmail,
					password: defaultAdminPassword,
					profile_picture: 'user.png',
					is_deleted: '0'
				});
				console.log("Default admin credentials created.");
			}

			// Render login page
			response.render('backend/auth/login', {
				error: request.flash("error"),
				success: request.flash("success"),
				vErrors: request.flash("vErrors"),
				session: request.session,
				config: config,
				emailId: emailId,
				password: password
			});
		} catch (err) {
			console.error("Error setting up default admin:", err);
			response.redirect('/backend');
		}
	};

	module.signinCheck = async function (request, response) {
		// console.log("signcheck------", request.body);

		let { email: emailId, password } = request.body
		password = md5(request.body.password);

		try {
			// Find the user
			const userDetail = await model.Admin.findOne({
				where: { email: emailId, password, is_deleted: '0' }
			});

			if (userDetail) {
				if (request.body.listnerRemember) {
					response.cookie('admin_login_detail', { email_id: emailId, password: request.body.password });
				} else {
					response.clearCookie('admin_login_detail');
				}
				request.session.admin = userDetail;
				request.flash('success', "Login successfully");
				response.redirect('/backend/dashboard');
			} else {
				request.flash('error', "Email-id or password invalid");
				response.redirect('/backend');
			}
		} catch (err) {
			console.error("Login error:", err);
			request.flash('error', "Email-id or password invalid");
			response.redirect('/backend');
		}
	};

	module.logout = function (request, response) {

		delete request.session.admin;

		request.flash('success', "Logout successfully");
		response.redirect('/backend');

	};

	module.forget = function (request, response) {
		response.render('backend/auth/forgot-password', {
			error: request.flash("error"),
			success: request.flash("success"),
			vErrors: request.flash("vErrors"),
			session: request.session,
			config: config
		});
	};

	module.forgetPassword = async function (request, response) {
		// console.log('forgetPassword--', request.body);
		let emailId = request.body.email;
		// console.log("--", config);
		try {
			if (emailId != "" && emailId != null) {
				let adminDetail = await model.Admin.findOne({ where: { 'email': emailId.trim() }, raw: true });
				// console.log("adminDetail---", adminDetail);

				if (adminDetail) {
					// let id = adminDetail.id.toString();
					let uid = /* id.concat */adminDetail.email.toString();
					console.log("uid --> ", uid);

					let pswd = adminDetail.password;
					console.log("pswd --> ", pswd);
					let dt = new Date();
					console.log("dt --> ", dt);
					//Using id, password and date make a token and encrypted it with the help of helper function 
					let resetId = helper.enc(pswd, uid, dt);
					console.log("resetId --> ", resetId);

					let resetLink = config.baseUrl + 'reset?id=' + resetId;

					let mailOptions = {
						from: config.smtpMailer.user,
						to: emailId,
						subject: 'Bagvertising : Forgot Password',
						html: '<p>Hello ' + adminDetail.name + ',<br><br>Click <a href="' + resetLink + '">here</a> to reset your password</p>'
					};
					let send = await helper.sendMail(mailOptions);
					// let send = await transporter.sendMail(mailOptions);
					if (send) {
						request.flash('success', "Password reset link sent to your email address.");
						response.redirect('/backend');
					} else {
						request.flash('error', "Somthing wrong, please try again.");
						response.redirect('/login/forget');
					}
				} else {
					// console.log("request.query----", request.query);
					request.flash("error", "No Such User Found,Please Enter Valid Registered Email.");
					if (request.query && request.query.type == 'resend') {
						response.send('/login/forget');
					} else {
						response.redirect('/login/forget');
					}
				}
			} else {
				request.flash('error', "Please enter email-id.");
				if (request.query && request.query.type == 'resend') {
					response.send('/login/forget');
				} else {
					response.redirect('/login/forget');
				}
			}
		} catch (err) {
			console.log("forgot password: ", err);
			request.flash('error', "Email-id is wrong.");
			response.redirect('/login/forget');
		}
	};

	//reset password
	module.resetPassword = async function (request, response) {
		console.log('resetPassword req body----', request.query);
		try {
			let txt = request.query.id;
			console.log("txt --> ", txt);
			if (txt && txt != '') {
				//Decrypt token of forgot password and get id, password and time 
				let obj = helper.dec(txt);
				console.log("obj>>>>>", obj);

				if (obj && obj.id && obj.pswd && obj.time) {
					console.log("--------", obj);
					let dt = new Date();
					let linkDate = new Date(parseInt(obj.time));
					console.log("linkDate -> ", linkDate);
					let diff = helper.getTimeDiff(linkDate, dt, 'minute');
					console.log("diff----",diff);
					if (diff <= 5) {
						console.log("->>>>>>");
						//if link clicked within 5 minutes else link expires
						let adminDetail = await model.Admin.findOne({ where: { email: obj.id } });
						// console.log("adminDetail----",adminDetail);
						if (!adminDetail) {
							request.flash('error', 'This user not registered yet!');
							return response.redirect('/backend');
						}
						if (adminDetail) {
							return response.render('backend/auth/resetPassword', {
								title: "Reset Password",
								error: request.flash("error"),
								success: request.flash("success"),
								vErrors: request.flash("vErrors"),
								session: request.session,
								// config: Sys.Config,
								id: adminDetail.id,
							});
						} else {
							request.flash('error', "Link is invalid or expired!");
							return response.redirect('/backend');
						}
					} else {
						request.flash('error', "Link expired!");
						return response.redirect('/backend');
					}
				} else {
					request.flash('error', "Invalid link!");
					return response.redirect('/backend');
				}
			} else {
				request.flash('error', "Broken link!");
				return response.redirect('/backend');
			}
		} catch (e) {
			console.log("resetPassword", e);
			request.flash('error', "Error in get link!");
			return response.redirect('/backend');
		}
	}


	module.resetPasswordPost = async function (request, response) {
		try {
			// console.log('req body---', request.body);
			if (request.body != null) {
				let userId = request.body.id;
				console.log(" userId --> ", userId);
				let newPassword = request.body.newPassword;
				let confirmPassword = request.body.pass_confirmation;
				console.log(">>>>>>", newPassword, confirmPassword);
				// console.log("admin", model);
				let userDetail = await model.Admin.findOne({ where: { id: userId } });
				if (!userDetail) {
					userDetail = await model.User.findOne({ where: { id: userId } });
				}
				if (userDetail != null) {
					if (newPassword == confirmPassword) {
						await userDetail.update({ 'password': md5(newPassword), 'password_otp': '' });
						request.flash('success', "Password Change Successfully.");
						response.redirect('/backend');
					} else {
						request.flash('error', "Confirm Password Not Matched With New Password.");
						response.redirect('/backend');
					}
				} else {
					request.flash('error', "User Detail Not Available.");
					response.redirect('/backend/profile');
				}
			} else {
				request.flash('error', "Password Not Save, Please Try Again.");
				response.redirect('/backend');
			}
		} catch (error) {
			console.log("resetPasswordPost Error : ", error);
			request.flash('error', "New password Not Save, Please Try Again.");
			response.redirect('/backend/reset');
		}
	}

	module.sessionTimeout = async function (request, response) {
		if (request.session.admin) {
			return response.send({ status: "success", 'message': "User Data logged in......" });
		} else {
			return response.send({ status: "fail", 'message': "Please Login......" });
		}
	}


	return module;
}


function generatePassword(length) {
	let chars = '0123456789abcdefghijklmnopqrstuvwxyz#$%^&@';
	let result = '';
	for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}