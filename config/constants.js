const {
	SMTP_HOST,
	SMTP_PORT,
	SMTP_USER,
	SMTP_PASS,
	BASE_URL,
	SERVER_PORT,
	NODE_ENV,
	JSON_WEB,
	TWILIO_ACCOUNT_SID,
TWILIO_AUTHTOKEN,
TWILIO_CALLER_NUMBER,
TWILIO_OTP_MAX_TIME
} = process.env
const env = NODE_ENV || "production"

var config = {
	localhost: {
		"port": SERVER_PORT || 8080,
		"baseUrl": BASE_URL || `http://localhost:${DEFAULT_PORT}`,
		"shareBaseUrl": process.env.SHARE_BASE_URL || BASE_URL || "https://mydomain.com",
		"androidStoreUrl": process.env.ANDROID_STORE_URL || "https://play.google.com/store/apps/details?id=com.bagvertising",
		"iosStoreUrl": process.env.IOS_STORE_URL || "https://apps.apple.com/us/search?term=Bagvertising",
		"siteName": "Bagvertising",
		smtpMailer: {
			host: SMTP_HOST,
			port: SMTP_PORT,
			user: SMTP_USER,
			pass: SMTP_PASS,
			mail_service: "gmail",
			smtp_sender_mail_id: 'admin@bagvertising.com'
		},
		jwt_secret:process.env.JSON_WEB || JSON_WEB || "default_jwt_secret_123",
		jwt_expire:'1h'
	},
	development: {
		"port": SERVER_PORT || 8080,
		"baseUrl": BASE_URL || `http://localhost:${DEFAULT_PORT}`,
		"shareBaseUrl": process.env.SHARE_BASE_URL || BASE_URL || "https://mydomain.com",
		"androidStoreUrl": process.env.ANDROID_STORE_URL || "https://play.google.com/store/apps/details?id=com.bagvertising",
		"iosStoreUrl": process.env.IOS_STORE_URL || "https://apps.apple.com/us/search?term=Bagvertising",
		"siteName": "Bagvertising",
		smtpMailer: {
			host: SMTP_HOST,
			port: SMTP_PORT,
			user: SMTP_USER,
			pass: SMTP_PASS,
			mail_service: "gmail",
			smtp_sender_mail_id: 'admin@bagvertising.com'
		},
		jwt_secret:process.env.JSON_WEB || JSON_WEB || "default_jwt_secret_123",
		jwt_expire:'1h'
	},
	production: {
		"port": SERVER_PORT || 8080,
		"baseUrl": BASE_URL || `http://localhost:${DEFAULT_PORT}`,
		"shareBaseUrl": process.env.SHARE_BASE_URL || BASE_URL || "https://mydomain.com",
		"androidStoreUrl": process.env.ANDROID_STORE_URL || "https://play.google.com/store/apps/details?id=com.bagvertising",
		"iosStoreUrl": process.env.IOS_STORE_URL || "https://apps.apple.com/us/search?term=Bagvertising",
		"siteName": "Bagvertising",
		smtpMailer: {
			host: SMTP_HOST,
			port: SMTP_PORT,
			user: SMTP_USER,
			pass: SMTP_PASS,
			mail_service: "gmail",
			smtp_sender_mail_id: 'admin@bagvertising.com'
		},
		jwt_secret:process.env.JSON_WEB || JSON_WEB || "default_jwt_secret_123",
		jwt_expire:'1h'
	},
	twilio: {
        accountSid: TWILIO_ACCOUNT_SID,
        authToken: TWILIO_AUTHTOKEN,
        callerNumber: TWILIO_CALLER_NUMBER,
        otp_max_time: TWILIO_OTP_MAX_TIME,
    },

}
module.exports = config[env]