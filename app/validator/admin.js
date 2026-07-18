const { body, validationResult } = require('express-validator');

module.exports = function (model) {
	var module = {};

	//Start: Validation for login
	module.login = function (req, res, next) {
		try {

			console.log("validator ----", req.body);
			body('email', 'Email Address is required').notEmpty();
			body('password', 'Password is required').notEmpty();
			body('email', 'Please enter valid email-id').isEmail();

			let errors = validationResult(req);
			if (errors.errors.length > 0) {
				console.log("error---",errors.errors);
				req.flash('vErrors', errors);
				res.redirect('/backend');
			} else {
				console.log("req.body------");
				next();
			}
		} catch (error) {
			console.log("error----", error);
		}
	};
	//End: Validation for login

	//Start: Validation for user add and edit
	module.addUser = function (req, res, next) {
		body('name', 'Name is required').notEmpty();
		body('username', 'UserName is required').notEmpty();
		body('birthdate', 'birthdate is required').notEmpty();
		body('email', 'Email is required').notEmpty();
		body('password', 'Password is required').notEmpty();
		body('confirm_password', 'Confirm Password is required').notEmpty();


		body('email', 'Enter valid email-id').isEmail();

		var errors = validationResult();
		if (errors) {
			req.flash('vErrors', errors);
			res.redirect('/backend/user/add');
		} else {
			next();
		}
	};
	module.updateUser = function (req, res, next) {
		console.log('updateUser req body---', req.body);
		body('name', 'Name is required').notEmpty();
		body('username', 'username is required').notEmpty();
		body('birthdate', 'birthdate is required').notEmpty();
		body('email', 'Email is required').notEmpty();

		body('email', 'Enter valid email-id').isEmail();

		var errors = validationResult();
		if (errors) {
			req.flash('vErrors', errors);
			if (req.params.id) {
				res.redirect('/backend/user/edit/' + req.params.id);
			} else {
				res.redirect('/backend/user/add');
			}
		} else {
			next();
		}
	};
	//End: Validation for user add and edit

	//Start: Validation for Change Password
	module.changePasswordPost = function (req, res, next) {
		console.log('vali req body', req.body);
		body('new_password', 'New Password is required').notEmpty();
		body('c_new_password', 'Confirm New Password is required').notEmpty();

		var errors = validationResult();
		if (errors.errors.length > 0) {
			req.flash('vErrors', errors);
			res.redirect('/backend/profile/');
		} else {
			next();
		}
	};
	//End: Validation for Change Password

	//START: Validation for category add and edit
	module.category = function (req, res, next) {
		console.log('category validator---', req.body);
		body('category_name', 'Category name is required').notEmpty();
		body('category_desc', 'Category description is required').notEmpty();

		var errors = validationResult();
		if (errors) {
			req.flash('vErrors', errors);
			if (req.params.id) {
				res.redirect('/backend/category/edit/' + req.params.id);
			} else {
				res.redirect('/backend/category/add');
			}
		} else {
			next();
		}
	};
	//END: Validation for category add and edit

	//START: Validation for voucher add and edit
	module.voucher = function (req, res, next) {
		console.log('voucher validator---', req.body);
		body('amount', 'Amount name is required').notEmpty();
		body('expiry_date', 'Expiry Date is required').notEmpty();
		body('status', 'Status is required').notEmpty();

		var errors = validationResult();
		if (errors) {
			req.flash('vErrors', errors);
			if (req.params.id) {
				res.redirect('/backend/voucher/edit/' + req.params.id);
			} else {
				res.redirect('/backend/voucher/add');
			}
		} else {
			next();
		}
	};
	//END: Validation for voucher add and edit

	//START: Validation for item add and edit
	module.item = function (req, res, next) {
		console.log('item validator---', req.body);
		body('item_name', 'Item name is required').notEmpty();
		body('category', 'Category is required').notEmpty();
		body('item_desc', 'Item Description is required').notEmpty();
		body('price', 'Price is required').notEmpty();
		body('quantity', 'quantity is required').notEmpty();
		body('measurment', 'measurment is required').notEmpty();

		var errors = validationResult();
		if (errors) {
			req.flash('vErrors', errors);
			if (req.params.id) {
				res.redirect('/backend/item/edit/' + req.params.id);
			} else {
				res.redirect('/backend/item/add');
			}
		} else {
			next();
		}
	};
	//END: Validation for item add and edit




	//Start: Validation for cms add and edit
	module.cms = function (req, res, next) {

		body('title', 'Package name is required').notEmpty();
		body('meta_tag', 'Description is required').notEmpty();
		body('meta_title', 'Meta title is required').notEmpty();
		body('description', 'Description is required').notEmpty();

		var errors = validationResult();
		if (errors) {
			req.flash('vErrors', errors);
			if (req.params.id) {
				res.redirect('/backend/cms/edit/' + req.params.id);
			} else {
				res.redirect('/backend/cms/add');
			}
		} else {
			next();
		}
	};
	//End: Validation for cms add and edit


	//Start: Validation for change password
	module.changePassword = async function (req, res, next) {
		body('currentPassword', 'Old password is required').notEmpty();
		body('pass', 'New password is required').notEmpty();
		body('pass_confirmation', 'Confirm password is required').notEmpty();

		var errors = validationResult(req);
		if (errors.errors.length > 0) {
			req.flash('vErrors', errors);
			res.redirect('/backend/profile');
		} else {
			next();
		}
	};
	//End: Validation for change password



	return module;
}