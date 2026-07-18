const { check, validationResult } = require('express-validator');
module.exports = function (app, model, controller) {

    var middleware = require('../app/middleware/index')(model);
    var validation = require('../app/validator/index')(model);

    // Start : Admin All Routes 
    app.get("/", (req, res) => {
        res.redirect('/backend');
    });
    app.get('/backend', middleware.admin.isLogin, controller.login.signin);
    app.post('/login/check', validation.admin.login, controller.login.signinCheck);
    app.get('/login/forget', middleware.admin.isLogin, controller.login.forget);
    app.post('/login/forgetpassword', controller.login.forgetPassword);
    app.get('/backend/profile', middleware.admin.login, controller.profile.profile);
    app.post('/backend/profile/update', middleware.admin.login, controller.profile.update);
    app.post('/backend/changepasswordPost', validation.admin.changePassword, controller.profile.changepasswordPost);
    app.get('/backend/logout', middleware.admin.login, controller.login.logout);

    app.get('/reset', middleware.admin.isLogin, controller.login.resetPassword);
    app.post('/resetPassword', middleware.admin.isLogin, controller.login.resetPasswordPost);
    // End : Admin All Routes 

    // Start : Dashboard All Routes 
    app.get('/backend/dashboard', /* middleware.admin.login, */ controller.dashboard.view);
    // End : Dashboard All Routes 

    /* Start: User routing */
    app.get('/backend/user', middleware.admin.login, controller.user.view);
    app.get('/backend/getUsers', middleware.admin.login, controller.user.getUsers);
    app.get('/backend/user/detail/:id', middleware.admin.login, controller.user.detail);
    app.post('/backend/user/blockUnblockUser', middleware.admin.login, controller.user.blockUnblockUser);
    /* End: User routing */

    // CMS Management Router
    app.get('/backend/cmsPages', middleware.admin.login, controller.cms.cmsPages);
    app.get('/backend/getCmsPage', middleware.admin.login, controller.cms.getCmsPage);
    app.get('/backend/editCms/:id', middleware.admin.login, controller.cms.editCms);
    app.post('/backend/editCms/:id', middleware.admin.login, controller.cms.editCmsPost);
    // end

    // Brand Management
    app.get('/backend/brand', middleware.admin.login, controller.brand.view);
    app.get('/backend/getBrand', middleware.admin.login, controller.brand.getBrand)
    app.get('/backend/addBrand', middleware.admin.login, controller.brand.addBrand)
    app.post('/backend/addBrandPost', middleware.admin.login, controller.brand.addBrandPost)
    app.get('/backend/editBrand/:id', middleware.admin.login, controller.brand.editBrand)
    app.post('/backend/updateBrand/:id', middleware.admin.login, controller.brand.updateBrand)
    app.get('/backend/deleteBrand/:id', middleware.admin.login, controller.brand.deleteBrand)
    app.get('/backend/brandDetail/:id', middleware.admin.login, controller.brand.brandDetail);
    app.post('/backend/uploadCoupon', middleware.admin.login, controller.brand.uploadCoupon)
    app.post('/backend/addCoupon', middleware.admin.login, controller.brand.addCoupon)
    app.get('/backend/brandCouponDetail/', middleware.admin.login, controller.brand.brandCouponDetail);
    app.get('/backend/campaignCouponDetail', middleware.admin.login, controller.campaign.campaignCouponDetail);
    app.get('/coupon/:couponCode', controller.brand.openCoupon);
    app.post('/backend/addCampaignBagCoupon',middleware.admin.login, controller.campaign.addCampaignBagCoupon);


    // Campaign Management
    app.get('/backend/campaign', middleware.admin.login, controller.campaign.view);
    app.get('/backend/getCampaign', middleware.admin.login, controller.campaign.getCampaign)
    app.get('/backend/addCampaign', middleware.admin.login, controller.campaign.createCampaign)
    app.post('/backend/addCampaign', middleware.admin.login, controller.campaign.createCampaignPost)
    app.post('/backend/checkBrandCoupen', middleware.admin.login, controller.campaign.checkBrandCoupen)
    app.get('/backend/campaignDetail/:id', /*middleware.admin.login,*/ controller.campaign.campaignDetail);
    app.get('/backend/editCampaign/:id', middleware.admin.login, controller.campaign.editCampaign)
    app.post('/backend/updateCampaign/:id', middleware.admin.login, controller.campaign.updateCampaign)
    app.post('/backend/getCampaingnDetais', middleware.admin.login, controller.campaign.getCampaingnDetais)
    app.get('/backend/deleteCampaign/:id', middleware.admin.login, controller.campaign.deleteCampaign)
    app.get("/backend/getCamaignCoupon", middleware.admin.login, controller.campaign.getCamaignCoupon)
} 