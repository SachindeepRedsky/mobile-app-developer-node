//var bcrypt = require('bcrypt');
var md5 = require("md5");
var jwt = require("jsonwebtoken");
// var lowerCase = require('lower-case');
var dateformat = require("dateformat");
var currentDate = new Date();
var fs = require("fs");
var nodemailer = require("nodemailer");
// const appleSignin = require('apple-signin-auth');
var Op = Sequelize.Op;
module.exports = function (model, config) {
  //   console.log("🚀 ~ model:", model)
  var module = {};

  module.register = async function (req, res) {
    console.log("register req body---", req.body);
    var successMessage = {
      status: "success",
      message: "",
      image_url: "",
      data: {},
    };
    var failedMessage = { status: "fail", message: "", data: {} };
    try {
      var {
        email: emailId,
        firstName,
        lastName,
        countryCode,
        mobile,
      } = req.body;

      emailId = req.body.email.toString().toLowerCase();
      var userMobileExist = await model.User.findOne({
        where: { countryCode, mobile, is_deleted: "0" },
      });
      console.log("data:", countryCode, mobile);

      console.log("userMobileExist  ======>>>>>>>>      ", userMobileExist);

      if (userMobileExist) {
        failedMessage.message = "This Phone number already exists.";
        return res.send(failedMessage);
      }

      var inputData = {
        firstName: firstName.toString().toLowerCase(),
        lastName: lastName.toString().toLowerCase(),
        email: emailId,
        countryCode,
        mobile,
        loginType: "manual",
        role: "user",
      };

      //   console.log("🚀 ~ config:", config)
      var signupDetail = await model.User.create(inputData);
      if (signupDetail != null) {
        var token = jwt.sign({ data: signupDetail.id }, config.jwt_secret, {
          expiresIn: config.jwt_expire,
        });
        const random4digitNumber = generateRandom4DigitNumber();
        await model.User.update(
          { jwtLoginToken: token, otp: random4digitNumber },
          { where: { id: signupDetail.id } }
        );
        // twilioMsg.messages.create({
        //   body: 'Dear Coustomer, your otp for verify is ' + random4digitNumber + '. Use this otp to verify.',
        //   from: "5093090585",
        //   to: `${countryCode}${mobile}`
        // }).then(async message => {
        //   console.log("yessss");
        //   // Create Player Object

        // }).catch(async error => {
        //   console.log(error);
        // })
        var userDetail = await model.User.findOne({
          where: { id: signupDetail.id },
          raw: true,


        });
        //  twilioMsg.messages.create({
        //             body: 'Dear Coustomer, your otp for registartion is ' + random4digitNumber + '. Use this otp to register.',
        //             from: "5093090585",
        //             to: "+919824454873"
        //         }).then(async message => {
        //             console.log("yessss");
        //             // Create Player Object

        //         }).catch(async error => {
        //             console.log(error);
        //         })
        successMessage.image_url = config.baseUrl;
        successMessage.data = userDetail;
        successMessage.message =
          "register sucessfully, Please verify your Number with OTP.";
        return res.send(successMessage);
      } else {
        failedMessage.message = "User not register, please try again";
        return res.send(failedMessage);
      }
    } catch (error) {
      console.log("register error: ", error);
      failedMessage.message = "Something went wrong!";
      return res.send(failedMessage);
    }
  };

  module.resendOTP = async function (req, res) {
    var successMessage = { status: "success", message: "", data: {} };
    var failedMessage = { status: "fail", message: "", data: {} };
    try {
      var { userId } = req.body;
      // console.log("🚀 ~ userId:", userId)
      if (!userId) {
        failedMessage.message = "please enter userId, please try again.";
        return res.send(failedMessage);
      }

      var loginUserDetail = await model.User.findOne({
        where: { id: userId, role: "user", is_deleted: "0" },
      });
      // console.log("🚀 ~ loginUserDetail:", loginUserDetail)
      if (!loginUserDetail) {
        failedMessage.message = "User not found, please try again.";
        return res.send(failedMessage);
      }
      if (loginUserDetail) {
        const random4digitNumber = generateRandom4DigitNumber();
        // console.log("🚀 ~ random4digitNumber:", random4digitNumber)
        await model.User.update(
          { verified: false, otp: random4digitNumber },
          { where: { id: loginUserDetail.id } }
        );
        loginUserDetail.verified = false;
        loginUserDetail.isLogin = false;
        successMessage.data = random4digitNumber;
        successMessage.message = "OTP resend successfully.";
        return res.send(successMessage);
      } else {
        failedMessage.message = "OTP not match. Please try again.";
        return res.send(failedMessage);
      }
    } catch (error) {
      console.log("changePasswordOTPRequest error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };

  module.OTPVerify = async function (req, res) {
    var successMessage = { status: "success", message: "", data: {} };
    var failedMessage = { status: "fail", message: "", data: {} };
    try {
      var { userId, otp } = req.body;
      if (!userId) {
        failedMessage.message = "please enter userId, please try again.";
        return res.send(failedMessage);
      }
      if (!otp) {
        failedMessage.message = "please enter OTP number, please try again.";
        return res.send(failedMessage);
      }
      var loginUserDetail = await model.User.findOne({
        where: { id: userId, role: "user", is_deleted: "0" },
      });
      if (!loginUserDetail) {
        failedMessage.message = "User not found, please try again.";
        return res.send(failedMessage);
      }
      if (loginUserDetail.otp == otp) {
        await model.User.update(
          { verified: true, isLogin: true, otp: null },
          { where: { id: loginUserDetail.id } }
        );
        loginUserDetail.verified = true;
        loginUserDetail.isLogin = true;
        successMessage.data = loginUserDetail;
        successMessage.message = "OTP verify Successfully.";
        return res.send(successMessage);
      } else {
        failedMessage.message = "OTP not match. Please try again.";
        return res.send(failedMessage);
      }
    } catch (error) {
      console.log("changePasswordOTPRequest error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };
  module.OTPVerifyForProfile = async function (req, res) {
    var successMessage = { status: "success", message: "", data: {} };
    var failedMessage = { status: "fail", message: "", data: {} };
    try {
      var { userId, otp } = req.body;
      if (!userId) {
        failedMessage.message = "please enter userId, please try again.";
        return res.send(failedMessage);
      }
      if (!otp) {
        failedMessage.message = "please enter OTP number, please try again.";
        return res.send(failedMessage);
      }
      var loginUserDetail = await model.User.findOne({
        where: { id: userId, role: "user", is_deleted: "0" },
      });
      if (!loginUserDetail) {
        failedMessage.message = "User not found, please try again.";
        return res.send(failedMessage);
      }
      let obj = { verified: true, isLogin: true }
      if (req.body.email) {
        obj.email = req.body.email.toString().toLowerCase()
      }
      if (req.body.mobile) {
        obj.mobile = req.body.mobile
      }
      if (loginUserDetail.otp == otp) {
        await model.User.update(
          obj,
          { where: { id: loginUserDetail.id } }
        );
        loginUserDetail.verified = true;
        loginUserDetail.isLogin = true;
        successMessage.data = loginUserDetail;
        successMessage.message = "OTP verify Successfully.";
        return res.send(successMessage);
      } else {
        failedMessage.message = "OTP not match. Please try again.";
        return res.send(failedMessage);
      }
    } catch (error) {
      console.log("changePasswordOTPRequest error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };
  module.login = async function (req, res) {
    //console.log('artist login req.body: ',req.body);
    var successMessage = {
      status: "success",
      message: "",
      image_url: "",
      data: {},
    };
    var failedMessage = { status: "fail", message: "", data: {} };
    try {
      var { mobile, loginType, countryCode } = req.body;
      if (!mobile) {
        failedMessage.message =
          "Please provide Mobile number, please try again";
        return res.send(failedMessage);
      }
      if (!countryCode) {
        failedMessage.message = "Please provide country code, please try again";
        return res.send(failedMessage);
      }

      // var email = req.body.email.toString().toLowerCase();
      // var password = md5(req.body.password);
      var loginDetail = await model.User.findOne({
        where: {
          countryCode,
          mobile,
          role: "user",
          is_deleted: "0",
        },
      });

      if (!loginDetail) {
        failedMessage.message = "Login details incorrect, please try again";
        return res.send(failedMessage);
      }

      var token = jwt.sign({ data: loginDetail.id }, config.jwt_secret, {
        expiresIn: config.jwt_expire,
      });
      const random4digitNumber = generateRandom4DigitNumber();
      console.log("🚀 ~ random4digitNumber:", random4digitNumber  )
      var inputData = {
        jwtLoginToken: token,
        // device_type: req.body.device_type,
        // device_token: req.body.device_token,
        is_login: "1",
        loginType,
        otp: random4digitNumber,
        updated_at: new Date(),
      };

      await loginDetail.update(inputData);
      // twilioMsg.messages.create({
      //   body: 'Dear Coustomer, your otp for verify is ' + random4digitNumber + '. Use this otp to verify.',
      //   from: "5093090585",
      //   to: `${countryCode}${mobile}`
      // }).then(async message => {
      //   console.log("yessss");
      //   // Create Player Object

      // }).catch(async error => {
      //   console.log(error);
      // })
      loginDetail = await model.User.findOne({
        where: { id: loginDetail.id, role: "user", is_deleted: "0" },
      });
      // successMessage.image_url = config.baseUrl ? config.baseUrl : "";
      successMessage.data = loginDetail
        ? { userId: loginDetail.id, otp: loginDetail.otp }
        : {};
      successMessage.message = "Logged in successfully, Please virify OTP";
      return res.send(successMessage);
    } catch (error) {
      console.log("login:::::::::::::::>>>>error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };

  module.facebookLogin = async function (req, res) {
    console.log("Artist API facebookLogin req.body: ", req.body);
    var successMessage = {
      status: "success",
      message: "",
      image_url: "",
      data: {},
    };
    var failedMessage = { status: "fail", message: "", data: {} };
    try {
      if (req.body.userType == "artist") {
        var socialUniqueLoginId = req.body.social_unique_login_id;
        var emailId = req.body.email;
        var loginDetail = await model.User.findOne({
          where: {
            social_unique_login_id: socialUniqueLoginId,
            email: emailId,
            role: "artist",
            is_deleted: "0",
          },
          raw: true,
        });

        if (loginDetail) {
          var token = jwt.sign({ data: loginDetail.id }, config.jwt_secret, {
            expiresIn: config.jwt_expire,
          });
          await model.User.update(
            { login_token: token, is_login: "1" },
            {
              where: {
                social_unique_login_id: socialUniqueLoginId,
                role: "artist",
              },
            }
          );
          loginDetail.login_token = token;
          successMessage.image_url = config.baseUrl;
          successMessage.data = loginDetail ? loginDetail : {};
          successMessage.message = "Logged in successfully";
          return res.send(successMessage);
        } else {
          var emailExist = await model.User.findOne({
            where: { email: emailId, role: "artist", is_deleted: "0" },
          });
          if (emailExist) {
            failedMessage.message = "This email ID already exists.";
            return res.send(failedMessage);
          }

          var userData = {
            artistname: req.body.username,
            firstname: req.body.first_name,
            lastname: req.body.last_name,
            email: emailId,
            social_unique_login_id: socialUniqueLoginId,
            is_login: "1",
            login_type: "facebook",
            role: "artist",
            device_type: req.body.device_type,
            device_token: req.body.device_token,
            updated_at: new Date(),
          };
          var loginDetails = await model.User.create(userData);
          if (loginDetails) {
            var token = jwt.sign({ data: loginDetails.id }, config.jwt_secret, {
              expiresIn: config.jwt_expire,
            });
            await model.User.update(
              { login_token: token },
              { where: { id: loginDetails.id, role: "artist" } }
            );
            loginDetails.login_token = token;

            if (loginDetails != null) {
              successMessage.image_url = config.baseUrl;
              successMessage.data = loginDetails ? loginDetails : {};
              successMessage.message = "Register successfully";
              return res.send(successMessage);
            } else {
              failedMessage.message =
                "Login details incorrect, please try again";
              return res.send(failedMessage);
            }
          } else {
            failedMessage.message = "User Detail not created.";
            return res.send(failedMessage);
          }
        }
      } else {
        failedMessage.message = "user type wrong, please try again";
        return res.send(failedMessage);
      }
    } catch (error) {
      console.log("facebookLogin:::::::::::::::>>>>error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };

  module.appleLogin = async function (req, res) {
    var successMessage = {
      status: "success",
      message: "",
      image_url: "",
      data: {},
    };
    var failedMessage = { status: "fail", message: "", data: {} };

    try {
      const { social_unique_login_id, email, firstName, lastName } = req.body;

      // // Verify the Apple ID token
      // const appleResponse = await appleSignin.verifyIdToken(id_token, {
      //   audience: config.apple_client_id, // Your Apple Client ID
      //   ignoreExpiration: false,
      // });
      if (!social_unique_login_id) {
        failedMessage.message = "Please provide the social_unique_login_id.";
        return res.send(failedMessage);
      }
      const socialUniqueLoginId = social_unique_login_id;
      const loginDetail = await model.User.findOne({
        where: {
          social_unique_login_id: socialUniqueLoginId,
          role: "user",
          is_deleted: "0",
        },
        raw: true,
      });

      if (loginDetail) {
        const token = jwt.sign({ data: loginDetail.id }, config.jwt_secret, {
          expiresIn: config.jwt_expire,
        });

        await model.User.update(
          { jwtLoginToken: token, verified: true, is_login: "1" },
          {
            where: {
              social_unique_login_id: socialUniqueLoginId,
              role: "user",
            },
          }
        );
        loginDetail.jwtLoginToken = token;
        successMessage.data = loginDetail ? loginDetail : {};
        successMessage.message = "Logged in successfully";
        return res.send(successMessage);
      } else {
        if (email) {
          const emailExist = await model.User.findOne({
            where: { email: email, role: "user", is_deleted: "0" },
          });

          if (emailExist) {
            failedMessage.message = "This email ID already exists.";
            return res.send(failedMessage);
          }
        }

        const userData = {
          firstName: firstName ? firstName : "",
          lastName: lastName ? lastName : "",
          email: email ? email : "",
          social_unique_login_id: socialUniqueLoginId,
          isLogin: "1",
          loginType: "apple",
          verified: true,
          role: "user",
          updated_at: new Date(),
        };

        const loginDetails = await model.User.create(userData);
        if (loginDetails) {
          const token = jwt.sign({ data: loginDetails.id }, config.jwt_secret, {
            expiresIn: config.jwt_expire,
          });

          await model.User.update(
            { jwtLoginToken: token },
            { where: { id: loginDetails.id, role: "user" } }
          );
          loginDetails.jwtLoginToken = token;

          successMessage.image_url = config.baseUrl;
          successMessage.data = loginDetails ? loginDetails : {};
          successMessage.message = "Register successfully";
          return res.send(successMessage);
        } else {
          failedMessage.message = "User Detail not created.";
          return res.send(failedMessage);
        }
      }
    } catch (error) {
      console.log("appleLogin:::::::::::::::>>>>error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };

  module.googleLogin = async function (req, res) {
    // console.log("API googleLogin req.body: ", req.body);
    var successMessage = {
      status: "success",
      message: "",
      image_url: "",
      data: {},
    };
    var failedMessage = { status: "fail", message: "", data: {} };
    // googleLoginWebUrl: '813216137488-v3m7are7ds9tchfir4tpf5bb44j1ef8k.apps.googleusercontent.com',

    try {
      var socialUniqueLoginId = req.body.social_unique_login_id;
      var emailId = req.body.email;
      var loginDetail = await model.User.findOne({
        where: {
          social_unique_login_id: socialUniqueLoginId,
          email: emailId,
          role: "user",
          is_deleted: "0",
        },
        raw: true,
      });

      if (loginDetail) {
        var token = jwt.sign({ data: loginDetail.id }, config.jwt_secret, {
          expiresIn: config.jwt_expire,
        });
        // const random4digitNumber = generateRandom4DigitNumber();
        await model.User.update(
          { jwtLoginToken: token, is_login: "1" },
          {
            where: {
              social_unique_login_id: socialUniqueLoginId,
              role: "user",
            },
          }
        );
        loginDetail.jwtLoginToken = token;
        // successMessage.image_url = config.baseUrl;
        successMessage.data = loginDetail ? loginDetail : {};
        successMessage.message = "Logged in successfully";
        return res.send(successMessage);
      } else {
        var emailExist = await model.User.findOne({
          where: { email: emailId, role: "user", is_deleted: "0" },
        });
        if (emailExist) {
          failedMessage.message = "This email ID already exists.";
          return res.send(failedMessage);
        }

        var userData = {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: emailId,
          social_unique_login_id: socialUniqueLoginId,
          isLogin: "1",
          loginType: "google",
          verified: true,
          role: "user",
          // device_type: req.body.device_type,
          // device_token: req.body.device_token,
          updated_at: new Date(),
        };
        // console.log("🚀 ~ userData:", userData)
        var loginDetails = await model.User.create(userData);
        if (loginDetails) {
          var token = jwt.sign({ data: loginDetails.id }, config.jwt_secret, {
            expiresIn: config.jwt_expire,
          });
          await model.User.update(
            { jwtLoginToken: token },
            { where: { id: loginDetails.id, role: "user" } }
          );
          loginDetails.jwtLoginToken = token;

          if (loginDetails != null) {
            successMessage.image_url = config.baseUrl;
            successMessage.data = loginDetails ? loginDetails : {};
            successMessage.message = "Register successfully";
            return res.send(successMessage);
          } else {
            failedMessage.message = "Login details incorrect, please try again";
            return res.send(failedMessage);
          }
        } else {
          failedMessage.message = "User Detail not created.";
          return res.send(failedMessage);
        }
      }
    } catch (error) {
      console.log("googleLogin:::::::::::::::>>>>error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };

  module.qrScan = async function (req, res) {
    var successMessage = {
      status: "success",
      message: "",
      data: [],
    };
    var failedMessage = { status: "fail", message: "", data: {} };

    const { productId, userId } = req.body;

    // Validate input
    if (!productId) {
      failedMessage.message = "Please provide productId, please try again";
      return res.status(400).send(failedMessage); // Returning 400 for bad request
    }
    if (!userId) {
      failedMessage.message = "Please provide userId, please try again";
      return res.status(400).send(failedMessage); // Returning 400 for bad request
    }

    try {

      // Fetch details from Bags model
      const details = await model.Bags.findAll({
        where: { productId, isExpired: false },
        raw: true,
      });
      // Check if details are available
      if (!details || details.length === 0) {
        failedMessage.message = "Product not found or invalid product ID. Please check the product ID and try again.";
        return res.status(404).send(failedMessage); // Return 404 if no data found

      }
      console.log("details[0].status", details[0]);
      console.log("details[0].status", details[0].status);

      if (details[0].status) {
        console.log("used -----------------");

        failedMessage.message = "This product ID is used. Please check the product ID and try again.";
        return res.status(404).send(failedMessage); // Return 404 if no data found
      }

      // Fetch coupon details asynchronously using Promise.all
      const couponData = await Promise.all(
        details.map(async (bag) => {
          const coupon_id = bag.coupon_id;
          const brand_id = bag.brand_id;
          const brandDetail = await model.Brand.findOne({
            where: { id: brand_id },
            raw: true,
          });
          // Check if userId is a string and convert it to an integer
          if (typeof userId === 'string') {
            userId = parseInt(userId, 10); // Convert string to integer
          }
          console.log("userId", userId);
          var userDetail = await model.User.findOne({
            where: {
              id: userId,
              role: "user",
              is_deleted: "0",
            },
            raw: true
          });
          let username = ""
          if (userDetail) {
            username = `${userDetail.firstName} ${userDetail.lastName}`
          }
          let dsf = await model.Coupon.update(
            { userId, userName: username, status: "used" },
            {
              where: { id: coupon_id, isExpired: false },
              raw: true,
            }
          );
          // console.log("dsf", dsf);

          const couponDetail = await model.Coupon.findOne({
            where: { id: coupon_id, isExpired: false },
            raw: true,
          });
          await model.CouponRecords.create({
            productId,
            userId,
            couponId: coupon_id,
          });

          await model.Bags.update({ status: true, }, {
            where: { productId, isExpired: false },
            raw: true,
          });
          // if(couponDetail){
          //   couponDetail.image
          // }
          if (brandDetail && brandDetail.brandLogo) {
            couponDetail.brandLogo = brandDetail.brandLogo ? brandDetail.brandLogo : "";
            couponDetail.brandName = brandDetail.brandName ? brandDetail.brandName : ""
          } else { }
          return couponDetail;
        })
      );

      // Filter out any null or undefined values (in case some coupons are not found)
      const validCoupons = couponData.filter((coupon) => coupon);

      // Check if we found any valid coupon data
      if (validCoupons.length > 0) {
        successMessage.data = validCoupons;
        return res
          .status(200)
          .send({ status: "success", message: "", data: validCoupons }); // Return success response with data
      }

      // If no valid coupons were found
      failedMessage.message = "No valid coupon data found";
      return res.status(404).send(failedMessage);
    } catch (error) {
      console.error("qrScan:::::::::::::::>>>>error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.status(500).send(failedMessage); // Return 500 for server errors
    }
  };

  module.updateStatus = async function (req, res) {
    var successMessage = {
      status: "success",
      message: "",
      data: [],
    };
    var failedMessage = { status: "fail", message: "", data: {} };

    const { couponCode } = req.body;

    if (!couponCode) {
      failedMessage.message = "Please provide couponCode, please try again";
      return res.status(400).send(failedMessage); // Returning 400 for bad request
    }
    const couponDetail = await model.Coupon.findOne({
      where: { couponCode },
      raw: true,
    });
    if (!couponDetail) {
      failedMessage.message =
        "Coupon code is not found or wrong coupon, please try again";
      return res.status(400).send(failedMessage); // Returning 400 for bad request
    }
    try {
      // Fetch details from Bags model
      await model.Coupon.update(
        { status: "used" },
        {
          where: { couponCode },
          raw: true,
        }
      );

      return res
        .status(200)
        .send({ status: "success", message: "Status Updated Successfully." }); // Return success response with data
    } catch (error) {
      console.error("qrScan:::::::::::::::>>>>error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.status(500).send(failedMessage); // Return 500 for server errors
    }
  };

  module.redeemCoupon = async function (req, res) {
    var successMessage = {
      status: "success",
      message: "",
      data: {},
    };
    var failedMessage = { status: "fail", message: "", data: {} };
    const { couponId, couponCode, userId } = req.body;
    if (!couponId && !couponCode) {
      failedMessage.message = "Please provide couponId or couponCode.";
      return res.status(400).send(failedMessage);
    }
    try {
      const whereClause = couponId ? { id: couponId } : { couponCode };
      const couponDetail = await model.Coupon.findOne({ where: whereClause, raw: true,});
      if (!couponDetail) {
        failedMessage.message = "Coupon not found.";
        return res.status(404).send(failedMessage);
      }
      if (couponDetail.isExpired) {
        failedMessage.message = "Coupon is expired and cannot be redeemed.";
        return res.status(400).send(failedMessage);
      }
      await model.Coupon.update({ status: "used", assignStatus: "assigned", }, { where: whereClause,});
      if (userId || couponDetail.userId) {
        const targetUserId = userId || couponDetail.userId;
        const existingRecord = await model.CouponRecords.findOne({ where: { userId: targetUserId, couponId: couponDetail.id,},});
        if (existingRecord) {
          await existingRecord.update({ status: "used"});
        } else if (model.CouponRecords) {
          await model.CouponRecords.create({ userId: targetUserId, productId: couponDetail.productId || "0", couponId: couponDetail.id, status: "used"});
        }
      }
      const updatedCoupon = await model.Coupon.findOne({ where: whereClause, raw: true, });
      successMessage.message = "Coupon redeemed successfully.";
      successMessage.data = updatedCoupon;
      return res.status(200).send(successMessage);
    } catch (error) {
      console.error("redeemCoupon error:", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.status(500).send(failedMessage);
    }
  };

  module.getMyCoupon = async function (req, res) {
    var successMessage = {
      status: "success",
      message: "",
      data: [],
    };

    var failedMessage = { status: "fail", message: "", data: {} };

    const { userId } = req.body;

    if (!userId) {
      failedMessage.message = "Please provide userId, please try again";
      return res.status(400).send(failedMessage); // Returning 400 for bad request
    }

    try {
      // Fetch details from the Coupon model
      const recodrds = await model.CouponRecords.findAll({
        where: { userId },
        attributes: ['coupon_id'],
        group: ['coupon_id','product_Id'],
        raw: true
      });
      console.log("recodrds:", recodrds);
console.log("recodrds count:", recodrds.length);
      const idsArray = recodrds.map(i => i.coupon_id);
      console.log("idsArray", idsArray);
      const details = await model.Coupon.findAll({
        where: {
          id: { [Op.in]: idsArray },
          assignStatus: "unassigned",
          isExpired: false
        },
        order: [["createdAt", "DESC"]],

      });
      console.log("details", details);
      console.log("details count:", details.length);


      // Check if details are available
      if (!details || details.length === 0) {
        failedMessage.message = "Data not found";
        return res.status(200).send({ status: "success", message: "", data: [] }); // Return success but with empty data
      }

      // Process coupon details
      const couponData = await Promise.all(
        details.map(async (coupon) => {
          const brand_id = coupon.brand_id;
          const brandDetail = await model.Brand.findOne({
            where: { id: brand_id },
            raw: true,
          });

          // console.log("🚀 ~ details.map ~ brandDetail:", brandDetail)
          // Add brand logo if available
          if (brandDetail && brandDetail.brandLogo) {
            coupon.brandLogo = brandDetail.brandLogo;
            coupon.brandName = brandDetail.brandName
          }
          return coupon; // Return individual coupon with the added brandLogo if available
        })
      );
console.log("couponData", couponData);
      // Return success response with data
      return res
        .status(200)
        .send({ status: "success", message: "", data: couponData });

    } catch (error) {
      console.error("qrScan:::::::::::::::>>>>error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.status(500).send(failedMessage); // Return 500 for server errors
    }
  };


  module.forgotPassword = async function (req, res) {
    console.log("artist forgotPassword req body---", req.body);
    var successMessage = { status: "success", message: "", data: {} };
    var failedMessage = { status: "fail", message: "", data: {} };
    try {
      var emailId = req.body.email_id.toString().toLowerCase();
      var loginUserDetail = await model.User.findOne({
        where: { email: emailId, role: "artist", is_deleted: "0" },
      });
      if (!loginUserDetail) {
        failedMessage.message = "User detail wrong, please try again.";
        return res.send(failedMessage);
      }

      let updateUserDetail = { updated_at: new Date() };
      // var passwordToken = md5(loginUserDetail.email);
      var passwordToken = Math.floor(100000 + Math.random() * 900000);

      var transporter = nodemailer.createTransport({
        //service: 'gmail',
        host: config.smtp_host,
        port: config.smtp_port,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass,
        },
      });

      var mailOptions = {
        from: config.smtp_user,
        to: loginUserDetail.email,
        subject: "RLGD-Music-Streaming: Forgot Password",
        html:
          "<p>Hello your Forgot Password token is: <b>" +
          passwordToken +
          " </b></p>",
        //html: '<p>Hello ' + loginUserDetail.username + ',<br><br> You have reset your password <a href="'+config.baseUrl+'artistApi/resetPassword/'+passwordToken+'">click here</a></p>'
      };

      var send = await transporter.sendMail(mailOptions);
      if (send) {
        updateUserDetail.password_token = passwordToken;
        await loginUserDetail.update(updateUserDetail);
        var loginUserDetails = await model.User.findOne({
          where: { id: loginUserDetail.id, role: "artist", is_deleted: "0" },
        });
        successMessage.data = loginUserDetails;
        successMessage.message =
          "Forgot Password Link sent on your email address";
        return res.send(successMessage);
      } else {
        failedMessage.message = "Forgot Password email Error, please try again";
        return res.send(failedMessage);
      }
    } catch (error) {
      console.log("forgotPassword error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };

  module.resetPassword = async function (req, res) {
    //console.log('listener resetPassword req body---', req.body);
    var successMessage = { status: "success", message: "", data: {} };
    var failedMessage = { status: "fail", message: "", data: {} };
    try {
      var passwordToken = req.body.password_token;
      var loginUserDetail = await model.User.findOne({
        where: {
          password_token: passwordToken,
          role: "artist",
          is_deleted: "0",
        },
      });
      if (!loginUserDetail) {
        failedMessage.message =
          "reset password token not match, please try again.";
        return res.send(failedMessage);
      }

      let updateUserDetail = { updated_at: new Date() };
      if (req.body.new_password) {
        updateUserDetail.password = md5(req.body.new_password);
      }
      if (req.body.new_password == req.body.confirm_new_password) {
        updateUserDetail.password_token = "";
        await loginUserDetail.update(updateUserDetail);

        var loginUserDetails = await model.User.findOne({
          where: { id: loginUserDetail.id, role: "artist", is_deleted: "0" },
        });
        successMessage.data = loginUserDetails;
        successMessage.message = "your password change Successfully";
        return res.send(successMessage);
      } else {
        failedMessage.message =
          "new password and confirm new password not match. Please try again.";
        return res.send(failedMessage);
      }
    } catch (error) {
      console.log("resetPassword error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };

  module.viewUserProfile = async function (req, res) {
    console.log("artist viewUserProfile req body---", req.body);
    var successMessage = { status: "success", message: "", data: {} };
    var failedMessage = { status: "fail", message: "", data: {} };
    try {
      var loginUserID = req.query.userId;
      var loginUserDetail = await model.User.findOne({
        where: { id: loginUserID, role: "user", is_deleted: "0" },
      });
      if (!loginUserDetail) {
        failedMessage.message = "User detail wrong, please try again.";
        return res.send(failedMessage);
      }

      successMessage.data = { userData: loginUserDetail };
      successMessage.message = "Successfully view user detail.";
      return res.send(successMessage);
    } catch (error) {
      console.log("viewUserProfile error---- ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };

  module.editUserProfile = async function (req, res) {
    console.log("user editUserProfile req body---", req.body);
    var successMessage = { status: "success", message: "", data: {} };
    var failedMessage = { status: "fail", message: "", data: {} };
    try {
      let ermailUpdate = false
      let phoneUpdate = false
      var loginUserID = req.body.userId;
      var loginUserDetail = await model.User.findOne({
        where: { id: loginUserID, role: "user", is_deleted: "0" },
      });
      if (!loginUserDetail) {
        failedMessage.message = "User detail wrong, please try again.";
        return res.send(failedMessage);
      }


      let updateUserDetail = { updated_at: new Date() };
      if (req.body.firstName) {
        updateUserDetail.firstName = req.body.firstName
          .toString()
          .toLowerCase();
        // updateUserDetail.lastName = req.body.?lastName.toString().toLowerCase();
      }
      if (req.body.lastName) {
        updateUserDetail.lastName = req.body.lastName.toString().toLowerCase();
      }
      const random4digitNumber = generateRandom4DigitNumber();

      if (req.body.email) {
        ermailUpdate = loginUserDetail.email === req.body.email.toString().toLowerCase() ? false : true
        if (ermailUpdate) {
          console.log("config-----------", config);
          const userCount = await model.User.count({
            where: { email: req.body.email.toString().toLowerCase(), is_deleted: "0" },
          });
          if (userCount) {
            failedMessage.message = `This email address is already registered. Please enter a different email address."`;
            return res.send(failedMessage);
          }

          // const transporter = nodemailer.createTransport({
          //   host: config.smtp_host,
          //   port: config.smtp_port,
          //   secure: true,
          //   auth: {
          //     user: config.smtp_user,
          //     pass: config.smtp_pass,
          //   },
          // });
          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // Use SSL
            auth: {
              user: 'aissmtp1234@gmail.com',
              pass: 'upopxmvmkixwralg',
            },
          });

          const mailOptions = {
            from: config.smtp_user,
            to: req.body.email.toString().toLowerCase(),
            subject: " Update Email Address",
            html:
              "<p>Hello your verify OTP  is: <b>" +
              random4digitNumber +
              " </b></p>",
            //html: '<p>Hello ' + loginUserDetail.username + ',<br><br> You have reset your password <a href="'+config.baseUrl+'artistApi/resetPassword/'+passwordToken+'">click here</a></p>'
          };
          updateUserDetail.otp = random4digitNumber
          // var send = await transporter.sendMail(mailOptions);
          const send = await transporter.sendMail(mailOptions);
          // console.log("send",send);

        }
        // updateUserDetail.email = req.body.email.toString().toLowerCase();
      }
      if (req.body.mobile) {
        phoneUpdate = loginUserDetail.mobile === req.body.mobile ? false : true
        // updateUserDetail.mobile = req.body.mobile;
        if (phoneUpdate) {
          const numberCount = await model.User.count({
            where: { mobile: req.body.mobile, is_deleted: "0" },
          });
          if (numberCount) {
            failedMessage.message = `"This mobile number is already registered. Please enter a different mobile number."`;
            return res.send(failedMessage);
          }
          updateUserDetail.otp = random4digitNumber;
          updateUserDetail.verified = "0";

          // twilioMsg.messages.create({
          //   body: 'Dear Coustomer, your otp for verify is ' + random4digitNumber + '. Use this otp to verify.',
          //   from: "5093090585",
          //   to: `${req.body.countryCode}${req.body.mobile}`
          // }).then(async message => {
          //   console.log("yessss");
          //   // Create Player Object

          // }).catch(async error => {
          //   console.log(error);
          // })
        }
      }
      if (req.body.countryCode) {
        updateUserDetail.countryCode = req.body.countryCode;
      }

      //image
      let image_name = "";
      if (req.files != null) {
        if (req.files.profile_image) {
          if (loginUserDetail.image != "upload/user/default.jpg") {
            fs.unlink("./public/" + loginUserDetail.image, function (err) { });
          }
          let profile_images = req.files.profile_image;
          console.log("profile_images---", profile_images);
          var tempNum = helper.randomNumber(4);
          var datetime = dateformat(currentDate, "yyyymmddHHMMss");
          image_name = "upload/user/" + datetime + tempNum + ".jpg";
          console.log("image_name----", image_name);
          profile_images.mv(
            "./public/" + image_name,
            async function (uploadErr) { }
          );
          updateUserDetail.profilePic = image_name;
        }
      }

      await loginUserDetail.update(updateUserDetail);
      //Start: All album artist name update

      //End: All album artist name update
      var loginUserDetails = await model.User.findOne({
        where: { id: loginUserID, role: "user", is_deleted: "0" },
      });
      successMessage.data = loginUserDetails;
      successMessage.isEmailUpdate = ermailUpdate
      successMessage.isphoneNumberUpdate = phoneUpdate
      successMessage.message = "Successfully update user detail.";
      console.log("successMessage", successMessage);


      return res.send(successMessage,);
    } catch (error) {
      console.log("auth userProfile error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };

  module.changePasswordOTPRequest = async function (req, res) {
    //console.log('artist changePasswordOTPRequest req body---', req.body);
    var successMessage = { status: "success", message: "", data: {} };
    var failedMessage = { status: "fail", message: "", data: {} };
    try {
      var loginUserID = req.body.user_id;
      var loginUserDetail = await model.User.findOne({
        where: { id: loginUserID, role: "artist", is_deleted: "0" },
      });
      if (!loginUserDetail) {
        failedMessage.message = "User detail wrong, please try again.";
        return res.send(failedMessage);
      }

      if (loginUserDetail.email == req.body.current_email) {
        let updateUserDetail = { updated_at: new Date() };

        var passwordOtp = helper.randomNumber(4);
        var transporter = nodemailer.createTransport({
          //service: 'gmail',
          host: config.smtp_host,
          port: config.smtp_port,
          auth: {
            user: config.smtp_user,
            pass: config.smtp_pass,
          },
        });
        var mailOptions = {
          from: config.smtp_user,
          to: loginUserDetail.email,
          subject: "RLGD-Music-Streaming: Change Password Verify OTP",
          html:
            "<p>Hello your Change Password Verify OTP is: <b>" +
            passwordOtp +
            " </b></p>",
        };

        var send = await transporter.sendMail(mailOptions);
        if (send) {
          updateUserDetail.password_otp = passwordOtp;
          await loginUserDetail.update(updateUserDetail);
          var loginUserDetails = await model.User.findOne({
            where: { id: loginUserID, role: "artist", is_deleted: "0" },
            attributes: ["id", "email", "password_otp"],
            raw: true,
          });
          successMessage.data = loginUserDetails;
          successMessage.message =
            "Change password update OTP Request send Successfully Please Verify.";
          return res.send(successMessage);
        } else {
          failedMessage.message =
            "Change password update OTP Error, please try again";
          return res.send(failedMessage);
        }
      } else {
        failedMessage.message =
          "User current email not march. Please try again.";
        return res.send(failedMessage);
      }
    } catch (error) {
      console.log("changePasswordOTPRequest error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };

  module.changePasswordOTPVerify = async function (req, res) {
    console.log("artist changePasswordOTPRequest req body---", req.body);
    var successMessage = { status: "success", message: "", data: {} };
    var failedMessage = { status: "fail", message: "", data: {} };
    try {
      var loginUserID = req.body.user_id;
      var loginUserDetail = await model.User.findOne({
        where: { id: loginUserID, role: "artist", is_deleted: "0" },
      });
      if (!loginUserDetail) {
        failedMessage.message = "User detail wrong, please try again.";
        return res.send(failedMessage);
      }
      if (loginUserDetail.password_otp == req.body.password_otp) {
        successMessage.data = loginUserDetail;
        successMessage.message = "Change password OTP verify Successfully.";
        return res.send(successMessage);
      } else {
        failedMessage.message = "password OTP not march. Please try again.";
        return res.send(failedMessage);
      }
    } catch (error) {
      console.log("changePasswordOTPRequest error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };

  module.changePassword = async function (req, res) {
    console.log("artist changePassword req body---", req.body);
    var successMessage = { status: "success", message: "", data: {} };
    var failedMessage = { status: "fail", message: "", data: {} };
    try {
      var loginUserID = req.body.user_id;
      var loginUserDetail = await model.User.findOne({
        where: { id: loginUserID, role: "artist", is_deleted: "0" },
      });
      if (!loginUserDetail) {
        failedMessage.message = "User detail wrong, please try again.";
        return res.send(failedMessage);
      }

      if (loginUserDetail.password_otp == req.body.password_otp) {
        var checkpassword = md5(req.body.old_password);
        if (checkpassword == loginUserDetail.password) {
          let updateUserDetail = { updated_at: new Date() };
          if (req.body.new_password) {
            updateUserDetail.password = md5(req.body.new_password);
            updateUserDetail.password_otp = "";
          }
          if (req.body.new_password == req.body.confirm_new_password) {
            await loginUserDetail.update(updateUserDetail);
            var loginUserDetails = await model.User.findOne({
              where: { id: loginUserID, role: "artist", is_deleted: "0" },
            });
            successMessage.data = loginUserDetails;
            successMessage.message = "your password change Successfully.";
            return res.send(successMessage);
          } else {
            failedMessage.message =
              "new password and confirm new password not match. Please try again.";
            return res.send(failedMessage);
          }
        } else {
          failedMessage.message =
            "User old password not match. Please try again.";
          return res.send(failedMessage);
        }
      } else {
        failedMessage.message = "password OTP not march. Please try again.";
        return res.send(failedMessage);
      }
    } catch (error) {
      console.log("changePassword error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };
  module.logout = async function (req, res) {
    try {
      const userId = req.body.userId;
      if (!userId) {
        return res.status(400).json({ error: "Please provide UserId." });
      }
      let user = await model.User.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(400).json({ error: "User not found." });
      }

      if (!user.jwtLoginToken) {
        return res
          .status(400)
          .json({ error: "No active session found. Please log in first." });
      }

      user.jwtLoginToken = null; // Remove the token
      user.isLogin = "0"; // Set is_login to false
      await user.save(); // Save the updated user information

      res.status(200).json({ message: "Logged out successfully." });
    } catch (error) {
      console.error("Error during logout:", error);
      res
        .status(500)
        .json({ error: "Something went wrong.", details: error.message });
    }
  };

  module.getCmsPage = async function (req, res) {
    try {
      let start = parseInt(req.query.start);
      let length = parseInt(req.query.length);
      let query = {};
      let cmsCount = await model.Cms.count(query);
      let cms = await model.Cms.findAll(query, length, start, { raw: true });
      var obj = {
        draw: req.query.draw,
        recordsTotal: cmsCount,
        recordsFiltered: cmsCount,
        data: cms,
      };
      return res.send(obj);
    } catch (e) {
      console.log("cmsController getCmsPage Error", e);
      return new Error("cmsController getCmsPage Error", e);
    }
  };

  module.deleteUserAccount = async function (req, res) {
    var successMessage = { status: "success", message: "", data: {} };
    var failedMessage = { status: "fail", message: "", data: {} };
    try {
      var loginUserID = req.body.userId;
      // console.log("🚀 ~ module.deleteUserAccount ~ loginUserID:", loginUserID)
      var loginUserDetail = await model.User.findOne({
        where: { id: loginUserID, role: "user", is_deleted: "0" },
      });
      if (!loginUserDetail) {
        failedMessage.message = "User detail wrong, please try again.";
        return res.send(failedMessage);
      }

      let updateUserDetail = {
        isDeleted: "1",
        verified: false,
        isLogin: "0",
        status: "inactive",
        updated_at: new Date(),
      };

      await loginUserDetail.update(updateUserDetail);

      successMessage.data = [];
      successMessage.message = "Successfully deleted your account.";
      return res.send(successMessage);
    } catch (error) {
      console.log("auth userProfile error: ", error);
      failedMessage.message = "Something went wrong, please try again";
      return res.send(failedMessage);
    }
  };
  return module;
};
function generateRandom4DigitNumber() {
  return Math.floor(1000 + Math.random() * 9000);
}

function generatePassword(length) {
  var chars = "0123456789abcdefghijklmnopqrstuvwxyz#$%^&@";
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
