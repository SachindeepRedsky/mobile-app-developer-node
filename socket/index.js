var flag = true;
// var lowerCase = require('lower-case');
var moment =require('moment')

module.exports = function(model, io, client){
	var config = require('../config/constants.js');
	
	//Start: User Notification Send
	client.on('sendUserNotification', async function(data, callback){
		console.log("sendUserNotification: ", data)
		var notificationMsg = data.notification_msg;
		if(data.user_type != ""){
			if(data.user_type == "all"){
				//var userType = {$in:['casher','washare']};
				var userType = data.user_type;
		    }else{
		    	var userType = data.user_type;
		    }
			//var userC = await model.User.find({role:userType,"is_deleted":"0"}).lean();
			var userC = await model.User.findAll({role: userType, "is_deleted":"0", raw: true});
		}

		if(data.user_ids.length > 0){
			//var userC = await model.User.find({'_id':{$in:data.user_ids},"is_deleted":"0"}).lean();
			var userC = await model.User.findAll({role: userType, "is_deleted":"0", raw: true});
		}
		console.log('userC--------------', userC);

		if(userC.length > 0){
			for(var i=0; i<userC.length; i++){
				var deviceType = userC[i].device_type;
				var deviceToken = userC[i].device_token;
				var userRole = userC[i].role;

				if(deviceType != "" && deviceToken != ""){
					NotificationPostData = {};
					NotificationPostData.message = notificationMsg;
					NotificationPostData.device_type = deviceType;
					NotificationPostData.device_token = deviceToken;
					NotificationPostData.notification_data = {status:'brodcast_notification','message':notificationMsg,'user_id':userC[i]._id};
								
					NotificationPostData.AppUser = "foodUser";
					NotificationPostData.notification_title = 'Food App';

					console.log("NotificationPostData: ", NotificationPostData);
					helper.pushNotification(NotificationPostData);

					var notificationData = {
						'user_id':userC[i]._id,
						'message':notificationMsg,
						'type':'broadcast',
					};
					console.log('notificationData---', notificationData);
					await model.UserNotification.create(notificationData)
				}
			}

			return callback({'status':'true',"message":"Notification send successfully."});
		}
	});
	//END: User Notification Send

	
}	
	