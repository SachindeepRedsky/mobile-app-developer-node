let Op = Sequelize.Op;
let md5 = require('md5');
const { check, validationResult } = require('express-validator');
let nodemailer = require('nodemailer');
let fs = require('fs');

module.exports = function (model, config) {
    let module = {};

    module.profile = async function (request, response) {
        console.log("session Profile-----------", request.session.admin);
        let userDetail = await model.Admin.findOne({ where: { 'email': request.session.admin.email }, raw: true });
        response.render('backend/auth/profile', {
            error: request.flash("error"),
            success: request.flash("success"),
            vErrors: request.flash("vErrors"),
            user: request.session.admin,
            config: config,
            userData: userDetail,
            profile: "active"
        });
    };

    module.update = async function (req, res) {
        try {
            // Find the admin by ID
            let admin = await model.Admin.findOne({ where: { id: req.body.id } });

            if (admin) {
                let image;
                // Prepare the details to be updated
                const details = {
                    email: req.body.email,
                    name: req.body.name,
                };


                if (req.files && req.files.profileImage) {
                    const profileImage = req.files.profileImage;
                    console.log("profileImage", profileImage);

                    // Generate a unique name for the image
                    const tempNum = helper.randomNumber(4);
                    // const datetime = dateformat(new Date(), 'yyyymmddHHMMss');
                    const imageName = '/dist/img/' /* + datetime */ + tempNum + ".jpg";

                    // Move the file to the public directory
                    await profileImage.mv('public' + imageName);
                    details.profile_picture = imageName;
                }

                console.log("details -->", details);
                // Update the admin record
                let update = await model.Admin.update(details, { where: { id: req.body.id } });
                console.log("update -->", update);
                // Update session details   
                // req.session.admin.profile_picture = imageName || req.session.admin.profile_picture; // Preserve old image if new one isn't available

                // Get the updated admin details
                let updatedDetails = await model.Admin.findOne({ where: { id: req.body.id } });
                console.log("updatedDetails----",updatedDetails);
                req.session.admin.name = updatedDetails.name;
                req.session.admin.email = updatedDetails.email
                req.session.admin.profile_picture = updatedDetails.profile_picture
                req.flash('success', 'Profile updated successfully');
                res.redirect('/backend/profile');

            } else {
                req.flash('error', 'Profile not updated successfully');
                return res.redirect('/backend/profile');
            }
        } catch (e) {
            console.error("Error", e);
            req.flash('error', 'An error occurred while updating the profile');
            res.redirect('/backend/profile');
        }
    };


    module.changepasswordPost = async function (request, response) {
        console.log("req.body----", request.body);
        let emailId = request.session.admin.email;
        let oldpassword = md5(request.body.currentPassword);
        let newpassword = md5(request.body.pass);

        try {
            let userDetail = await model.Admin.findOne({ where: { 'email': emailId, 'password': oldpassword } });
            console.log("userDetail---------", userDetail);
            if (userDetail != null) {
                let updateData = await userDetail.update({ password: newpassword });
                request.flash('success', "Password change successfully.");
                response.redirect('/backend/dashboard');
            } else {
                console.log("oldpassword is wrong");
                request.flash('error', "Old password is wrong");
                response.redirect('/backend/profile');
            }
        } catch (err) {
            console.log("Password change error: ", err);
            request.flash('error', "Password not change, please try again");
            response.redirect('/backend/profile');
        }
    };

    module.changesettingPost = async function (request, response) {
        try {
            let emailId = request.session.admin.email;
            let settingInput = {
                artist_earning: request.body.artist_earning,
                minimum_payout_amount: request.body.minimum_payout_amount
            };
            let userDetail = await model.User.findOne({ where: { 'email': emailId } });
            if (!userDetail) {
                request.flash('error', "User detail not found");
                return response.redirect('/backend/dashboard');
            }
            if (userDetail) {
                let setting = await model.Setting.findOne();
                let settingData = await setting.update(settingInput);
                request.flash('success', "setting detail change successfully.");
                return response.redirect('/backend/profile');
            }
        } catch (err) {
            console.log("change setting error: ", err);
            request.flash('error', "setting not change, please try again");
            return response.redirect('/backend/profile');
        }
    };


    return module;
}