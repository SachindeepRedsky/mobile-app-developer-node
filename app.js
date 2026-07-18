
require('dotenv').config()

var express = require('express');
var app = express();

const port = process.env.PORT || process.env.SERVER_PORT || 8080;
var flash = require('connect-flash');
var path = require('path');
var cookieParser = require('cookie-parser');
global.moment = require('moment');
var fs = require('fs');
var session = require('express-session');
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');
let dateFormat = require("dateformat")
var fileUpload = require('express-fileupload');
const expressValidator = require('express-validator');
//var Sequelize = require('sequelize');
var nunjucks = require('nunjucks');
global.now = new Date();
global.dateFormat = dateFormat;
const cron = require('node-cron');


if (process.env.NODE_ENV == "production") {
  var server = require('http').createServer(app);
} else {
  var server = require('http').createServer(app);
}
global.io = require('socket.io')(server);

var Sequelize = require('sequelize');
global.Sequelize = Sequelize;
var sequelizeDB = require('./config/database.js')(Sequelize);
global.sequelize1 = sequelizeDB;

require('./config/logconfig.js');

global.config = require('./config/constants.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
nunjucks.configure('app/views', {
  autoescape: false,
  express: app,
  watch: false
});
app.set('view engine', 'html');

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(cookieSession({
  name: 'session',
  keys: ["millionscrashcookie"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(flash());
app.use(fileUpload());

var model = require('./app/models/mysql/index')(Sequelize, sequelizeDB);
var controllers = require('./app/controllers/index')(model);
require('./routes/index.js')(app, model, controllers);
global.helper = require('./app/helpers/helpers.js');

app.set('port', port);
var config = require("./config/constants.js");
server.listen(port, '0.0.0.0', function () {
  console.log("(---------------------------------)");
  console.log("|         Server Started...       |");
  console.log("|   " + process.env.BASE_URL + "  |" );
  console.log("(---------------------------------)");
});
var credentials = require("./config/app.js");
global.twilioMsg = require("twilio")(
  credentials.twilio.accountSid,
  credentials.twilio.authToken
);
var socket_count = 0;
cron.schedule('0 0 * * *', async () => { // This runs daily at midnight
  try {
      // Get all campaigns with expiryDate not null or empty
      const campaigns = await model.Campaign.findAll({
          where: {
              expiryDate: { [Op.ne]: null }
          }
      });

      for (const campaign of campaigns) {
          const availableCoupons = await model.Coupon.findAll({
              where: {
                  campaignId: campaign.id,
                  status: "unused",
              },
              raw: true,
          });

          const today = new Date();
          for (const coupon of availableCoupons) {
            if(coupon.expiryDate){
              if (new Date(coupon.expiryDate) > today) {
                  // Update coupon's isExpired field to true
                  await model.Coupon.update(
                      { isExpired: true },
                      { where: { id: coupon.id } }
                  );
              }
            }
          }

          // Update campaign's isExpired field if all its coupons are expired
          const allExpired = availableCoupons.every(coupon => new Date(coupon.expiryDate) <= today);
          await model.Campaign.update(
              { isExpired: allExpired },
              { where: { id: campaign.id } }
          );
      }
  } catch (error) {
      console.error('Error in cron job:', error);
  }
});
io.on('connection', function (client) {
  socket_count++;
  io.emit('count', socket_count);
  console.log("Socket connection established", socket_count);
  require('./socket/index')(model, io, client);
  client.on('disconnect', function () {
    socket_count--;
    io.emit('count', socket_count);
    console.log("Socket disconnected", socket_count);
  });

});

require('./config/error.js')(app);



module.exports = { app: app, server: server }
