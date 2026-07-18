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
		"siteName": "Bagvertising",
		smtpMailer: {
			host: SMTP_HOST,
			port: SMTP_PORT,
			user: SMTP_USER,
			pass: SMTP_PASS,
			mail_service: "gmail",
			smtp_sender_mail_id: 'admin@bagvertising.com'
		},
		jwt_secret:JSON_WEB || "default_jwt_secret_123",
		jwt_expire:'1h'
	},
	development: {
		"port": SERVER_PORT || 8080,
		"baseUrl": BASE_URL || `http://localhost:${DEFAULT_PORT}`,
		"siteName": "Bagvertising",
		smtpMailer: {
			host: SMTP_HOST,
			port: SMTP_PORT,
			user: SMTP_USER,
			pass: SMTP_PASS,
			mail_service: "gmail",
			smtp_sender_mail_id: 'admin@bagvertising.com'
		},
		jwt_secret:JSON_WEB || "default_jwt_secret_123",
		jwt_expire:'1h'
	},
	twilio: {
        accountSid: TWILIO_ACCOUNT_SID, //"AC56fc04a1506faced412bd0d9236128c3",
        authToken: TWILIO_AUTHTOKEN, //"8c5f237a8bbcfbdd4cdfa8df9ce7eead",
        callerNumber: TWILIO_CALLER_NUMBER,
        otp_max_time: TWILIO_OTP_MAX_TIME,
    },

}
module.exports = config[env]