const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASSWORD,
  BASE_URL,
  GOOGLE_CLIENT_ID,
  JSON_WEB,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTHTOKEN,
  TWILIO_CALLER_NUMBER,
  TWILIO_OTP_MAX_TIME,
} = process.env;
module.exports = {
  details: {
    name: "247 BET WORLD",
  },
  maxPlayers: 9,
  logger: {
    logFolder: "Log", // Change Your Name With Your Custom Folder
    logFilePrefix: "game",
  },
  defaultUserLogin: {
    name: "Bagvertising",
    email: "bagvertising",
    password: "123456",
  },
  smtpMailer: {
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
    smtp_sender_mail_id: "admin@bagvertising.com",
  },
  googleClientId: GOOGLE_CLIENT_ID,
  baseUrl: BASE_URL,
  forntendUrl: "",
  jwt_secret: JSON_WEB,
  twilio: {
    accountSid: TWILIO_ACCOUNT_SID,
    authToken: TWILIO_AUTHTOKEN,
    callerNumber: TWILIO_CALLER_NUMBER,
    otp_max_time: TWILIO_OTP_MAX_TIME,
  },
};
