const { check, validationResult } = require("express-validator");
module.exports = function (app, model, controller) {
  // console.log("🚀 ~ controller:", controller)
  var middleware = require("../app/middleware/index")(model);
  var validation = require("../app/validator/index")(model);
  var config = require("../config/constants");
  app.post("/user/register", controller.auth.register);
  app.post("/user/login", controller.auth.login);
  app.post("/verifyOtp", controller.auth.OTPVerify);
  app.post("/OTPVerifyForProfile", controller.auth.OTPVerifyForProfile);
  app.post("/googleLogin", controller.auth.googleLogin);
  app.post("/appleLogin", controller.auth.appleLogin);
  app.post("/resendOTP", controller.auth.resendOTP);
  app.get(
    "/viewUserProfile",
    /*middleware.frontend.login,*/ controller.auth.viewUserProfile
  );
  app.post("/editUserProfile", controller.auth.editUserProfile);
  app.post("/logout", controller.auth.logout);
  app.get("/getCmsPage", controller.auth.getCmsPage);
  app.post("/user/delete", controller.auth.deleteUserAccount);
  app.post("/qrscan", controller.auth.qrScan);
  app.post("/getMyCoupon", controller.auth.getMyCoupon);
  app.post("/updateStatus", controller.auth.updateStatus);
  app.post("/redeemCoupon", controller.auth.redeemCoupon);
};
