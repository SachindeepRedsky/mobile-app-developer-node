var sha224 = require('js-sha256').sha224;

const nodemailer = require("nodemailer");
var requestM = require('request');

module.exports.sendMail = async function (data) {
	console.log("data---", data);
	try {
		let transporter = nodemailer.createTransport({
			host: config.smtpMailer.host,
			port: config.smtpMailer.port,
			secure: true,
			auth: {
				user: config.smtpMailer.user,
				pass: config.smtpMailer.pass
			}
		});

		let info = await transporter.sendMail({
			from: (data.form) ? data.form : config.smtpMailer.smtp_sender_mail_id,
			to: data.to,
			subject: data.subject,
			html: data.html
		});

		return info;
	} catch (error) {
		console.log("SendMail email send error: ", error)
		return false;
	}
};
module.exports.getTimeDiff = function (start, end, type) {
	try {
		var diff = end - start;

		if (type == 'day') {
			diff = Math.floor(diff / 1000 / 60 / 60 / 24);
		} else if (type == 'hour') {
			diff = Math.floor(diff / 1000 / 60 / 60);
		} else if (type == 'minute') {
			diff = Math.floor(diff / 1000 / 60);
		} else {
			diff = Math.floor(diff / 1000);
		}
		console.log("diff---->>>",diff);
		return diff;
	}
	catch (e) {
		console.log("Helper helpers getTimeDiff Error", e);
		return new Error('Helper helpers getTimeDiff Error', e);
	}
},
	module.exports.gameNumber = function (length) {
		var chars = '0123456789';
		var result = '';
		for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];

		return result;
	};

module.exports.randomString = function (length) {
	var chars = '0123456789abcdefghijklmnopqrstuvwxyz';
	var result = '';
	for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
	return result;
};

module.exports.roundNumber = function () {
	return Math.random();
};

module.exports.gameHash = function (roundNumber, hashSalt) {
	return sha224(roundNumber + hashSalt);
};

module.exports.randomOnlyNumber = function (length) {
	var chars = '0123456789';
	var result = '';
	for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
	return result;
};

module.exports.randomNumber = function (length) {
	var chars = '0123456789';
	var result = '';
	for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];

	return result;
};


module.exports.getRandomFloat = function (min, max) {
	var float_val = Math.random() * (max - min) + min;
	return float_val.toFixed(2);
};

module.exports.getRandomInt = function (min, max) {
	var reandomNo = Math.floor(Math.random() * (max - min + 1) + min);
	return reandomNo;
};

module.exports.randomFloat = function () {
	return Math.random();
};

module.exports.enc = function (pswd, id) {
	try {
		var temp = '';
		console.log('enc------>>>pswd: ',pswd,' id: ',id);
		if (pswd) {
			var dt = new Date();
			var k = 0;
			for (let i = 0; i < 3; i++) {
				temp += pswd.substr(k, 8) + id.substr(k, 8);
				k += 8;
			}
			temp += pswd.substr(k, 8);
			temp += dt.getTime();
			temp = temp.toUpperCase();
		}
		return temp;
	} catch (e) {
		console.log("Helper helpers enc Error", e);
		return new Error('Helper helpers enc Error', e);
	}
}
// module.exports.enc = function (pswd, id) {
//     let temp = '';
//     console.log('enc------>>>pswd: ', pswd, ' id: ', id);

//     if (pswd && id) {
//         const dt = new Date();
//         const timestamp = dt.getTime();
        
//         // Ensure the strings are long enough
//         const minLength = Math.min(pswd.length, id.length);
        
//         // Concatenate up to the minimum length of either string
//         for (let i = 0; i < minLength; i += 8) {
//             // Take up to 8 characters from the password
//             temp += pswd.substr(i, 8);

//             // Take up to 9 characters from the ID
//             temp += id.substr(i, 9);
//         }

//         // If the password is longer, add the remaining part
//         if (pswd.length > minLength) {
//             temp += pswd.substr(minLength, pswd.length - minLength);
//         }

//         // Add timestamp
//         temp += timestamp;

//         // Convert to uppercase
//         temp = temp.toUpperCase();
//     }

//     console.log("tmp-----", temp);

//     return temp;
// }

module.exports.dec = function (txt) {
	console.log("txt",txt,txt.length);
	try {
		var obj = null;
		if (txt && txt.length > 66) {
			var id = '';
			var pswd = '';
			var time = '';

			txt = txt.toLowerCase();
			var k = 0;
			var check = 0;
			for (let i = 0; i < 7; i++) {
				if (check == 1) {
					id += txt.substr(k, 8);
					check = 0;
				} else {
					pswd += txt.substr(k, 10);
					check = 1;
				}
				k += 8;
			}
			time += txt.substr(k);

			obj = {
				id: id,
				pswd: pswd,
				time: time
			};
		}
		console.log("obj----------",obj);
		
		return obj;
	} catch (e) {
		console.log("Helper helpers dec Error", e);
		return new Error('Helper helpers dec Error', e);
	}
}
module.exports.getTimeDiff = function (start, end, type) {
	try {
		console.log("start--",start,"end---",end,"type--",type);
		
		var diff = end - start;

		if (type == 'day') {
			diff = Math.floor(diff / 1000 / 60 / 60 / 24);
		} else if (type == 'hour') {
			diff = Math.floor(diff / 1000 / 60 / 60);
		} else if (type == 'minute') {
			diff = Math.floor(diff / 1000 / 60);
		} else {
			diff = Math.floor(diff / 1000);
		}
		console.log("diff--",diff);
		
		return diff;
	}
	catch (e) {
		console.log("Helper helpers getTimeDiff Error", e);
		return new Error('Helper helpers getTimeDiff Error', e);
	}
}

module.exports.loginStatusUpdate = async function (model, playerId, socket_id, status) {
	console.log("playerId", playerId);
	console.log("socket_id", socket_id);
	console.log("status", status);
	await model.User.update({ 'is_login': status, 'socket_id': socket_id }, { where: { 'id': playerId } });
	return true;
}

module.exports.referelCode = function (length) {
	var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var result = '';
	for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}
module.exports.getRandomAlphaString = function (length) {
	var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var result = '';
	for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}