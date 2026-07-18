var jwt = require("jsonwebtoken");

module.exports = function (model) {
  var module = {};
  module.login = async function (req, res, next) {
    var data = {};
    let token = req.headers.token;
    /* console.log('middleware token---', token);
		console.log('config.jwt_secret -->', config.jwt_secret ); */
    //var api = req.originalUrl;

    jwt.verify(token, config.jwt_secret, async function (err, decoded) {
      if (!err) {
        var userId = req.body.userId ? req.body.userId : req.query.userId;

        // console.log('userId -->', userId);

        if (userId && userId != "") {
          //let userData = await model.User.findOne({_id: userId, login_token: token},{_id:1, status:1});
          let userData = await model.User.findOne({
            where: { id: userId, jwtLoginToken: token },
          });
          if (userData) {
            if (userData.status == "active") {
              next();
            } else {
              return res
                .status(401)
                .send({
                  status: "userBlock",
                  message: "This account has been blocked!",
                });
            }
          } else {
            return res
              .status(401)
              .send({
                status: "userDataError",
                message: "Please Login!",
                data: data,
              });
          }
        } else {
          return res
            .status(401)
            .send({
              status: "userIdError",
              message: "Please Login!",
              data: data,
            });
        }
      } else {
        console.log(
          "login::::::::::::>>>>>userId: ",
          userId,
          " token: ",
          token,
          " err: ",
          err
        );
        return res
          .status(401)
          .send({
            status: "jwtTokenError",
            message: "Please Login!",
            data: data,
          });
      }
    });
  };

  return module;
};
